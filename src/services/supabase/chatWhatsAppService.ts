import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { formatMessagePreview } from '@/utils/messagePreview';

export interface ChatWhatsApp {
  id: number;
  usuarioid: string;
  nome: string;
  telefone: string;
  picture?: string;
  filas?: string;
  mododeatendimento: string;
  aceitoporadmin: boolean;
  adminid?: string;
  resolvido: boolean;
  ativo: boolean;
  criadoem: string;
  atualizadoem: string;
  encerradoem?: string;
  tags?: string;
  lastMessage?: string;
  contatos_whatsapp?: {
    perfil?: string;
    nome?: string;
    telefone?: string;
  };
}

// Parse filas column (text) to array of IDs
export const parseFilas = (filasString: string | null): string[] => {
  if (!filasString) return [];
  try {
    const parsed = JSON.parse(filasString);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // If not valid JSON, try splitting by comma
    return filasString.split(',').filter(Boolean).map(s => s.trim());
  }
};

// Parse tags column (text) to array of IDs
export const parseTags = (tagsString: string | null): number[] => {
  if (!tagsString) return [];
  try {
    const parsed = JSON.parse(tagsString);
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : [];
  } catch {
    return [];
  }
};

export const chatWhatsAppService = {
  async getChats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ChatWhatsApp[]> {
    const supabase = requireAuthenticatedClient();
    
    let query = supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('resolvido', false)
      .eq('ativo', true)
      .eq('mododeatendimento', 'Atendimento Humano')
      .order('atualizadoem', { ascending: false });

    if (params?.startDate) {
      query = query.gte('criadoem', params.startDate);
    }

    if (params?.endDate) {
      query = query.lte('criadoem', params.endDate + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const chats = data || [];

    // Buscar dados dos contatos separadamente
    const usuarioIds = [...new Set(chats.map(c => c.usuarioid).filter(Boolean))];
    const contatosMap: Record<string, { perfil?: string; nome?: string; telefone?: string }> = {};
    
    if (usuarioIds.length > 0) {
      const { data: contatosData } = await supabase
        .from('contatos_whatsapp')
        .select('id, perfil, nome, telefone')
        .in('id', usuarioIds);
      
      if (contatosData) {
        contatosData.forEach(contato => {
          contatosMap[contato.id] = {
            perfil: contato.perfil,
            nome: contato.nome,
            telefone: contato.telefone
          };
        });
      }
    }

    // Buscar última mensagem de cada chat
    const chatIds = chats.map(c => c.id);
    const lastMessagesMap: Record<number, string> = {};

    if (chatIds.length > 0) {
      for (const chatId of chatIds) {
        const { data: lastMsgData } = await supabase
          .from('mensagens_whatsapp')
          .select('message_text, message_type, message_data, send')
          .eq('chatId', chatId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsgData) {
          // Processar mensagens interativas
          if (lastMsgData.message_type === 'interactive') {
            const interactive = lastMsgData.message_data?.interactive || lastMsgData.message_data || {};
            
            if (lastMsgData.send === 'cliente') {
              const buttonReply = interactive.button_reply?.title || interactive.button_reply?.id || '';
              const listReply = interactive.list_reply?.title || interactive.list_reply?.id || '';
              lastMessagesMap[chatId] = buttonReply || listReply || lastMsgData.message_text || '';
            } else {
              lastMessagesMap[chatId] = interactive.body?.text || lastMsgData.message_text || '';
            }
          } else {
            const caption = lastMsgData.message_data?.caption || lastMsgData.message_data?.media?.caption || '';
            lastMessagesMap[chatId] = formatMessagePreview(lastMsgData.message_text, lastMsgData.message_type, caption);
          }
        }
      }
    }

    // Adicionar lastMessage e contatos aos chats
    return chats.map(chat => ({
      ...chat,
      contatos_whatsapp: contatosMap[chat.usuarioid] || undefined,
      lastMessage: lastMessagesMap[chat.id] || ''
    }));
  },

  async updateChatFilas(chatId: number, filaIds: string[]): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({
        filas: JSON.stringify(filaIds),
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async getChatById(chatId: number): Promise<ChatWhatsApp | null> {
    const supabase = requireAuthenticatedClient();
    
    const { data: chat, error } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!chat) return null;

    // Buscar dados do contato
    let contato: { perfil?: string; nome?: string; telefone?: string } | undefined;
    if (chat.usuarioid) {
      const { data: contatoData } = await supabase
        .from('contatos_whatsapp')
        .select('perfil, nome, telefone')
        .eq('id', chat.usuarioid)
        .maybeSingle();
      
      if (contatoData) {
        contato = contatoData;
      }
    }

    // Buscar última mensagem
    let lastMessage = '';
    const { data: lastMsgData } = await supabase
      .from('mensagens_whatsapp')
      .select('message_text, message_type, message_data, send')
      .eq('chatId', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMsgData) {
      if (lastMsgData.message_type === 'interactive') {
        const interactive = lastMsgData.message_data?.interactive || lastMsgData.message_data || {};
        
        if (lastMsgData.send === 'cliente') {
          const buttonReply = interactive.button_reply?.title || interactive.button_reply?.id || '';
          const listReply = interactive.list_reply?.title || interactive.list_reply?.id || '';
          lastMessage = buttonReply || listReply || lastMsgData.message_text || '';
        } else {
          lastMessage = interactive.body?.text || lastMsgData.message_text || '';
        }
      } else {
        const caption = lastMsgData.message_data?.caption || lastMsgData.message_data?.media?.caption || '';
        lastMessage = formatMessagePreview(lastMsgData.message_text, lastMsgData.message_type, caption);
      }
    }

    return {
      ...chat,
      contatos_whatsapp: contato,
      lastMessage
    };
  }
};
