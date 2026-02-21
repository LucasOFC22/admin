import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from './UnifiedAuthContext';
import { useNotification } from '@/hooks/useCustomNotifications';
import { playGlobalNotificationSound } from './SoundNotificationContext';

interface ChatInternoNotificationContextType {
  // Context apenas para gerenciar o listener global
}

const ChatInternoNotificationContext = createContext<ChatInternoNotificationContextType | undefined>(undefined);

export const ChatInternoNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUnifiedAuth();
  const notification = useNotification();
  const location = useLocation();
  
  // Ref para armazenar os chats que o usuário participa
  const userChatsRef = useRef<Map<string, string>>(new Map()); // chatId -> titulo
  
  // Extrair chatId da URL atual
  const getCurrentChatId = (): string | null => {
    const match = location.pathname.match(/\/admin\/chatinterno\/([^/]+)/);
    return match ? match[1] : null;
  };

  // Carregar chats do usuário
  useEffect(() => {
    if (!user?.supabase_id) {
      userChatsRef.current.clear();
      return;
    }

    const loadUserChats = async () => {
      try {
        const authClient = requireAuthenticatedClient();
        // Buscar todos os chats onde o usuário é participante
        const { data: participacoes } = await authClient
          .from('usuarios_chat_interno')
          .select('chat_id')
          .eq('user_id', user.supabase_id);

        if (!participacoes) return;

        const chatIds = participacoes.map(p => p.chat_id);
        
        if (chatIds.length === 0) return;

        // Buscar títulos dos chats
        const { data: chats } = await authClient
          .from('chats_internos')
          .select('id, titulo')
          .in('id', chatIds);

        if (chats) {
          userChatsRef.current.clear();
          chats.forEach(chat => {
            userChatsRef.current.set(chat.id, chat.titulo);
          });
        }
      } catch (error) {
        // Erro silencioso
      }
    };

    loadUserChats();

    // Escutar mudanças na tabela de participantes para atualizar chats
    if (!REALTIME_ENABLED) return;
    
    const participantChannel = supabase
      .channel(`user-chats-notification-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios_chat_interno',
          filter: `user_id=eq.${user.supabase_id}`
        },
        () => {
          loadUserChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantChannel);
    };
  }, [user?.supabase_id]);

  // NOTA: O listener global de mensagens foi movido para useGlobalChatNotifications
  // Este contexto agora serve apenas para manter a lista de chats do usuário atualizada

  return (
    <ChatInternoNotificationContext.Provider value={{}}>
      {children}
    </ChatInternoNotificationContext.Provider>
  );
};

export const useChatInternoNotification = () => {
  const context = useContext(ChatInternoNotificationContext);
  if (!context) {
    throw new Error('useChatInternoNotification must be used within ChatInternoNotificationProvider');
  }
  return context;
};
