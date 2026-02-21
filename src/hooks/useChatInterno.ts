import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';
import { chatInternoService, ChatInterno, MensagemChatInterno } from '@/services/chatInterno/chatInternoService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { playGlobalNotificationSound } from '@/contexts/SoundNotificationContext';

export const useChatInterno = (chatId?: string) => {
  const { user } = useUnifiedAuth();
  const [chats, setChats] = useState<ChatInterno[]>([]);
  const [messages, setMessages] = useState<MensagemChatInterno[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Ref para saber qual chat está aberto atualmente (para evitar som quando já está no chat)
  const currentChatIdRef = useRef<string | undefined>(chatId);

  // Atualizar ref quando chatId mudar
  useEffect(() => {
    currentChatIdRef.current = chatId;
  }, [chatId]);

  // Atualizar apenas a contagem de unreads de um chat específico (silencioso)
  const updateChatUnreadCount = useCallback((chatIdToUpdate: string, newUnreadCount: number) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatIdToUpdate 
        ? { ...chat, unreadCount: newUnreadCount }
        : chat
    ));
  }, []);

  // Carregar chats do usuário usando supabase_id (UUID)
  useEffect(() => {
    if (!user?.supabase_id) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    const loadChats = async () => {
      try {
        setIsLoadingChats(true);
        const chatsData = await chatInternoService.getChatsDoUsuario(user.supabase_id);
        setChats(chatsData);
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();

    // Configurar realtime para novos chats (apenas INSERT/DELETE)
    if (!REALTIME_ENABLED) return;
    
    const chatsChannel = supabase
      .channel(`user-chats-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats_internos'
        },
        () => {
          loadChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats_internos'
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    // Realtime para contagem de unreads (atualização silenciosa apenas do badge)
    const unreadsChannel = supabase
      .channel(`user-unreads-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios_chat_interno',
          filter: `user_id=eq.${user.supabase_id}`
        },
        (payload) => {
          const updatedData = payload.new as { chat_id: string; unreads: number };
          updateChatUnreadCount(updatedData.chat_id, updatedData.unreads);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
      supabase.removeChannel(unreadsChannel);
    };
  }, [user?.supabase_id, updateChatUnreadCount]);

  // Carregar mensagens do chat selecionado
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const messagesData = await chatInternoService.getMensagens(chatId);
        setMessages(messagesData);

        // Marcar como lido usando supabase_id (UUID)
        if (user?.supabase_id) {
          await chatInternoService.marcarComoLido(chatId, user.supabase_id);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Configurar realtime para novas mensagens
    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat_interno',
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          const isFromOtherUser = newMessage.sender_id !== user?.supabase_id;
          const isCurrentChatOpen = currentChatIdRef.current === chatId;
          
          // Evitar duplicar mensagens otimísticas
          setMessages((prev) => {
            const exists = prev.some(m => 
              m.id === newMessage.id || 
              (m.message === newMessage.message && m.sender_id === newMessage.sender_id)
            );
            
            if (exists && newMessage.id.startsWith('temp-')) {
              return prev;
            }
            
            // Substituir mensagem temporária pela real
            const filtered = prev.filter(m => !m.id.startsWith('temp-'));
            
            return [...filtered, {
              ...newMessage,
              sender_name: newMessage.sender_name || 'Usuário'
            }];
          });

          // Se a mensagem é de outro usuário
          if (isFromOtherUser && user?.supabase_id) {
            // Se o chat está aberto, marcar como lido silenciosamente
            if (isCurrentChatOpen) {
              await chatInternoService.marcarComoLido(chatId, user.supabase_id);
            } else {
              // Se não está no chat, tocar som
              playGlobalNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.supabase_id]);

  // Notificações globais agora são gerenciadas pelo ChatInternoNotificationProvider

  const enviarMensagem = async (message: string) => {
    if (!chatId || !user?.supabase_id) return;

    // Adicionar mensagem otimisticamente
    const optimisticMessage: MensagemChatInterno = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.supabase_id,
      sender_name: user.nome || 'Você',
      message,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await chatInternoService.enviarMensagem(chatId, user.supabase_id, message);
    } catch (error) {
      // Remover mensagem otimística em caso de erro
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
      throw error;
    }
  };

  const criarChat = async (titulo: string, userIds: string[]) => {
    if (!user?.supabase_id) return;

    try {
      const newChat = await chatInternoService.criarChat(titulo, user.supabase_id, userIds);
      
      // Atualizar lista de chats imediatamente
      if (newChat) {
        setChats((prev) => [newChat, ...prev]);
      }
      
      return newChat;
    } catch (error) {
      throw error;
    }
  };

  const editarChat = async (chatId: string, titulo: string, userIds: string[]) => {
    try {
      await chatInternoService.editarChat(chatId, titulo, userIds);
      
      // Atualizar lista de chats
      setChats((prev) => prev.map(chat => 
        chat.id === chatId ? { ...chat, titulo } : chat
      ));
    } catch (error) {
      throw error;
    }
  };

  const excluirChat = async (chatId: string) => {
    try {
      await chatInternoService.excluirChat(chatId);
      
      // Remover da lista
      setChats((prev) => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      throw error;
    }
  };

  const buscarParticipantes = async (chatId: string) => {
    return chatInternoService.buscarParticipantes(chatId);
  };

  return {
    chats,
    messages,
    isLoadingChats,
    isLoadingMessages,
    enviarMensagem,
    criarChat,
    editarChat,
    excluirChat,
    buscarParticipantes
  };
};
