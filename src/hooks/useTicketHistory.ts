import { useState, useEffect, useCallback, useRef } from 'react';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Message, Ticket } from '@/services/ticketService';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';

interface ChatInfo {
  id: number;
  criadoem: string;
  atualizadoem: string;
}

// Tipos de mídia
const MEDIA_TYPES = ['image', 'audio', 'video', 'document', 'sticker'];

// Função para mapear mensagem do banco para formato Message
const mapDbMessageToMessage = (msg: any, chatId: string, quotedMessagesMap?: Map<string, any>): Message => {
  const isFromMe = msg.send !== 'cliente';
  
  // Tipos de mídia que usam message_text como URL de storage
  const isMediaType = MEDIA_TYPES.includes(msg.message_type);

  // Para mídia: message_text contém a URL do storage (salvo pelo n8n)
  // Fallback: message_data.storageUrl ou metadata.storageUrl
  let finalMediaUrl: string | undefined;
  if (isMediaType) {
    const messageText = msg.message_text || '';
    if (messageText.startsWith('http')) {
      finalMediaUrl = messageText;
    } else {
      finalMediaUrl = msg.message_data?.storageUrl || msg.metadata?.storageUrl;
    }
  }

  // Caption/legenda para mídia
  const caption = msg.message_data?.caption || msg.message_data?.media?.caption || '';
  
  // Body da mensagem:
  // - Para texto: usar message_text
  // - Para mídia: usar caption (não mostrar URL como texto)
  let body = '';
  if (isMediaType) {
    body = caption;
  } else if (msg.message_type === 'interactive') {
    body = msg.message_data?.interactive?.body?.text || msg.message_text || '';
  } else {
    body = msg.message_text || '';
  }

  // Extrair mensagem citada (quotedMsg) do reply_to_message_id
  let quotedMsg: Message | undefined = undefined;
  if (msg.reply_to_message_id) {
    // Buscar mensagem original no Map (buscada previamente em batch)
    const quotedData = quotedMessagesMap?.get(msg.reply_to_message_id);
    
    if (quotedData) {
      // Mensagem encontrada no banco - usar dados reais
      const isQuotedFromMe = quotedData.send !== 'cliente';
      const quotedIsMedia = MEDIA_TYPES.includes(quotedData.message_type);
      const quotedCaption = quotedData.message_data?.caption || quotedData.message_data?.media?.caption || '';
      
      quotedMsg = {
        id: quotedData.id, // UUID real para scroll funcionar
        ticketId: chatId,
        body: quotedData.message_text || quotedCaption || (quotedIsMedia ? `[${quotedData.message_type}]` : ''),
        fromMe: isQuotedFromMe,
        mediaType: quotedIsMedia ? quotedData.message_type : undefined,
        read: true,
        createdAt: quotedData.created_at || quotedData.received_at || ''
      };
    } else {
      // Fallback: usar dados do contexto ou placeholder
      const contextData = msg.message_data?.context?.quoted_message || {};
      quotedMsg = {
        id: msg.reply_to_message_id, // message_id (wamid) - scroll vai tentar por data-message-id
        ticketId: chatId,
        body: contextData.body || 'Mensagem não encontrada',
        fromMe: contextData.fromMe ?? false,
        mediaType: contextData.type,
        read: true,
        createdAt: ''
      };
    }
  }

  return {
    id: msg.id,
    ticketId: chatId,
    body,
    fromMe: isFromMe,
    read: true,
    mediaType: isMediaType ? msg.message_type : undefined,
    mediaUrl: finalMediaUrl,
    createdAt: msg.created_at || msg.received_at,
    ack: isFromMe ? 3 : undefined,
    isPrivate: msg.metadata?.isPrivate === true,
    isDeleted: msg.is_deleted === true,
    isEdited: msg.is_edited === true,
    quotedMsg,
    rawData: msg
  } as Message & { rawData?: any };
};

export const useTicketHistory = (ticket: Ticket | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { hasPermission } = usePermissionGuard();
  const chatIdsRef = useRef<number[]>([]);
  const hasLoadedRef = useRef(false);
  const prevTicketIdRef = useRef<string | null>(null);
  
  // Verificar se tem permissão para ver histórico
  const canSeeHistory = hasPermission('admin.whatsapp.historico');

  // Limpar mensagens IMEDIATAMENTE quando ticket mudar
  useEffect(() => {
    if (ticket?.id !== prevTicketIdRef.current) {
      if (isWhatsAppDebugEnabled()) {
        console.debug('🔄 [useTicketHistory] Ticket mudou, limpando mensagens imediatamente');
      }
      setMessages([]); // Limpar mensagens antigas IMEDIATAMENTE
      hasLoadedRef.current = false; // Reset para mostrar loading
      prevTicketIdRef.current = ticket?.id || null;
    }
  }, [ticket?.id]);

  // Adicionar mensagem otimista (aparece imediatamente antes de enviar)
  const addOptimisticMessage = useCallback((body: string, isPrivate: boolean, senderName?: string) => {
    // Aplicar assinatura igual ao ticketService faz para manter consistência
    let finalBody = body;
    if (senderName && !isPrivate) {
      finalBody = `*${senderName}:*\n${body}`;
    }
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      ticketId: String(ticket?.chatId || ticket?.id),
      body: finalBody,
      fromMe: true,
      read: false,
      createdAt: new Date().toISOString(),
      ack: 0, // Relógio (pendente)
      isPrivate
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    return optimisticMessage.id;
  }, [ticket?.chatId, ticket?.id]);

  // Remover mensagem otimista (em caso de erro)
  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages(prev => prev.filter(m => m.id !== tempId));
  }, []);

  // Carregar mensagens apenas uma vez quando o ticket muda
  const loadMessages = useCallback(async () => {
    if (!ticket) {
      setMessages([]);
      setChats([]);
      chatIdsRef.current = [];
      setIsInitialLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    // Só mostrar loading na primeira carga
    if (!hasLoadedRef.current) {
      setIsInitialLoading(true);
    }
    
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar todos os chats do contato
      const { data: allChats, error: chatsError } = await supabase
        .from('chats_whatsapp')
        .select('id, criadoem, atualizadoem')
        .eq('usuarioid', ticket.contactId || ticket.id)
        .order('criadoem', { ascending: false });

      if (chatsError) throw chatsError;

      // Se não pode ver histórico, pegar só o primeiro (mais recente)
      const chatsToLoad = canSeeHistory ? allChats : allChats?.slice(0, 1);
      
      setChats(chatsToLoad || []);
      chatIdsRef.current = (chatsToLoad || []).map(c => c.id);

      if (!chatsToLoad || chatsToLoad.length === 0) {
        setMessages([]);
        return;
      }

      // Buscar mensagens de todos os chats permitidos
      const chatIds = chatsToLoad.map(c => c.id);
      const { data: messagesData, error: messagesError } = await supabase
        .from('mensagens_whatsapp')
        .select('*')
        .in('chatId', chatIds)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Coletar reply_to_message_ids únicos para buscar mensagens citadas
      const replyToIds = [...new Set(
        (messagesData || [])
          .filter(msg => msg.reply_to_message_id)
          .map(msg => msg.reply_to_message_id)
      )];

      // Buscar mensagens originais pelo message_id (batch query)
      let quotedMessagesMap = new Map<string, any>();
      
      if (replyToIds.length > 0) {
        const { data: quotedData } = await supabase
          .from('mensagens_whatsapp')
          .select('*')
          .in('message_id', replyToIds);

        if (quotedData) {
          quotedData.forEach(msg => {
            quotedMessagesMap.set(msg.message_id, msg);
          });
        }
      }

      const formattedMessages = (messagesData || []).map(msg => 
        mapDbMessageToMessage(msg, String(msg.chatId), quotedMessagesMap)
      );

      setMessages(formattedMessages);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Erro ao carregar histórico de mensagens:', error);
      setMessages([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [ticket?.id, ticket?.contactId, canSeeHistory]);

  // Carregar mensagens quando ticket mudar
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime para novas mensagens - separado do carregamento inicial
  useEffect(() => {
    if (!ticket) return;

    const contactId = ticket.contactId || ticket.id;
    const realtimeClient = getRealtimeClient();
    let channel: ReturnType<typeof realtimeClient.channel> | null = null;
    let isSubscribed = true;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isReconnecting = false;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let channelStatus: string = 'INITIAL';
    const debug = isWhatsAppDebugEnabled();
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 2000; // 2 seconds
    const POLLING_INTERVAL = 10000; // 10 seconds fallback polling

    const getReconnectDelay = (attempt: number) => {
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 32000);
    };

    // Fallback polling function when Realtime is unstable
    const startPolling = () => {
      if (pollingInterval) return; // Already polling
      
      if (debug) {
        console.debug('[useTicketHistory] 🔄 Starting fallback polling due to Realtime instability');
      }
      
      pollingInterval = setInterval(async () => {
        if (!isSubscribed || channelStatus === 'SUBSCRIBED') {
          stopPolling();
          return;
        }
        
        if (debug) {
          console.debug('[useTicketHistory] 🔄 Polling for new messages...');
        }
        
        try {
          const supabaseClient = requireAuthenticatedClient();
          const chatIds = chatIdsRef.current;
          
          if (chatIds.length === 0) return;
          
          const { data: latestMessages } = await supabaseClient
            .from('mensagens_whatsapp')
            .select('*')
            .in('chatId', chatIds)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (latestMessages && latestMessages.length > 0) {
            setMessages(prev => {
              let updated = [...prev];
              let hasNewMessages = false;
              
              for (const msg of latestMessages) {
                if (!updated.some(m => m.id === msg.id)) {
                  updated.push(mapDbMessageToMessage(msg, String(msg.chatId)));
                  hasNewMessages = true;
                }
              }
              
              if (hasNewMessages) {
                // Sort estável por createdAt + received_at + id como desempate
                updated.sort((a, b) => {
                  const tA = new Date(a.createdAt).getTime();
                  const tB = new Date(b.createdAt).getTime();
                  if (tA !== tB) return tA - tB;
                  const rA = new Date((a as any).rawData?.received_at || a.createdAt).getTime();
                  const rB = new Date((b as any).rawData?.received_at || b.createdAt).getTime();
                  if (rA !== rB) return rA - rB;
                  return String(a.id).localeCompare(String(b.id));
                });
                if (debug) {
                  console.debug('[useTicketHistory] ✅ Polling found new messages');
                }
              }
              
              return hasNewMessages ? updated : prev;
            });
          }
        } catch (error) {
          console.error('[useTicketHistory] Polling error:', error);
        }
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        if (debug) {
          console.debug('[useTicketHistory] ⏹️ Stopping fallback polling');
        }
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const setupRealtimeChannel = (chatIds: number[]) => {
      if (!isSubscribed || chatIds.length === 0) return null;
      
      // Atualizar ref com chatIds permitidos
      chatIdsRef.current = chatIds;
      
      // Nome de canal estável (sem Date.now())
      const channelName = `ticket-messages-${contactId}`;
      
      if (debug) {
        console.debug(`[useTicketHistory] 📡 Setting up channel: ${channelName} for chatIds:`, chatIds);
      }
      
      // Verificar se canal já existe e remover antes de criar novo
      const existingChannel = realtimeClient.getChannels().find(c => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        realtimeClient.removeChannel(existingChannel);
      }

      // Criar canal SEM FILTRO - filtrar no código usando chatIdsRef
      const messagesChannel = realtimeClient.channel(channelName);
      
      messagesChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        (payload) => {
          if (!isSubscribed) return;
          const newMsg = payload.new as any;
          
          // FILTRAR NO CÓDIGO - verificar se chatId está na lista permitida
          if (!chatIdsRef.current.includes(newMsg.chatId)) {
            return;
          }
          
          setMessages(prev => {
            // Evitar duplicatas por ID real
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            
            const newMsgMapped = mapDbMessageToMessage(newMsg, String(newMsg.chatId));
            const now = Date.now();
            
            // Encontrar mensagem otimista correspondente
            const optimisticIndex = prev.findIndex(m => {
              if (!m.id.toString().startsWith('temp-')) return false;
              const tempTimestamp = parseInt(m.id.toString().replace('temp-', ''));
              if (now - tempTimestamp > 30000) return false;
              if (m.fromMe !== newMsgMapped.fromMe) return false;
              if (m.isPrivate !== newMsgMapped.isPrivate) return false;
              return m.body === newMsgMapped.body;
            });
            
            if (optimisticIndex !== -1) {
              const newMessages = [...prev];
              newMessages[optimisticIndex] = newMsgMapped;
              return newMessages;
            }
            
            // Inserir em ordem correta por createdAt + received_at + id
            const updated = [...prev, newMsgMapped];
            updated.sort((a, b) => {
              const tA = new Date(a.createdAt).getTime();
              const tB = new Date(b.createdAt).getTime();
              if (tA !== tB) return tA - tB;
              const rA = new Date((a as any).rawData?.received_at || a.createdAt).getTime();
              const rB = new Date((b as any).rawData?.received_at || b.createdAt).getTime();
              if (rA !== rB) return rA - rB;
              return String(a.id).localeCompare(String(b.id));
            });
            return updated;
          });
        }
      );
      
      messagesChannel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        (payload) => {
          if (!isSubscribed) return;
          const updatedMsg = payload.new as any;
          
          // FILTRAR NO CÓDIGO
          if (!chatIdsRef.current.includes(updatedMsg.chatId)) {
            return;
          }
          
          setMessages(prev =>
            prev.map(m => 
              m.id === updatedMsg.id 
                ? mapDbMessageToMessage(updatedMsg, String(updatedMsg.chatId))
                : m
            )
          );
        }
      );

      messagesChannel.subscribe((status) => {
        channelStatus = status;
        
        if (debug) {
          console.debug(`[useTicketHistory] 📡 Channel status: ${status}`);
        }
        
        if (status === 'SUBSCRIBED') {
          // Reset reconnect attempts on successful connection
          reconnectAttempts = 0;
          // Stop polling when Realtime is working
          stopPolling();
        }

        // Reconectar automaticamente se o canal for fechado
        if ((status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && isSubscribed && !isReconnecting) {
          // Start polling as fallback
          startPolling();
          
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ [useTicketHistory] Limite de reconexões atingido, usando polling como fallback');
            return;
          }

          const delay = getReconnectDelay(reconnectAttempts);
          reconnectAttempts++;

          if (debug) {
            console.debug(
              `⚠️ [useTicketHistory] Canal fechado, tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} em ${delay / 1000}s...`
            );
          }

          // Cancelar timeout anterior se existir
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }

          reconnectTimeout = setTimeout(() => {
            if (!isSubscribed) return;

            isReconnecting = true;
            realtimeClient
              .removeChannel(messagesChannel)
              .finally(() => {
                isReconnecting = false;
                reconnectTimeout = null;

                if (isSubscribed && chatIdsRef.current.length > 0) {
                  channel = setupRealtimeChannel(chatIdsRef.current);
                }
              });
          }, delay);
        }
      });

      return messagesChannel;
    };

    // Buscar chatIds e configurar realtime
    const initializeRealtime = async () => {
      try {
        const supabaseClient = requireAuthenticatedClient();
        // Buscar todos os chatIds deste contato para o realtime
        const { data: chatsData } = await supabaseClient
          .from('chats_whatsapp')
          .select('id')
          .eq('usuarioid', contactId)
          .order('atualizadoem', { ascending: false });
        
        const chatIds = chatsData?.map(c => c.id) || [];
        
        // Se tem o chatId do ticket e não está na lista, adicionar
        if (ticket.chatId && !chatIds.includes(ticket.chatId)) {
          chatIds.unshift(ticket.chatId);
        }
        
        if (debug) {
          console.debug('[useTicketHistory] 🚀 Initializing Realtime for chatIds:', chatIds);
        }
        
        if (chatIds.length > 0 && isSubscribed) {
          channel = setupRealtimeChannel(canSeeHistory ? chatIds : chatIds.slice(0, 1));
        }
      } catch (error) {
        console.error('[useTicketHistory] Error initializing realtime:', error);
        // Start polling as fallback if realtime init fails
        startPolling();
      }
    };

    initializeRealtime();

    return () => {
      isSubscribed = false;
      stopPolling();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        realtimeClient.removeChannel(channel);
      }
    };
  }, [ticket?.id, ticket?.contactId, canSeeHistory]);

  return {
    messages,
    chats,
    isLoading: isInitialLoading,
    canSeeHistory,
    refetch: loadMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
    totalChats: chats.length
  };
};
