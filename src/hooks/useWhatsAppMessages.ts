import { useState, useEffect, useCallback, useRef } from 'react';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { WhatsAppMessage, supabaseWhatsAppService } from '@/services/whatsapp/supabaseIntegration';
import { whatsappDebug } from '@/utils/whatsappDebug';

// Intervalo de polling quando realtime não está funcionando (15 segundos)
const POLLING_INTERVAL = 15000;

export const useWhatsAppMessages = (usuarioId: string | undefined) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatIds, setChatIds] = useState<number[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  
  // Refs para cleanup
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Função para carregar mensagens
  const loadMessages = useCallback(async () => {
    if (!usuarioId) {
      setMessages([]);
      setChatIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const authClient = requireAuthenticatedClient();
      
      // Buscar os chatIds do usuário
      const { data: chatsData } = await authClient
        .from('chats_whatsapp')
        .select('id')
        .eq('usuarioid', usuarioId);
      
      const userChatIds = (chatsData || []).map(chat => chat.id);
      setChatIds(userChatIds);

      // Buscar TODAS as mensagens do contato
      const messagesData = await supabaseWhatsAppService.getMessagesByUsuarioId(usuarioId);
      
      // Atualizar ref com último ID para dedupe
      if (messagesData.length > 0) {
        lastMessageIdRef.current = messagesData[messagesData.length - 1].id;
      }
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [usuarioId]);

  // Carregar mensagens inicialmente
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Configurar realtime para escutar mensagens usando chatId
  useEffect(() => {
    if (chatIds.length === 0) {
      return;
    }

    const realtimeClient = getRealtimeClient();

    const channel = realtimeClient
      .channel(`user-messages-${usuarioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Verificar se a mensagem pertence a um dos chats do usuário
          if (chatIds.includes(newMsg.chatId)) {
            whatsappDebug(`📩 [useWhatsAppMessages] Realtime INSERT received: ${newMsg.id}`);
            
            // Usa coluna 'send' para determinar o tipo (cliente, atendente, flowbuilder, sistema)
            const send = newMsg.send || 'cliente';
            const tipo = send === 'cliente' ? 'cliente' : 'atendente';
            const newMessage: WhatsAppMessage = {
              id: newMsg.id,
              chatId: String(newMsg.chatId),
              usuarioId: newMsg.metadata?.usuarioId || '',
              mensagem: newMsg.message_text || '',
              tipo,
              enviadoEm: new Date(newMsg.created_at || newMsg.received_at),
              text: newMsg.message_type === 'text'
            };
            
            setMessages((prev) => {
              // Evitar duplicatas
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          
          if (chatIds.includes(updatedMsg.chatId)) {
            whatsappDebug(`📩 [useWhatsAppMessages] Realtime UPDATE received: ${updatedMsg.id}`);
            
            // Usa coluna 'send' para determinar o tipo
            const send = updatedMsg.send || 'cliente';
            const tipo = send === 'cliente' ? 'cliente' : 'atendente';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMsg.id
                  ? {
                      id: updatedMsg.id,
                      chatId: String(updatedMsg.chatId),
                      usuarioId: updatedMsg.metadata?.usuarioId || msg.usuarioId,
                      mensagem: updatedMsg.message_text || '',
                      tipo,
                      enviadoEm: new Date(updatedMsg.created_at || updatedMsg.received_at),
                      text: updatedMsg.message_type === 'text'
                    }
                  : msg
              )
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          // Para polling quando realtime conecta
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[Realtime:Messages] Canal com problema: ${status}`, err);
          setRealtimeConnected(false);
          // Inicia polling fallback
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(() => {
              whatsappDebug('📩 [useWhatsAppMessages] Polling fallback');
              loadMessages();
            }, POLLING_INTERVAL);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        realtimeClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chatIds, usuarioId, loadMessages]);

  return { messages, isLoading, refetch: loadMessages, realtimeConnected };
};
