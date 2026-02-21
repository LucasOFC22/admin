import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { n8nApi } from '@/services/n8n/apiService';
import { centralLogger } from '@/services/logger/centralLogger';
import { backendService } from '@/services/api/backendService';

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  nome?: string;
  usuario?: string;
  usuarioId?: string;
  mensagem: string;
  tipo?: 'cliente' | 'atendente' | 'sistema';
  enviadoEm: Date;
  text?: boolean;
}

export interface WhatsAppChat {
  id: string;
  usuarioId: string;
  iniciadoEm: Date;
  encerradoEm?: Date;
  resolvido?: boolean;
  filas?: string;
  atualizadoEm?: Date;
  modoDeAtendimento?: string;
  aceitoPorAdmin?: boolean;
  adminId?: string;
  adminIdPendente?: string;
  adminIdAntigo?: string;
  nome?: string;
  telefone?: string;
  ativo?: boolean;
  criadoEm?: Date;
  podeEnviarMensagem?: boolean;
  picture?: string;
}

export interface WhatsAppContact {
  id: string;
  nome: string;
  telefone?: string;
  criadoEm: Date;
}

class SupabaseWhatsAppService {
  async init() {
    // Inicialização silenciosa
  }

  // Buscar todos os contatos
  async getContacts(): Promise<WhatsAppContact[]> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('contatos_whatsapp')
      .select('*')
      .order('criadoem', { ascending: false });

    if (error) throw error;

    const contacts: WhatsAppContact[] = (data || []).map(contact => ({
      id: contact.id,
      nome: contact.nome,
      telefone: contact.telefone,
      criadoEm: new Date(contact.criadoem)
    }));

    return contacts;
  }

  // Buscar todos os chats não resolvidos
  async getChats(): Promise<WhatsAppChat[]> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('resolvido', false)
      .order('atualizadoem', { ascending: true });

    if (error) throw error;

    // Buscar dados dos contatos
    const usuarioIds = [...new Set((data || []).map(chat => chat.usuarioid).filter(Boolean))];
    const contactsMap = new Map<string, { nome?: string; telefone?: string }>();
    
    if (usuarioIds.length > 0) {
      const { data: contactsData } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .in('id', usuarioIds);
      
      if (contactsData) {
        contactsData.forEach(c => contactsMap.set(c.id, { nome: c.nome, telefone: c.telefone }));
      }
    }

    const chats: WhatsAppChat[] = (data || []).map(chat => {
      const contact = contactsMap.get(chat.usuarioid);
      return {
        id: chat.id,
        usuarioId: chat.usuarioid,
        iniciadoEm: new Date(chat.criadoem),
        encerradoEm: chat.encerradoem ? new Date(chat.encerradoem) : undefined,
        resolvido: chat.resolvido || false,
        filas: chat.filas,
        atualizadoEm: chat.atualizadoem ? new Date(chat.atualizadoem) : undefined,
        modoDeAtendimento: chat.mododeatendimento,
        aceitoPorAdmin: chat.aceitoporadmin || false,
        adminId: chat.adminid,
        adminIdPendente: chat.adminid_pendente,
        adminIdAntigo: chat.adminid_antigo,
        nome: contact?.nome,
        telefone: contact?.telefone,
        ativo: chat.ativo,
        picture: chat.picture
      };
    });

    return chats;
  }

  // Buscar chats aguardando atendimento
  async getChatsAguardando(userId: string): Promise<WhatsAppChat[]> {
    const supabase = requireAuthenticatedClient();
    
    // Busca 1: Chats com transferência pendente para este usuário
    const { data: chatsPendentes, error: error1 } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('resolvido', false)
      .eq('mododeatendimento', 'Atendimento Humano')
      .eq('aceitoporadmin', false)
      .eq('adminid_pendente', userId)
      .order('criadoem', { ascending: false });

    if (error1) throw error1;

    // Busca 2: Chats novos sem transferência pendente
    const { data: chatsNovos, error: error2 } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('resolvido', false)
      .eq('mododeatendimento', 'Atendimento Humano')
      .eq('aceitoporadmin', false)
      .is('adminid_pendente', null)
      .order('criadoem', { ascending: false });

    if (error2) throw error2;

    // Combinar e remover duplicatas
    const allChats = [...(chatsPendentes || []), ...(chatsNovos || [])];
    const uniqueChats = Array.from(
      new Map(allChats.map(chat => [chat.id, chat])).values()
    );

    // Buscar dados dos contatos
    const usuarioIds = [...new Set(uniqueChats.map(chat => chat.usuarioid).filter(Boolean))];
    const contactsMap = new Map<string, { nome?: string; telefone?: string }>();
    
    if (usuarioIds.length > 0) {
      const { data: contactsData } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .in('id', usuarioIds);
      
      if (contactsData) {
        contactsData.forEach(c => contactsMap.set(c.id, { nome: c.nome, telefone: c.telefone }));
      }
    }

    const chats: WhatsAppChat[] = uniqueChats.map(chat => {
      const contact = contactsMap.get(chat.usuarioid);
      return {
        id: chat.id,
        usuarioId: chat.usuarioid,
        iniciadoEm: new Date(chat.criadoem),
        encerradoEm: chat.encerradoem ? new Date(chat.encerradoem) : undefined,
        resolvido: chat.resolvido || false,
        filas: chat.filas,
        atualizadoEm: chat.atualizadoem ? new Date(chat.atualizadoem) : undefined,
        modoDeAtendimento: chat.mododeatendimento,
        aceitoPorAdmin: chat.aceitoporadmin || false,
        adminId: chat.adminid,
        adminIdPendente: chat.adminid_pendente,
        adminIdAntigo: chat.adminid_antigo,
        nome: contact?.nome,
        telefone: contact?.telefone,
        ativo: chat.ativo,
        picture: chat.picture
      };
    }).sort((a, b) => 
      new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime()
    );

    return chats;
  }

  // Buscar mensagens de um chat
  async getChatMessages(chatId: string): Promise<WhatsAppMessage[]> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('mensagens_whatsapp')
      .select('*')
      .eq('chatId', parseInt(chatId, 10))
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages: WhatsAppMessage[] = (data || []).map(msg => ({
      id: msg.id,
      chatId: chatId,
      usuarioId: msg.metadata?.usuarioId || '',
      mensagem: msg.message_text || '',
      tipo: msg.send === 'cliente' ? 'cliente' : 'atendente',
      enviadoEm: new Date(msg.created_at || msg.received_at),
      text: msg.message_type === 'text'
    }));

    return messages;
  }

  // Buscar todas as mensagens de um usuário
  async getMessagesByUsuarioId(usuarioId: string): Promise<WhatsAppMessage[]> {
    const supabase = requireAuthenticatedClient();
    
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats_whatsapp')
      .select('id')
      .eq('usuarioid', usuarioId);

    if (chatsError) throw chatsError;

    if (!chatsData || chatsData.length === 0) {
      return [];
    }

    const chatIds = chatsData.map(chat => chat.id);

    const { data, error } = await supabase
      .from('mensagens_whatsapp')
      .select('*')
      .in('chatId', chatIds)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages: WhatsAppMessage[] = (data || []).map(msg => ({
      id: msg.id,
      chatId: String(msg.chatId) || '',
      usuarioId: msg.metadata?.usuarioId || usuarioId,
      mensagem: msg.message_text || '',
      tipo: msg.send === 'cliente' ? 'cliente' : 'atendente',
      enviadoEm: new Date(msg.created_at || msg.received_at),
      text: msg.message_type === 'text'
    }));

    return messages;
  }

  // Criar novo chat
  async createChat(chat: Omit<WhatsAppChat, 'id' | 'iniciadoEm'>): Promise<WhatsAppChat> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('chats_whatsapp')
      .insert([{
        usuarioid: chat.usuarioId,
        encerradoem: chat.encerradoEm?.toISOString(),
        resolvido: chat.resolvido,
        filas: chat.filas,
        atualizadoem: chat.atualizadoEm?.toISOString(),
        mododeatendimento: chat.modoDeAtendimento
      }])
      .select()
      .single();

    if (error) throw error;

    const newChat: WhatsAppChat = {
      id: data.id,
      usuarioId: data.usuarioid,
      iniciadoEm: new Date(data.criadoem),
      encerradoEm: data.encerradoem ? new Date(data.encerradoem) : undefined,
      resolvido: data.resolvido || false,
      filas: data.filas,
      atualizadoEm: data.atualizadoem ? new Date(data.atualizadoem) : undefined,
      modoDeAtendimento: data.mododeatendimento,
      picture: data.picture
    };

    return newChat;
  }

  // Enviar mensagem
  async sendMessage(message: Omit<WhatsAppMessage, 'id' | 'enviadoEm'>): Promise<WhatsAppMessage> {
    const supabase = requireAuthenticatedClient();
    
    await centralLogger.logInput(
      'whatsapp',
      'sendMessage',
      {
        chatId: message.chatId,
        usuarioId: message.usuarioId,
        tipo: message.tipo,
        mensagemLength: message.mensagem?.length || 0
      },
      'business'
    );

    const { data: chatData, error: chatError } = await supabase
      .from('chats_whatsapp')
      .select('*, contatos_whatsapp:usuarioid(telefone)')
      .eq('id', message.chatId)
      .single();

    if (chatError) {
      throw new Error('Chat não encontrado');
    }

    const telefone = (chatData as any).contatos_whatsapp?.telefone;

    const sendValue = message.tipo === 'sistema' ? 'sistema' : 
                      message.tipo === 'cliente' ? 'cliente' : 'atendente';

    const { data, error } = await supabase
      .from('mensagens_whatsapp')
      .insert([{
        chatId: parseInt(message.chatId, 10),
        message_type: 'text',
        message_text: message.mensagem,
        send: sendValue,
        metadata: {
          chatId: message.chatId,
          usuarioId: message.usuarioId,
          fromMe: true,
          tipo: message.tipo || 'atendente'
        },
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('chats_whatsapp')
      .update({ atualizadoem: new Date().toISOString() })
      .eq('id', message.chatId);

    const newMessage: WhatsAppMessage = {
      id: data.id,
      chatId: message.chatId,
      usuarioId: message.usuarioId,
      mensagem: data.message_text,
      tipo: message.tipo || 'atendente',
      enviadoEm: new Date(data.created_at)
    };

    await centralLogger.logProcessing(
      'whatsapp',
      'sendMessage',
      'Mensagem enviada com sucesso',
      {
        messageId: newMessage.id,
        chatId: newMessage.chatId,
        tipo: newMessage.tipo
      },
      0,
      'business'
    );

    try {
      const numero = String(telefone || '').trim();
      const mensagem = String(newMessage.mensagem || '').trim();

      if (numero && mensagem) {
        if (import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage?.getItem('debug_whatsapp') === '1') {
          console.debug('📤 [WhatsApp] Enviando mensagem via enviar-direto:', { numero, mensagemLength: mensagem.length });
        }
        await backendService.enviarMensagemWhatsAppDireto({
          numero,
          mensagem
        });
      } else {
        console.warn('⚠️ [WhatsApp] Número ou mensagem vazia, não enviando:', { numero, mensagem });
      }
    } catch (webhookError) {
      console.error('❌ Erro ao enviar mensagem via backend:', webhookError);
    }

    return newMessage;
  }

  // Verificar se o serviço está configurado
  async isConfigured(): Promise<boolean> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('id')
        .limit(1);
      
      if (error) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  async testWhatsAppConnection(): Promise<boolean> {
    return await this.isConfigured();
  }

  // Aceitar chat
  async acceptChat(chatId: string, adminId: string): Promise<WhatsAppChat> {
    const supabase = requireAuthenticatedClient();
    
    await centralLogger.logInput(
      'whatsapp',
      'acceptChat',
      { chatId, adminId },
      'business'
    );

    const { data: chatData, error: chatError } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError) throw chatError;

    const isIACategory = chatData.filas?.includes('IA') || 
                        (Array.isArray(chatData.filas) && chatData.filas.some((f: string) => f.toLowerCase() === 'ia'));
    
    const { data, error } = await supabase
      .from('chats_whatsapp')
      .update({
        mododeatendimento: 'Atendimento Humano',
        aceitoporadmin: true,
        adminid: adminId,
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId)
      .select()
      .single();

    if (error) throw error;

    await centralLogger.logProcessing(
      'whatsapp',
      'acceptChat',
      'Chat aceito com sucesso',
      { chatId, adminId },
      0,
      'business'
    );

    return {
      id: data.id,
      usuarioId: data.usuarioid,
      iniciadoEm: new Date(data.criadoem),
      encerradoEm: data.encerradoem ? new Date(data.encerradoem) : undefined,
      resolvido: data.resolvido || false,
      filas: data.filas,
      atualizadoEm: data.atualizadoem ? new Date(data.atualizadoem) : undefined,
      modoDeAtendimento: data.mododeatendimento,
      aceitoPorAdmin: data.aceitoporadmin || false,
      adminId: data.adminid,
      picture: data.picture
    };
  }

  // Resolver chat
  async resolveChat(chatId: string): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({
        resolvido: true,
        encerradoem: new Date().toISOString(),
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) throw error;
  }

  // Transferir chat
  async transferChat(chatId: string, newAdminId: string, oldAdminId: string): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({
        adminid_pendente: newAdminId,
        adminid_antigo: oldAdminId,
        aceitoporadmin: false,
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) throw error;
  }

  // Reabrir chat
  async reopenChat(chatId: string): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({
        resolvido: false,
        encerradoem: null,
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) throw error;
  }

  // Atualizar fila do chat
  async updateChatQueue(chatId: string, queue: string): Promise<void> {
    const supabase = requireAuthenticatedClient();
    
    const { error } = await supabase
      .from('chats_whatsapp')
      .update({
        filas: queue,
        atualizadoem: new Date().toISOString()
      })
      .eq('id', chatId);

    if (error) throw error;
  }

  // Buscar contato por ID
  async getContactById(contactId: string): Promise<WhatsAppContact | null> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('contatos_whatsapp')
      .select('*')
      .eq('id', contactId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      nome: data.nome,
      telefone: data.telefone,
      criadoEm: new Date(data.criadoem)
    };
  }

  // Buscar chat por ID
  async getChatById(chatId: string): Promise<WhatsAppChat | null> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('chats_whatsapp')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      usuarioId: data.usuarioid,
      iniciadoEm: new Date(data.criadoem),
      encerradoEm: data.encerradoem ? new Date(data.encerradoem) : undefined,
      resolvido: data.resolvido || false,
      filas: data.filas,
      atualizadoEm: data.atualizadoem ? new Date(data.atualizadoem) : undefined,
      modoDeAtendimento: data.mododeatendimento,
      aceitoPorAdmin: data.aceitoporadmin || false,
      adminId: data.adminid,
      adminIdPendente: data.adminid_pendente,
      adminIdAntigo: data.adminid_antigo,
      ativo: data.ativo,
      picture: data.picture
    };
  }

  // Fechar chat (alias para resolveChat para compatibilidade)
  async closeChat(chatId: string, adminId?: number): Promise<void> {
    await this.resolveChat(chatId);
  }

  // Recarregar config (stub para compatibilidade)
  async reloadConfig(): Promise<void> {
    // Método de compatibilidade - não precisa fazer nada
  }
}

export const supabaseWhatsAppService = new SupabaseWhatsAppService();
