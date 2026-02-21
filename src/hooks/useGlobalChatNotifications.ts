import { useEffect, useRef } from 'react';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { playGlobalNotificationSound } from '@/contexts/SoundNotificationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '@/hooks/useCustomNotifications';

export const useGlobalChatNotifications = () => {
  const { user } = useUnifiedAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notification = useNotification();

  const userChatsRef = useRef<Map<string, string>>(new Map());
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.supabase_id) return;

    let mounted = true;

    const loadUserChats = async () => {
      try {
        const authClient = requireAuthenticatedClient();
        const { data: participacoes, error } = await authClient
          .from('usuarios_chat_interno')
          .select('chat_id')
          .eq('user_id', user.supabase_id);

        if (error) return;
        if (!mounted) return;

        const chatIds = (participacoes || []).map(p => p.chat_id);
        
        if (chatIds.length === 0) {
          userChatsRef.current.clear();
          return;
        }

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
      } catch {
        // Silent fail
      }
    };

    loadUserChats();

    const realtimeClient = getRealtimeClient();

    const userChatsChannel = realtimeClient
      .channel(`global-user-chats-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios_chat_interno',
          filter: `user_id=eq.${user.supabase_id}`,
        },
        () => {
          loadUserChats();
        }
      )
      .subscribe();

    const messagesChannel = realtimeClient
      .channel(`global-chat-notifications-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat_interno',
        },
        async (payload) => {
          const newMessage = payload.new as any;

          const chatId = newMessage?.chat_id as string | undefined;
          const senderId = newMessage?.sender_id as string | undefined;

          if (!chatId || !senderId) return;
          if (senderId === user.supabase_id) return;

          const chatTitulo = userChatsRef.current.get(chatId);

          if (!chatTitulo) {
            try {
              const authClient = requireAuthenticatedClient();
              const { data: membership, error } = await authClient
                .from('usuarios_chat_interno')
                .select('id')
                .eq('chat_id', chatId)
                .eq('user_id', user.supabase_id)
                .maybeSingle();

              if (error || !membership?.id) return;
              loadUserChats();
            } catch {
              return;
            }
          }

          const currentPath = pathnameRef.current;
          const isInChatPage = currentPath.includes(`/chatinterno/${chatId}`);

          if (!isInChatPage) {
            playGlobalNotificationSound();

            try {
              const authClient = requireAuthenticatedClient();
              const { data: senderData } = await authClient
                .from('usuarios')
                .select('nome')
                .eq('supabase_id', senderId)
                .single();

              const senderName = senderData?.nome || 'Alguém';
              const titulo = chatTitulo || 'Chat Interno';
              const messagePreview = newMessage.message?.length > 50
                ? newMessage.message.substring(0, 50) + '...'
                : newMessage.message || 'Nova mensagem';

              notification.info(`${titulo}: ${senderName}`, {
                message: messagePreview,
                duration: 6000,
                onClick: () => navigate(`/chatinterno/${chatId}`)
              });
            } catch {
              // Silent fail
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      realtimeClient.removeChannel(userChatsChannel);
      realtimeClient.removeChannel(messagesChannel);
    };
  }, [user?.supabase_id, notification, navigate]);
};
