import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import type { SupabaseClient } from '@supabase/supabase-js';

import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';
import { backendService } from '@/services/api/backendService';

// Helper para obter cliente Supabase autenticado
const getSupabase = (): SupabaseClient => requireAuthenticatedClient();

// Proxy para manter avaliação lazy (não dispara erro no import) e expor TODO o client (incl. functions)
const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => (getSupabase() as any)[prop]
}) as SupabaseClient;

export interface WhatsAppConnection {
  id: string;
  name: string;
  channel?: string;
}

export interface Ticket {
  id: string;
  uuid: string;
  chatId?: number; // ID numérico do chat para buscar mensagens
  status: 'open' | 'pending' | 'closed' | 'group';
  userId?: string;
  contactId: string;
  queueId?: string;
  whatsappId: string;
  unreadMessages: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  queue?: Queue;
  user?: User;
  tags?: Tag[];
  whatsapp?: WhatsAppConnection;
  adminIdPendente?: string;
  modoDeAtendimento?: string;
  aceitoPorAdmin?: boolean;
  origemCampanhaId?: string;
  campanhaNome?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  profilePicUrl?: string;
  isGroup: boolean;
  tags?: Tag[];
  disableBot?: boolean;
}

export interface Queue {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Message {
  id: string;
  ticketId: string;
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaType?: string;
  mediaUrl?: string;
  mediaId?: string; // ID da mídia no WhatsApp para carregamento sob demanda
  createdAt: string;
  quotedMsg?: Message;
  ack?: number;
  isPrivate?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  contact?: Contact;
  reactions?: Array<{
    emoji: string;
    from: string;
    timestamp: string;
  }>;
}

export interface GetTicketsParams {
  searchParam?: string;
  pageNumber?: number;
  status?: string;
  showAll?: boolean;
  queueIds?: string[];
  sortTickets?: 'ASC' | 'DESC';
  searchOnMessages?: boolean;
  tags?: string[];
  users?: string[];
  whatsappIds?: string[];
}

// Função para mapear chat do banco para formato Ticket
const mapChatToTicket = (chat: any, contactData?: { nome?: string; telefone?: string }): Ticket => {
  const isResolved = chat.resolvido === true;
  const isAccepted = chat.aceitoporadmin === true;
  
  let status: 'open' | 'pending' | 'closed' | 'group' = 'open';
  if (isResolved) {
    status = 'closed';
  } else if (chat.mododeatendimento === 'Atendimento Humano' && !isAccepted) {
    // Só é 'pending' (Aguardando) se for Atendimento Humano e não aceito
    status = 'pending';
  } else if (isAccepted) {
    status = 'open';
  }
  // Bot com aceitoporadmin=false fica como 'open', não 'pending'

  return {
    id: String(chat.id),
    uuid: String(chat.id),
    chatId: chat.id, // ID numérico do chat para mensagens
    status,
    userId: chat.adminid,
    contactId: chat.usuarioid,
    queueId: Array.isArray(chat.filas) ? chat.filas[0] : chat.filas,
    whatsappId: '',
    unreadMessages: 0,
    lastMessage: chat.lastMessage || '',
    lastMessageAt: chat.atualizadoem || chat.criadoem,
    createdAt: chat.criadoem,
    updatedAt: chat.atualizadoem || chat.criadoem,
    contact: {
      id: chat.usuarioid,
      name: contactData?.nome || 'Contato',
      number: contactData?.telefone || '',
      profilePicUrl: chat.picture,
      isGroup: false
    }
  };
};

// Função para mapear mensagem do banco para formato Message
const mapDbMessageToMessage = (msg: any, chatId: string, quotedMessagesMap?: Map<string, any>): Message => {
  // Usa coluna 'send' para determinar se é do cliente ou atendente
  // send = 'cliente' -> mensagem do cliente (fromMe = false)
  // send = 'flowbuilder' | 'atendente' | 'sistema' -> mensagem do sistema (fromMe = true)
  const isFromMe = msg.send !== 'cliente';

  // Tipos de mídia que usam message_text como URL de storage
  const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'];
  const isMediaType = mediaTypes.includes(msg.message_type);

  // Para mídia: message_text contém a URL do storage (salvo pelo n8n)
  // Fallback: message_data.storageUrl ou metadata.storageUrl
  let finalMediaUrl: string | undefined;
  if (isMediaType) {
    // Prioridade: message_text (se for URL) > message_data.storageUrl > metadata.storageUrl
    const messageText = msg.message_text || '';
    if (messageText.startsWith('http')) {
      finalMediaUrl = messageText;
    } else {
      finalMediaUrl = msg.message_data?.storageUrl || msg.metadata?.storageUrl;
    }
  }

  const mediaId = msg.message_data?.media_id;
  
  // Caption/legenda para mídia: buscar em message_data.caption ou message_data.media.caption
  const caption = msg.message_data?.caption || msg.message_data?.media?.caption || '';
  
  // Body da mensagem:
  // - Para texto: usar message_text
  // - Para mídia: usar caption (não mostrar URL como texto)
  let body = '';
  if (isMediaType) {
    body = caption;
  } else if (msg.message_type === 'interactive') {
    // Mensagens interativas (botões, listas do FlowBuilder)
    const messageData = msg.message_data || {};
    const interactive = messageData.interactive || messageData || {};
    
    if (msg.send === 'cliente') {
      // Cliente respondeu a um botão ou lista interativa
      // O interactive pode ter a resposta diretamente ou dentro de outro nível
      const buttonReply = interactive.button_reply?.title || interactive.button_reply?.id || 
                         messageData.button_reply?.title || messageData.button_reply?.id || '';
      const listReply = interactive.list_reply?.title || interactive.list_reply?.id ||
                       messageData.list_reply?.title || messageData.list_reply?.id || '';
      body = buttonReply || listReply || msg.message_text || '';
    } else {
      // FlowBuilder/Sistema enviou mensagem interativa com botões/lista
      const interactiveType = interactive.type;
      
      // Extrair header: pode estar em diferentes formatos
      let header = '';
      if (interactive.header?.text) {
        header = interactive.header.text;
      } else if (typeof interactive.header === 'string') {
        header = interactive.header;
      }
      
      // Extrair body text
      const bodyText = interactive.body?.text || '';
      
      // Extrair footer
      const footer = interactive.footer?.text || '';
      
      // Extrair opções dependendo do tipo
      let optionsList = '';
      
      if (interactiveType === 'list') {
        // Lista: sections -> rows
        const sections = interactive.action?.sections || [];
        optionsList = sections.flatMap((section: any) => 
          (section.rows || []).map((row: any) => `• ${row.title || ''}`)
        ).filter(Boolean).join('\n');
      } else if (interactiveType === 'button') {
        // Botões: buttons -> reply.title
        const buttons = interactive.action?.buttons || [];
        optionsList = buttons.map((btn: any) => 
          `• ${btn.reply?.title || btn.title || ''}`
        ).filter(Boolean).join('\n');
      }
      
      // Montar body completo: Header > Body > Opções > Footer
      const parts: string[] = [];
      if (header) parts.push(header);
      if (bodyText) parts.push(bodyText);
      if (optionsList) parts.push(optionsList);
      if (footer) parts.push(footer);
      
      // Se não extraiu nada, usar message_text como fallback
      body = parts.length > 0 ? parts.join('\n\n') : (msg.message_text || '');
    }
  } else {
    body = msg.message_text || '';
  }
  
  // Log de debug para mídia
  if (isMediaType) {
    console.log(`[MessageMapper] Mensagem mídia ${msg.id}:`, {
      type: msg.message_type,
      hasMediaUrl: !!finalMediaUrl,
      urlSource: msg.message_text?.startsWith('http') ? 'message_text' : 
                 msg.message_data?.storageUrl ? 'message_data.storageUrl' : 
                 msg.metadata?.storageUrl ? 'metadata.storageUrl' : 'none',
      hasCaption: !!caption,
      hasMediaId: !!mediaId
    });
  }

  // Extrair mensagem citada (quotedMsg) do reply_to_message_id
  let quotedMsg: Message | undefined = undefined;
  if (msg.reply_to_message_id) {
    // Buscar mensagem original no Map (buscada previamente em batch)
    const quotedData = quotedMessagesMap?.get(msg.reply_to_message_id);
    
    if (quotedData) {
      // Mensagem encontrada no banco - usar dados reais
      const isQuotedFromMe = quotedData.send !== 'cliente';
      const quotedIsMedia = mediaTypes.includes(quotedData.message_type);
      const quotedCaption = quotedData.message_data?.caption || quotedData.message_data?.media?.caption || '';
      
      quotedMsg = {
        id: quotedData.id,
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
        id: msg.reply_to_message_id,
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
    mediaId: mediaId, // Para carregamento sob demanda
    createdAt: msg.created_at || msg.received_at,
    ack: isFromMe ? 3 : undefined,
    isPrivate: msg.metadata?.isPrivate === true,
    isDeleted: msg.is_deleted === true || msg.metadata?.isDeleted === true,
    isEdited: msg.is_edited === true,
    quotedMsg: quotedMsg,
    // Dados extras para reprocessamento de mídia
    rawData: msg
  } as Message & { rawData?: any };
};

export const ticketService = {
  async getTickets(params: GetTicketsParams) {
    const {
      searchParam,
      pageNumber = 1,
      status,
      queueIds,
      sortTickets = 'DESC',
      users
    } = params;

    const limit = 50;
    const offset = (pageNumber - 1) * limit;

    let query = supabase
      .from('chats_whatsapp')
      .select('*', { count: 'exact' });

    if (status === 'open') {
      query = query.eq('resolvido', false).eq('aceitoporadmin', true);
    } else if (status === 'pending') {
      // Aguardando = Atendimento Humano + não aceito por admin
      query = query.eq('resolvido', false).eq('aceitoporadmin', false).eq('mododeatendimento', 'Atendimento Humano');
    } else if (status === 'closed') {
      query = query.eq('resolvido', true);
    }

    if (queueIds && queueIds.length > 0) {
      query = query.overlaps('filas', queueIds);
    }

    if (users && users.length > 0) {
      query = query.in('adminid', users);
    }

    // Nota: busca por nome/telefone não disponível diretamente em chats_whatsapp
    // Essas colunas estão em contatos_whatsapp (via usuarioid)

    query = query
      .order('atualizadoem', { ascending: sortTickets === 'ASC' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Buscar dados dos contatos para enriquecer os tickets
    const usuarioIds = [...new Set((data || []).map(chat => chat.usuarioid).filter(Boolean))];
    let contactsMap = new Map<string, { nome?: string; telefone?: string }>();
    
    if (usuarioIds.length > 0) {
      const { data: contactsData } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .in('id', usuarioIds);
      
      if (contactsData) {
        contactsData.forEach(c => contactsMap.set(c.id, { nome: c.nome, telefone: c.telefone }));
      }
    }

    const tickets = (data || []).map(chat => mapChatToTicket(chat, contactsMap.get(chat.usuarioid)));

    return {
      tickets,
      hasMore: count ? count > offset + limit : false,
      count: count || 0
    };
  },

  async getTicket(uuid: string) {
    const { data, error } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('id', uuid)
      .single();

    if (error) throw error;
    
    // Buscar dados do contato
    let contactData: { nome?: string; telefone?: string } | undefined;
    if (data.usuarioid) {
      const { data: contatoData } = await supabase
        .from('contatos_whatsapp')
        .select('nome, telefone')
        .eq('id', data.usuarioid)
        .maybeSingle();
      contactData = contatoData || undefined;
    }
    
    return mapChatToTicket(data, contactData);
  },

  async createTicket(telefone: string, nome: string, queueId: string, userId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      throw new Error('ID do usuário inválido. Faça logout e login novamente.');
    }

    // Primeiro, criar ou buscar o contato
    let contatoId: string;
    const { data: existingContato } = await supabase
      .from('contatos_whatsapp')
      .select('id')
      .eq('telefone', telefone)
      .maybeSingle();

    if (existingContato) {
      contatoId = existingContato.id;
    } else {
      const { data: newContato, error: contatoError } = await supabase
        .from('contatos_whatsapp')
        .insert({
          nome,
          telefone,
          criadoem: new Date().toISOString()
        })
        .select()
        .single();

      if (contatoError) throw contatoError;
      contatoId = newContato.id;
    }

    const { data, error } = await supabase
      .from('chats_whatsapp')
      .insert({
        usuarioid: contatoId,
        filas: queueId ? [queueId] : [],
        mododeatendimento: 'Atendimento Humano',
        aceitoporadmin: true,
        adminid: userId,
        ativo: true,
        resolvido: false,
        criadoem: new Date().toISOString(),
        atualizadoem: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return mapChatToTicket(data, { nome, telefone });
  },

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const dbUpdates: any = {
      atualizadoem: new Date().toISOString()
    };

    if (updates.status === 'closed') {
      dbUpdates.resolvido = true;
      dbUpdates.encerradoem = new Date().toISOString();
    } else if (updates.status === 'open') {
      dbUpdates.resolvido = false;
      dbUpdates.aceitoporadmin = true;
    } else if (updates.status === 'pending') {
      dbUpdates.resolvido = false;
      dbUpdates.aceitoporadmin = false;
    }

    if (updates.userId) {
      dbUpdates.adminid = updates.userId;
    }

    if (updates.queueId) {
      dbUpdates.filas = [updates.queueId];
    }

    const { data, error } = await supabase
      .from('chats_whatsapp')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Buscar dados do contato
    let contactData: { nome?: string; telefone?: string } | undefined;
    if (data.usuarioid) {
      const { data: contatoData } = await supabase
        .from('contatos_whatsapp')
        .select('nome, telefone')
        .eq('id', data.usuarioid)
        .maybeSingle();
      contactData = contatoData || undefined;
    }
    
    return mapChatToTicket(data, contactData);
  },

  async deleteTicket(id: string) {
    const { error } = await supabase
      .from('chats_whatsapp')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async closeAllTickets(status: string, queueIds?: string[]) {
    let query = supabase
      .from('chats_whatsapp')
      .update({ 
        resolvido: true,
        encerradoem: new Date().toISOString(),
        atualizadoem: new Date().toISOString()
      });

    if (status === 'open') {
      query = query.eq('resolvido', false).eq('aceitoporadmin', true);
    } else if (status === 'pending') {
      // Aguardando = Atendimento Humano + não aceito por admin
      query = query.eq('resolvido', false).eq('aceitoporadmin', false).eq('mododeatendimento', 'Atendimento Humano');
    }

    if (queueIds && queueIds.length > 0) {
      query = query.overlaps('filas', queueIds);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async getMessages(ticketIdOrChatId: string | number, pageNumber: number = 1) {
    const limit = 50;
    const offset = (pageNumber - 1) * limit;

    // Se for um número válido, usar diretamente como chatId
    // Caso contrário, precisamos buscar o chatId pelo contato
    let chatId: number;
    
    if (typeof ticketIdOrChatId === 'number') {
      chatId = ticketIdOrChatId;
    } else {
      const parsed = parseInt(ticketIdOrChatId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        chatId = parsed;
      } else {
        // ticketId é UUID do contato, buscar o chat ativo
        const { data: chatData, error: chatError } = await supabase
          .from('chats_whatsapp')
          .select('id')
          .eq('usuarioid', ticketIdOrChatId)
          .order('atualizadoem', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (chatError || !chatData) {
          return { messages: [], hasMore: false };
        }
        chatId = chatData.id;
      }
    }

    const { data, error, count } = await supabase
      .from('mensagens_whatsapp')
      .select('*', { count: 'exact' })
      .eq('chatId', chatId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Coletar reply_to_message_ids únicos para buscar mensagens citadas
    const replyToIds = [...new Set(
      (data || [])
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

    const messages = (data || []).map(msg => mapDbMessageToMessage(msg, String(chatId), quotedMessagesMap));

    return {
      messages,
      hasMore: count ? count > offset + limit : false
    };
  },

  async sendMessage(
    ticketId: string, 
    body: string, 
    isPrivate: boolean = false, 
    userName?: string,
    replyToMessageId?: string
  ) {
    // Sempre assinar mensagem com nome do usuário (se não for privada)
    let finalBody = body;
    
    if (userName && !isPrivate) {
      finalBody = `*${userName}:*\n${body}`;
    }

    // Buscar telefone do contato para enviar via API
    const { data: chatData } = await supabase
      .from('chats_whatsapp')
      .select('usuarioid')
      .eq('id', ticketId)
      .single();

    let telefone: string | undefined;
    
    // Buscar telefone na tabela de contatos
    if (chatData?.usuarioid) {
      const { data: contatoData } = await supabase
        .from('contatos_whatsapp')
        .select('telefone')
        .eq('id', chatData.usuarioid)
        .maybeSingle();
      telefone = contatoData?.telefone;
    }

    // Enviar via API (reply ou mensagem normal)
    if (!isPrivate && telefone) {
      try {
        if (replyToMessageId) {
          // Usar edge function para resposta com contexto (reply)
          const { data: result, error: fnError } = await supabase.functions.invoke('whatsapp-message-reply', {
            body: {
              chatId: parseInt(ticketId, 10),
              phoneNumber: telefone,
              text: finalBody,
              replyToMessageId: replyToMessageId
            }
          });
          
          if (fnError) {
            console.error('Erro ao enviar reply via edge function:', fnError);
            throw fnError;
          }
          
          if (!result?.success) {
            console.error('Erro na edge function:', result?.error);
            throw new Error(result?.error || 'Erro ao enviar resposta');
          }
          
          // Edge function já salvou no banco, apenas atualizar chat
          await supabase
            .from('chats_whatsapp')
            .update({ atualizadoem: new Date().toISOString() })
            .eq('id', ticketId);
          
          return { id: result.messageId, body: finalBody };
        } else {
          // Mensagem normal - usar nova API direta
          const response = await fetch('https://api.fptranscargas.com.br/whatsapp/enviar-direto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              numero: telefone,
              mensagem: finalBody
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro ao enviar mensagem via API:', errorData);
            throw new Error(errorData.message || errorData.error || errorData.erro || 'Erro ao enviar mensagem para o WhatsApp');
          }
        }
      } catch (apiError) {
        console.error('Erro ao chamar API de envio:', apiError);
        throw new Error(
          apiError instanceof Error 
            ? apiError.message 
            : 'Falha ao enviar mensagem. Verifique sua conexão.'
        );
      }
    }

    // Salvar mensagem na tabela com send = 'atendente' (se não foi reply, pois reply já salva)
    if (!replyToMessageId) {
      const { data, error } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          chatId: parseInt(ticketId, 10),
          message_type: 'text',
          message_text: finalBody,
          send: 'atendente',
          metadata: {
            chatId: ticketId,
            fromMe: true,
            tipo: 'atendente',
            isPrivate
          },
          received_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chats_whatsapp')
        .update({ atualizadoem: new Date().toISOString() })
        .eq('id', ticketId);

      return mapDbMessageToMessage(data, ticketId);
    }

    return { id: 'sent', body: finalBody };
  },


  async updateTicketTags(ticketId: string, tagIds: (string | number)[]) {
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({ 
        tags: tagIds,
        atualizadoem: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
  }
};
