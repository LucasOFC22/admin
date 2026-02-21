import { requireAuthenticatedClient, getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { CookieAuth } from '@/lib/auth/cookieAuth';

export interface LogWhatsApp {
  id: string;
  usuario_id: string;
  contato_id?: string;
  chat_id?: number;
  acao: string;
  detalhes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LogWhatsAppWithRelations extends LogWhatsApp {
  usuarios?: { nome: string };
  contatos_whatsapp?: { nome: string; telefone: string };
}

export interface CreateLogParams {
  acao: string;
  contato_id?: string;
  chat_id?: number;
  detalhes?: Record<string, any>;
}

export interface FetchLogsParams {
  contato_id?: string;
  chat_id?: number;
  acao?: string;
  usuario_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

class LogsWhatsAppService {
  async registrarLog(params: CreateLogParams): Promise<void> {
    try {
      const supabase = getAuthenticatedSupabaseClient();
      if (!supabase) {
        console.warn('[LogsWhatsApp] Usuário não autenticado, log não registrado');
        return;
      }
      
      const userId = CookieAuth.getUserId();

      if (!userId) {
        console.warn('[LogsWhatsApp] UserId não encontrado no cookie, log não registrado');
        return;
      }

      const logData = {
        usuario_id: userId,
        contato_id: params.contato_id || null,
        chat_id: params.chat_id || null,
        acao: params.acao,
        detalhes: params.detalhes || {},
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('logs_whatsapp')
        .insert(logData);

      if (error) {
        console.error('[LogsWhatsApp] Erro ao registrar log:', error);
      } else if (import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage?.getItem('debug_whatsapp') === '1') {
        console.debug(`[LogsWhatsApp] Log registrado: ${params.acao}`);
      }
    } catch (error) {
      console.error('[LogsWhatsApp] Erro ao registrar log:', error);
    }
  }

  async buscarLogs(params: FetchLogsParams = {}): Promise<{ data: LogWhatsAppWithRelations[]; count: number }> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // Buscar logs sem join de usuarios (não há foreign key direto)
      let query = supabase
        .from('logs_whatsapp')
        .select(`
          *,
          contatos_whatsapp:contato_id(nome, telefone)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params.contato_id) {
        query = query.eq('contato_id', params.contato_id);
      }

      if (params.chat_id) {
        query = query.eq('chat_id', params.chat_id);
      }

      if (params.acao) {
        query = query.eq('acao', params.acao);
      }

      if (params.usuario_id) {
        query = query.eq('usuario_id', params.usuario_id);
      }

      if (params.start_date) {
        query = query.gte('created_at', params.start_date);
      }

      if (params.end_date) {
        query = query.lte('created_at', params.end_date + 'T23:59:59.999Z');
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Buscar nomes dos usuários separadamente (usuario_id é supabase_id de auth.users)
      const usuarioIds = [...new Set((data || []).map(log => log.usuario_id).filter(Boolean))];
      const usuariosMap = new Map<string, string>();
      
      if (usuarioIds.length > 0) {
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('supabase_id, nome')
          .in('supabase_id', usuarioIds);
        
        if (usuariosData) {
          usuariosData.forEach(u => usuariosMap.set(u.supabase_id, u.nome));
        }
      }

      // Enriquecer logs com nomes de usuários
      const enrichedData = (data || []).map(log => ({
        ...log,
        usuarios: log.usuario_id ? { nome: usuariosMap.get(log.usuario_id) || 'Desconhecido' } : undefined
      }));

      return { 
        data: enrichedData as LogWhatsAppWithRelations[], 
        count: count || 0 
      };
    } catch (error) {
      console.error('[LogsWhatsApp] Erro ao buscar logs:', error);
      return { data: [], count: 0 };
    }
  }

  async buscarContatos(): Promise<{ id: string; nome: string; telefone: string }[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[LogsWhatsApp] Erro ao buscar contatos:', error);
      return [];
    }
  }

  async buscarChatsPorContato(contatoId: string): Promise<{ id: number; criadoem: string }[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('chats_whatsapp')
        .select('id, criadoem')
        .eq('usuarioid', contatoId)
        .order('criadoem', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[LogsWhatsApp] Erro ao buscar chats:', error);
      return [];
    }
  }

  async buscarUsuariosAdmin(): Promise<{ id: string; nome: string }[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('usuarios')
        .select('supabase_id, nome')
        .eq('acesso_area_admin', true)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return (data || []).map(u => ({ id: u.supabase_id, nome: u.nome }));
    } catch (error) {
      console.error('[LogsWhatsApp] Erro ao buscar usuários:', error);
      return [];
    }
  }
}

export const logsWhatsAppService = new LogsWhatsAppService();
