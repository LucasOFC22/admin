import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUserFilas } from '@/hooks/useUserFilas';
import { formatMessagePreview } from '@/utils/messagePreview';

export interface WhatsAppUnreadChat {
  chatId: number;
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatInternoUnread {
  chatId: string;
  titulo: string;
  lastMessage: string;
  senderName: string;
  unreadCount: number;
  updatedAt: string;
}

export interface WhatsAppPendingChat {
  chatId: number;
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  messageCount: number;
  waitingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  filas: string;
}

export interface WhatsAppPriorityChat {
  chatId: number;
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastClientMessageAt: string;
  waitingMinutes: number;
  priorityLevel: 'critico' | 'alto' | 'medio' | 'baixo';
  priorityOrder: number;
  chatType: 'pending' | 'open';
  adminId: string | null;
  filas: string;
}

export interface NotificationCenterData {
  whatsapp: WhatsAppUnreadChat[];
  chatInterno: ChatInternoUnread[];
  pendingChats: WhatsAppPendingChat[];
  priorityChats: WhatsAppPriorityChat[];
  totalCount: number;
  isLoading: boolean;
}

export const getPriorityColor = (level: WhatsAppPriorityChat['priorityLevel']) => {
  switch (level) {
    case 'critico':
      return 'bg-red-500 text-white';
    case 'alto':
      return 'bg-orange-500 text-white';
    case 'medio':
      return 'bg-yellow-500 text-black';
    case 'baixo':
      return 'bg-green-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPriorityLabel = (level: WhatsAppPriorityChat['priorityLevel']) => {
  switch (level) {
    case 'critico':
      return 'Crítico';
    case 'alto':
      return 'Alto';
    case 'medio':
      return 'Médio';
    case 'baixo':
      return 'Baixo';
    default:
      return level;
  }
};

export const useNotificationCenter = () => {
  const { user } = useUnifiedAuth();
  const { filasPermitidas, hasFilasRestriction } = useUserFilas();

  const [whatsappChats, setWhatsappChats] = useState<WhatsAppUnreadChat[]>([]);
  const [chatInternoChats, setChatInternoChats] = useState<ChatInternoUnread[]>([]);
  const [pendingChats, setPendingChats] = useState<WhatsAppPendingChat[]>([]);
  const [priorityChats, setPriorityChats] = useState<WhatsAppPriorityChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Track cleanup state to avoid false-positive errors
  const isCleaningUpRef = useRef(false);
  const lastSeenRef = useRef<Map<number, string>>(new Map());

  const fetchWhatsAppUnread = useCallback(async () => {
    if (!user?.id) return;

    try {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .rpc('get_whatsapp_unread_chats', { p_admin_id: user.id });

      if (error) throw error;

      if (!data || data.length === 0) {
        setWhatsappChats([]);
        return;
      }

      let filteredData = data;
      if (hasFilasRestriction && filasPermitidas.length > 0) {
        filteredData = data.filter((chat: any) => {
          let chatFilas: any[] = [];
          try {
            chatFilas = chat.filas ? (Array.isArray(chat.filas) ? chat.filas : JSON.parse(chat.filas)) : [];
          } catch {
            chatFilas = chat.filas ? [chat.filas] : [];
          }
          if (chatFilas.length === 0) return filasPermitidas.includes(1);
          return chatFilas.some((filaId: string | number) => filasPermitidas.includes(Number(filaId)));
        });
      }

      const unreadChats: WhatsAppUnreadChat[] = filteredData.map((chat: any) => ({
        chatId: chat.chat_id,
        contactId: chat.contact_id || '',
        contactName: chat.contact_name || 'Desconhecido',
        contactPhone: chat.contact_phone || '',
        lastMessage: formatMessagePreview(chat.last_message, chat.last_message_type),
        unreadCount: Number(chat.unread_count),
        updatedAt: chat.updated_at
      }));

      setWhatsappChats(unreadChats);
    } catch {
      // Silent fail - RPC errors are expected in some cases
    }
  }, [user?.id, filasPermitidas, hasFilasRestriction]);

  const fetchChatInternoUnread = useCallback(async () => {
    if (!user?.supabase_id) return;

    try {
      const client = requireAuthenticatedClient();
      
      const { data: participacoes, error: partError } = await client
        .from('usuarios_chat_interno')
        .select('chat_id, unreads')
        .eq('user_id', user.supabase_id)
        .gt('unreads', 0);

      if (partError) throw partError;

      if (!participacoes || participacoes.length === 0) {
        setChatInternoChats([]);
        return;
      }

      const chatIds = participacoes.map(p => p.chat_id);
      const unreadsMap = new Map(participacoes.map(p => [p.chat_id, p.unreads]));

      const { data: chats } = await client
        .from('chats_internos')
        .select('id, titulo, updated_at')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      const unreadChats: ChatInternoUnread[] = await Promise.all(
        (chats || []).map(async (chat) => {
          const { data: lastMsg } = await client
            .from('mensagens_chat_interno')
            .select('message, sender_id, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let senderName = '';
          if (lastMsg?.sender_id) {
            const { data: userData } = await client
              .from('usuarios')
              .select('nome')
              .eq('supabase_id', lastMsg.sender_id)
              .maybeSingle();
            senderName = userData?.nome || '';
          }

          return {
            chatId: chat.id,
            titulo: chat.titulo,
            lastMessage: lastMsg?.message || '',
            senderName,
            unreadCount: unreadsMap.get(chat.id) || 0,
            updatedAt: chat.updated_at
          };
        })
      );

      setChatInternoChats(unreadChats);
    } catch {
      // Silent fail
    }
  }, [user?.supabase_id]);

  const fetchPendingChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const client = requireAuthenticatedClient();
      const { data, error } = await client.rpc('get_whatsapp_pending_chats', {
        p_admin_id: user.id
      });

      if (error) return;

      const mapped: WhatsAppPendingChat[] = (data || []).map((chat: any) => ({
        chatId: chat.chat_id,
        contactId: chat.contact_id || '',
        contactName: chat.contact_name || 'Desconhecido',
        contactPhone: chat.contact_phone || '',
        lastMessage: formatMessagePreview(chat.last_message, chat.last_message_type),
        messageCount: Number(chat.message_count || 0),
        waitingTimeMinutes: Number(chat.waiting_time_minutes || 0),
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        filas: chat.filas || ''
      }));

      setPendingChats(mapped);
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  const fetchPriorityChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const client = requireAuthenticatedClient();
      const { data, error } = await client.rpc('get_whatsapp_priority_chats', {
        p_admin_id: user.id
      });

      if (error) return;

      const mapped: WhatsAppPriorityChat[] = (data || []).map((chat: any) => ({
        chatId: chat.chat_id,
        contactId: chat.contact_id || '',
        contactName: chat.contact_name || 'Desconhecido',
        contactPhone: chat.contact_phone || '',
        lastMessage: formatMessagePreview(chat.last_message, chat.last_message_type),
        lastClientMessageAt: chat.last_client_message_at,
        waitingMinutes: Number(chat.waiting_minutes || 0),
        priorityLevel: chat.priority_level || 'baixo',
        priorityOrder: Number(chat.priority_order || 4),
        chatType: chat.chat_type || 'open',
        adminId: chat.admin_id,
        filas: chat.filas || ''
      }));

      setPriorityChats(mapped);
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.supabase_id) return;

    try {
      if (chatInternoChats.length > 0) {
        const chatIds = chatInternoChats.map(c => c.chatId);
        const client = requireAuthenticatedClient();
        await client
          .from('usuarios_chat_interno')
          .update({ unreads: 0 })
          .eq('user_id', user.supabase_id)
          .in('chat_id', chatIds);
      }

      setWhatsappChats([]);
      setChatInternoChats([]);
    } catch {
      // Silent fail
    }
  }, [user?.supabase_id, chatInternoChats]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchWhatsAppUnread(), 
      fetchChatInternoUnread(),
      fetchPendingChats(),
      fetchPriorityChats()
    ]);
    setIsLoading(false);
  }, [fetchWhatsAppUnread, fetchChatInternoUnread, fetchPendingChats, fetchPriorityChats]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user?.id || !user?.supabase_id) return;

    isCleaningUpRef.current = false;
    setRealtimeStatus('connecting');

    let connectedChannels = 0;
    const totalChannels = 3;
    const realtimeClient = getRealtimeClient();

    const checkAllConnected = () => {
      connectedChannels++;
      if (connectedChannels >= totalChannels) {
        setRealtimeStatus('connected');
      }
    };

    const whatsappMsgChannel = realtimeClient
      .channel('notification-center-whatsapp-msg')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensagens_whatsapp'
        },
        () => {
          fetchWhatsAppUnread();
          fetchPendingChats();
          fetchPriorityChats();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') checkAllConnected();
        if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
        }
        // CLOSED during cleanup is expected, not an error
      });

    const whatsappChatChannel = realtimeClient
      .channel('notification-center-whatsapp-chat')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chats_whatsapp'
        },
        () => {
          fetchWhatsAppUnread();
          fetchPendingChats();
          fetchPriorityChats();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') checkAllConnected();
        if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
        }
      });

    const chatInternoChannel = realtimeClient
      .channel(`notification-center-chatinterno-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios_chat_interno',
          filter: `user_id=eq.${user.supabase_id}`
        },
        () => {
          fetchChatInternoUnread();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') checkAllConnected();
        if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      isCleaningUpRef.current = true;
      realtimeClient.removeChannel(whatsappMsgChannel);
      realtimeClient.removeChannel(whatsappChatChannel);
      realtimeClient.removeChannel(chatInternoChannel);
    };
  }, [user?.id, user?.supabase_id, fetchWhatsAppUnread, fetchChatInternoUnread, fetchPendingChats, fetchPriorityChats]);

  const totalCount = useMemo(() => {
    const whatsappTotal = whatsappChats.reduce((sum, c) => sum + c.unreadCount, 0);
    const chatInternoTotal = chatInternoChats.reduce((sum, c) => sum + c.unreadCount, 0);
    return whatsappTotal + chatInternoTotal;
  }, [whatsappChats, chatInternoChats]);

  const criticalCount = useMemo(() => {
    return priorityChats.filter(c => c.priorityLevel === 'critico').length;
  }, [priorityChats]);

  return {
    whatsapp: whatsappChats,
    chatInterno: chatInternoChats,
    pendingChats,
    priorityChats,
    totalCount,
    criticalCount,
    pendingCount: pendingChats.length,
    isLoading,
    realtimeStatus,
    refresh: fetchAll,
    markAllAsRead
  };
};
