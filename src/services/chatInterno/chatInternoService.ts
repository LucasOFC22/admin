import { requireAuthenticatedClient, getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';

export interface ChatInterno {
  id: string;
  titulo: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  unreadCount?: number;
  lastMessage?: {
    message: string;
    sender_name: string;
    created_at: string;
  };
}

export interface MensagemChatInterno {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface UsuarioChatInterno {
  id: string;
  chat_id: string;
  user_id: string;
  unreads: number;
  created_at: string;
}

class ChatInternoService {
  // Buscar todos os chats do usuário (usando supabase_id UUID)
  async getChatsDoUsuario(supabaseId: string): Promise<ChatInterno[]> {
    try {
      // Buscar chats onde o usuário é participante usando o supabase_id (UUID)
      // Usar cliente autenticado para enviar JWT
      const client = requireAuthenticatedClient();
      
      const { data: usuariosChats, error: usuariosError } = await client
        .from('usuarios_chat_interno')
        .select('chat_id, unreads')
        .eq('user_id', supabaseId);

      if (usuariosError) throw usuariosError;

      if (!usuariosChats || usuariosChats.length === 0) {
        return [];
      }

      const chatIds = usuariosChats.map(uc => uc.chat_id);

      // Buscar informações dos chats
      const { data: chats, error: chatsError } = await client
        .from('chats_internos')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Buscar última mensagem de cada chat
      const chatsComInfo = await Promise.all(
        (chats || []).map(async (chat) => {
          const { data: lastMsg } = await client
            .from('mensagens_chat_interno')
            .select('message, created_at, sender_id')
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

          const unreadCount = usuariosChats.find(uc => uc.chat_id === chat.id)?.unreads || 0;

          return {
            ...chat,
            unreadCount,
            lastMessage: lastMsg ? {
              message: lastMsg.message,
              sender_name: senderName,
              created_at: lastMsg.created_at
            } : undefined
          };
        })
      );

      return chatsComInfo;
    } catch (error) {
      throw error;
    }
  }

  // Buscar mensagens de um chat
  async getMensagens(chatId: string): Promise<MensagemChatInterno[]> {
    try {
      const client = requireAuthenticatedClient();
      
      const { data, error } = await client
        .from('mensagens_chat_interno')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar informações dos remetentes usando supabase_id (UUID)
      const mensagensComRemetente = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: userData } = await client
            .from('usuarios')
            .select('nome')
            .eq('supabase_id', msg.sender_id)
            .maybeSingle();

          return {
            ...msg,
            sender_name: userData?.nome || 'Usuário',
            sender_avatar: undefined
          };
        })
      );

      return mensagensComRemetente;
    } catch (error) {
      throw error;
    }
  }

  // Criar novo chat (usando supabase_id UUID)
  async criarChat(titulo: string, ownerSupabaseId: string, userSupabaseIds: string[]): Promise<ChatInterno> {
    try {
      const client = requireAuthenticatedClient();
      
      // Criar o chat usando supabase_id (UUID)
      const { data: chat, error: chatError } = await client
        .from('chats_internos')
        .insert([{
          titulo,
          owner_id: ownerSupabaseId
        }])
        .select()
        .single();

      if (chatError) throw chatError;

      // Adicionar usuários ao chat (incluindo o owner) usando supabase_ids (UUIDs)
      const allUserSupabaseIds = Array.from(new Set([ownerSupabaseId, ...userSupabaseIds]));
      const usuariosData = allUserSupabaseIds.map(supabaseId => ({
        chat_id: chat.id,
        user_id: supabaseId,
        unreads: 0
      }));

      const { error: usuariosError } = await client
        .from('usuarios_chat_interno')
        .insert(usuariosData);

      if (usuariosError) throw usuariosError;

      return {
        ...chat,
        unreadCount: 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Enviar mensagem (usando supabase_id UUID)
  async enviarMensagem(chatId: string, senderSupabaseId: string, message: string): Promise<MensagemChatInterno> {
    try {
      const client = requireAuthenticatedClient();
      
      const { data, error } = await client
        .from('mensagens_chat_interno')
        .insert([{
          chat_id: chatId,
          sender_id: senderSupabaseId,
          message
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar updated_at do chat
      await client
        .from('chats_internos')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      // Incrementar unreads para outros usuários usando supabase_id (UUID)
      await client.rpc('increment_chat_interno_unreads', {
        p_chat_id: chatId,
        p_sender_id: senderSupabaseId
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Marcar mensagens como lidas (usando supabase_id UUID)
  async marcarComoLido(chatId: string, userSupabaseId: string): Promise<void> {
    try {
      const client = requireAuthenticatedClient();
      await client
        .from('usuarios_chat_interno')
        .update({ unreads: 0 })
        .eq('chat_id', chatId)
        .eq('user_id', userSupabaseId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuários disponíveis para adicionar ao chat (retorna supabase_id UUID)
  async buscarUsuarios(): Promise<Array<{ id: string; nome: string; email: string }>> {
    try {
      const client = requireAuthenticatedClient();
      
      const { data, error } = await client
        .from('usuarios')
        .select('supabase_id, nome, email')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      // Mapear supabase_id como id para compatibilidade
      return (data || []).map(user => ({
        id: user.supabase_id,
        nome: user.nome,
        email: user.email
      }));
    } catch (error) {
      throw error;
    }
  }

  // Buscar participantes de um chat
  async buscarParticipantes(chatId: string): Promise<string[]> {
    try {
      const client = requireAuthenticatedClient();
      
      const { data, error } = await client
        .from('usuarios_chat_interno')
        .select('user_id')
        .eq('chat_id', chatId);

      if (error) throw error;

      return (data || []).map(p => p.user_id);
    } catch (error) {
      throw error;
    }
  }

  // Editar chat (título e participantes)
  async editarChat(chatId: string, titulo: string, userSupabaseIds: string[]): Promise<void> {
    try {
      const client = requireAuthenticatedClient();
      
      // Atualizar título
      const { error: updateError } = await client
        .from('chats_internos')
        .update({ titulo, updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Buscar participantes atuais
      const { data: currentParticipants, error: participantsError } = await client
        .from('usuarios_chat_interno')
        .select('user_id')
        .eq('chat_id', chatId);

      if (participantsError) throw participantsError;

      const currentIds = (currentParticipants || []).map(p => p.user_id);
      
      // Remover participantes que não estão mais na lista
      const toRemove = currentIds.filter(id => !userSupabaseIds.includes(id));
      if (toRemove.length > 0) {
        await client
          .from('usuarios_chat_interno')
          .delete()
          .eq('chat_id', chatId)
          .in('user_id', toRemove);
      }

      // Adicionar novos participantes
      const toAdd = userSupabaseIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const newParticipants = toAdd.map(userId => ({
          chat_id: chatId,
          user_id: userId,
          unreads: 0
        }));
        await client
          .from('usuarios_chat_interno')
          .insert(newParticipants);
      }
    } catch (error) {
      throw error;
    }
  }

  // Excluir chat
  async excluirChat(chatId: string): Promise<void> {
    try {
      const client = requireAuthenticatedClient();
      
      // Excluir mensagens primeiro
      await client
        .from('mensagens_chat_interno')
        .delete()
        .eq('chat_id', chatId);

      // Excluir participantes
      await client
        .from('usuarios_chat_interno')
        .delete()
        .eq('chat_id', chatId);

      // Excluir chat
      const { error } = await client
        .from('chats_internos')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }
}

export const chatInternoService = new ChatInternoService();
