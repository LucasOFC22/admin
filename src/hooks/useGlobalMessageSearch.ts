import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useDebounce } from '@/hooks/useDebounce';

export interface ChatSearchResult {
  id: number;
  chatId: number;
  nome: string;
  telefone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageDate: string;
}

export interface MessageSearchResult {
  id: string;
  chatId: number;
  nome: string;
  telefone: string;
  avatar?: string;
  message_text: string;
  created_at: string;
}

interface UseGlobalMessageSearchResult {
  chatResults: ChatSearchResult[];
  messageResults: MessageSearchResult[];
  isSearching: boolean;
  hasResults: boolean;
}

// Função para buscar chats por contato
const searchChatsByContact = async (term: string): Promise<ChatSearchResult[]> => {
  const supabase = requireAuthenticatedClient();
  // Buscar contatos que correspondem (nome ou telefone)
  const { data: contactsData } = await supabase
    .from('contatos_whatsapp')
    .select('id, nome, telefone, perfil')
    .or(`nome.ilike.%${term}%,telefone.ilike.%${term}%`)
    .limit(20);

  if (!contactsData || contactsData.length === 0) {
    return [];
  }

  const contactIds = contactsData.map(c => c.id);
  
  const { data: chatsData } = await supabase
    .from('chats_whatsapp')
    .select('id, usuarioid')
    .in('usuarioid', contactIds);

  const chatIds = chatsData?.map(c => c.id) || [];
  
  if (chatIds.length === 0) {
    return [];
  }

  // Buscar última mensagem de cada chat
  const { data: lastMessages } = await supabase
    .from('mensagens_whatsapp')
    .select('chatId, message_text, created_at')
    .in('chatId', chatIds)
    .order('created_at', { ascending: false });

  // Mapear última mensagem por chatId
  const lastMsgMap: Record<number, { message_text: string; created_at: string }> = {};
  lastMessages?.forEach(msg => {
    if (!lastMsgMap[msg.chatId]) {
      lastMsgMap[msg.chatId] = { message_text: msg.message_text || '', created_at: msg.created_at };
    }
  });

  // Montar resultados de chat
  return contactsData.map(contact => {
    const chat = chatsData?.find(c => c.usuarioid === contact.id);
    const chatId = chat?.id || 0;
    const lastMsg = lastMsgMap[chatId];
    
    return {
      id: contact.id,
      chatId,
      nome: contact.nome || 'Sem nome',
      telefone: contact.telefone || '',
      avatar: (contact as any).perfil,
      lastMessage: lastMsg?.message_text || '',
      lastMessageDate: lastMsg?.created_at || ''
    };
  }).filter(r => r.chatId > 0);
};

// Função para buscar mensagens por conteúdo
const searchMessagesByContent = async (term: string): Promise<MessageSearchResult[]> => {
  const supabase = requireAuthenticatedClient();
  const { data: messagesData } = await supabase
    .from('mensagens_whatsapp')
    .select('id, chatId, message_text, created_at')
    .ilike('message_text', `%${term}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!messagesData || messagesData.length === 0) {
    return [];
  }

  const chatIdsFromMessages = [...new Set(messagesData.map(m => m.chatId))];
  
  // Buscar info dos chats
  const { data: chatsInfo } = await supabase
    .from('chats_whatsapp')
    .select('id, usuarioid')
    .in('id', chatIdsFromMessages);

  // Buscar contatos separadamente pelo usuarioid
  const usuarioIds = [...new Set(chatsInfo?.map(c => c.usuarioid).filter(Boolean) || [])];
  
  const { data: contactsData } = await supabase
    .from('contatos_whatsapp')
    .select('id, nome, telefone, perfil')
    .in('id', usuarioIds);

  // Criar mapa de contatos por id
  const contactsMap = new Map(
    contactsData?.map(c => [c.id, c]) || []
  );

  // Mapear chatId -> contato info
  const chatToContact: Record<number, { nome: string; telefone: string; avatar?: string }> = {};
  chatsInfo?.forEach(chat => {
    const contato = contactsMap.get(chat.usuarioid);
    if (contato) {
      chatToContact[chat.id] = {
        nome: contato.nome || 'Sem nome',
        telefone: contato.telefone || '',
        avatar: (contato as any).perfil
      };
    }
  });

  // Montar resultados de mensagens
  return messagesData.map(msg => {
    const contact = chatToContact[msg.chatId];
    
    return {
      id: msg.id,
      chatId: msg.chatId,
      nome: contact?.nome || 'Sem nome',
      telefone: contact?.telefone || '',
      avatar: contact?.avatar,
      message_text: msg.message_text || '',
      created_at: msg.created_at
    };
  });
};

export const useGlobalMessageSearch = (searchTerm: string): UseGlobalMessageSearchResult => {
  const queryClient = useQueryClient();
  const debouncedTerm = useDebounce(searchTerm, 300);
  const isEnabled = debouncedTerm.length >= 2;

  // Realtime subscription para invalidar cache quando novas mensagens chegarem
  useEffect(() => {
    if (!REALTIME_ENABLED) return;
    const channel = supabase
      .channel('global-search-cache-invalidation')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        () => {
          // Invalida cache de mensagens quando nova mensagem chega
          queryClient.invalidateQueries({ queryKey: ['global-search-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contatos_whatsapp'
        },
        () => {
          // Invalida cache de chats quando contato é atualizado
          queryClient.invalidateQueries({ queryKey: ['global-search-chats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Query para busca de chats por contato
  const chatQuery = useQuery({
    queryKey: ['global-search-chats', debouncedTerm],
    queryFn: () => searchChatsByContact(debouncedTerm),
    enabled: isEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Query para busca de mensagens por conteúdo
  const messageQuery = useQuery({
    queryKey: ['global-search-messages', debouncedTerm],
    queryFn: () => searchMessagesByContent(debouncedTerm),
    enabled: isEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const chatResults = chatQuery.data ?? [];
  const messageResults = messageQuery.data ?? [];
  const isSearching = (chatQuery.isLoading || messageQuery.isLoading) && isEnabled;
  const hasResults = chatResults.length > 0 || messageResults.length > 0;

  return { chatResults, messageResults, isSearching, hasResults };
};
