import { useState, useEffect, useRef } from 'react';
import { supabaseWhatsAppService, WhatsAppChat, WhatsAppMessage } from '@/services/whatsapp/supabaseIntegration';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { whatsappDebug } from '@/utils/whatsappDebug';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

export const useWhatsApp = () => {
  const [conversations, setConversations] = useState<WhatsAppChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const configured = await supabaseWhatsAppService.isConfigured();
      setIsConfigured(configured);
      
      if (!configured) {
        setError('WhatsApp não configurado');
        return;
      }

      whatsappDebug('📋 [useWhatsApp] Carregando contatos...');

      // 1. Buscar CONTATOS (entidade principal)
      const { data: contatosData, error: contatosError } = await getSupabase()
        .from('contatos_whatsapp')
        .select('*')
        .order('criadoem', { ascending: false });

      if (contatosError) throw contatosError;

      // 2. Buscar todos os chats
      const { data: chatsData, error: chatsError } = await getSupabase()
        .from('chats_whatsapp')
        .select('*')
        .order('atualizadoem', { ascending: false });

      if (chatsError) throw chatsError;

      // 3. Agrupar chats por contato (usuarioid = id do contato)
      const chatsByContato: Record<string, any[]> = {};
      (chatsData || []).forEach(chat => {
        const contatoId = chat.usuarioid;
        if (!chatsByContato[contatoId]) {
          chatsByContato[contatoId] = [];
        }
        chatsByContato[contatoId].push(chat);
      });

      // 4. Buscar última mensagem de cada chat
      const chatIds = (chatsData || []).map(c => c.id);
      const lastMessagesMap: Record<number, string> = {};
      
      if (chatIds.length > 0) {
        const { data: messagesData } = await getSupabase()
          .from('mensagens_whatsapp')
          .select('chatId, message_text, created_at')
          .in('chatId', chatIds)
          .order('created_at', { ascending: false });

        const seenChats = new Set<number>();
        (messagesData || []).forEach(msg => {
          if (!seenChats.has(msg.chatId) && msg.message_text) {
            lastMessagesMap[msg.chatId] = msg.message_text;
            seenChats.add(msg.chatId);
          }
        });
      }

      // 5. Formatar conversas por CONTATO
      const formattedConversations = (contatosData || []).map(contato => {
        const contatoChats = chatsByContato[contato.id] || [];
        const activeChat = contatoChats.find(c => c.ativo && !c.resolvido);
        const mostRecentChat = activeChat || contatoChats[0];

        return {
          id: contato.id,
          contatoId: contato.id,
          chatId: mostRecentChat?.id,
          usuarioId: contato.id,
          nome: contato.nome || `Usuário ${contato.telefone}`,
          telefone: contato.telefone || '',
          picture: contato.perfil,
          email: contato.email,
          chatbotDesabilitado: contato.chatbot_desabilitado,
          filas: mostRecentChat?.filas,
          modoDeAtendimento: mostRecentChat?.mododeatendimento || 'Bot',
          aceitoPorAdmin: mostRecentChat?.aceitoporadmin || false,
          adminId: mostRecentChat?.adminid,
          ativo: mostRecentChat?.ativo ?? false,
          resolvido: mostRecentChat?.resolvido ?? true,
          iniciadoEm: mostRecentChat?.criadoem ? new Date(mostRecentChat.criadoem) : undefined,
          criadoEm: mostRecentChat?.criadoem ? new Date(mostRecentChat.criadoem) : undefined,
          encerradoEm: mostRecentChat?.encerradoem ? new Date(mostRecentChat.encerradoem) : undefined,
          podeEnviarMensagem: mostRecentChat?.mododeatendimento === 'Atendimento Humano' && mostRecentChat?.aceitoporadmin,
          lastMessage: mostRecentChat ? lastMessagesMap[mostRecentChat.id] || '' : '',
          hasActiveChat: !!activeChat,
          chatsCount: contatoChats.length
        };
      });

      formattedConversations.sort((a, b) => {
        if (a.hasActiveChat && !b.hasActiveChat) return -1;
        if (!a.hasActiveChat && b.hasActiveChat) return 1;
        const dateA = a.criadoEm?.getTime() || 0;
        const dateB = b.criadoEm?.getTime() || 0;
        return dateB - dateA;
      });

      whatsappDebug(`📋 [useWhatsApp] ${formattedConversations.length} conversas formatadas`);
      setConversations(formattedConversations as any);
      
    } catch (error) {
      console.error('Erro ao carregar conversas WhatsApp:', error);
      setError('Erro ao carregar conversas');
      notify.error("Erro", "Não foi possível carregar as conversas do WhatsApp.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string): Promise<WhatsAppMessage[]> => {
    try {
      const messages = await supabaseWhatsAppService.getChatMessages(chatId);
      return messages;
    } catch (error) {
      console.error('Erro ao carregar mensagens WhatsApp:', error);
      notify.error("Erro", "Não foi possível carregar as mensagens.");
      return [];
    }
  };

  const sendMessage = async (messageData: Omit<WhatsAppMessage, 'id' | 'enviadoEm'>): Promise<boolean> => {
    try {
      await supabaseWhatsAppService.sendMessage(messageData);
      notify.success("Sucesso", "Mensagem enviada com sucesso!");
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      notify.error("Erro", "Não foi possível enviar a mensagem.");
      return false;
    }
  };

  const acceptCall = async (chatId: string, adminId: string): Promise<boolean> => {
    try {
      await supabaseWhatsAppService.acceptChat(chatId, adminId);
      notify.success("Sucesso", "Chamado aceito com sucesso!");
      await loadConversations();
      return true;
    } catch (error) {
      console.error('Erro ao aceitar chamado WhatsApp:', error);
      notify.error("Erro", "Não foi possível aceitar o chamado.");
      return false;
    }
  };

  const closeConversation = async (chatId: string, adminId: number): Promise<boolean> => {
    try {
      await supabaseWhatsAppService.closeChat(chatId, adminId);
      notify.success("Sucesso", "Conversa encerrada com sucesso!");
      await loadConversations();
      return true;
    } catch (error) {
      console.error('Erro ao encerrar conversa WhatsApp:', error);
      notify.error("Erro", "Não foi possível encerrar a conversa.");
      return false;
    }
  };

  const refreshConfig = async () => {
    await supabaseWhatsAppService.reloadConfig();
    await loadConversations();
  };

  // Referências para canais Realtime
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    loadConversations();

    // Realtime usa cliente autenticado para compatibilidade com RLS
    const realtimeClient = getRealtimeClient();
    
    const contatosChannel = realtimeClient
      .channel('contatos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contatos_whatsapp' }, (payload) => {
        whatsappDebug('📋 [useWhatsApp] contatos realtime event');
        loadConversations();
      })
      .subscribe((status, err) => {
        whatsappDebug(`📋 [useWhatsApp] contatos channel status: ${status}`);
      });

    const chatsChannel = realtimeClient
      .channel('chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats_whatsapp' }, (payload) => {
        whatsappDebug('📋 [useWhatsApp] chats realtime event');
        loadConversations();
      })
      .subscribe((status, err) => {
        whatsappDebug(`📋 [useWhatsApp] chats channel status: ${status}`);
      });

    const messagesChannel = realtimeClient
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_whatsapp' }, (payload) => {
        whatsappDebug('📋 [useWhatsApp] messages realtime event');
        loadConversations();
      })
      .subscribe((status, err) => {
        whatsappDebug(`📋 [useWhatsApp] messages channel status: ${status}`);
      });

    channelsRef.current = [contatosChannel, chatsChannel, messagesChannel];

    return () => {
      channelsRef.current.forEach(channel => {
        realtimeClient.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, []);

  return {
    conversations,
    isLoading,
    isConfigured,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    acceptCall,
    closeConversation,
    refreshConfig
  };
};
