import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

export interface EmailLogDB {
  id: string;
  uid: number | null;
  erro: string | null;
  html: string | null;
  pasta: string | null;
  assunto: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  destinatario: string | null;
  tipo_de_acao: string | null;
  conta_email_id: string | null;
  usuario_responsavel: string | null;
  // Campos joined
  conta_email?: { email: string } | null;
  usuario?: { nome: string } | null;
}

export interface EmailLogsFilters {
  startDate: string;
  endDate: string;
  tipoAcao?: string;
  status?: 'all' | 'success' | 'error';
  contaEmailId?: string;
  usuarioResponsavelId?: string;
  search?: string;
  uid?: string;
}

export interface EmailLogsStats {
  total: number;
  enviados: number;
  respondidos: number;
  cc: number;
  cco: number;
  erros: number;
}

export const getEmailLogs = async (
  filters: EmailLogsFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<{ data: EmailLogDB[]; count: number }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const client = requireAuthenticatedClient();

    let query = client
      .from('logs_email')
      .select(`
        *,
        conta_email:email_contas(email),
        usuario:usuarios!usuario_responsavel(nome)
      `, { count: 'exact' })
      .gte('created_at', `${filters.startDate}T00:00:00`)
      .lte('created_at', `${filters.endDate}T23:59:59`)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filtro por tipo de ação
    if (filters.tipoAcao && filters.tipoAcao !== 'all') {
      query = query.eq('tipo_de_acao', filters.tipoAcao);
    }

    // Filtro por status (sucesso/erro)
    if (filters.status === 'success') {
      query = query.is('erro', null);
    } else if (filters.status === 'error') {
      query = query.not('erro', 'is', null);
    }

    // Filtro por conta de email
    if (filters.contaEmailId) {
      query = query.eq('conta_email_id', filters.contaEmailId);
    }

    // Filtro por usuário responsável
    if (filters.usuarioResponsavelId) {
      query = query.eq('usuario_responsavel', filters.usuarioResponsavelId);
    }

    // Filtro por UID específico
    if (filters.uid) {
      query = query.eq('uid', filters.uid);
    }

    // Busca por texto
    if (filters.search) {
      query = query.or(`assunto.ilike.%${filters.search}%,destinatario.ilike.%${filters.search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      await logErrorToDatabase({
        titulo: 'Erro ao buscar logs de email',
        descricao: error.message,
        categoria: 'logs_email',
        nivel: 'error',
        dados_extra: { filters, error }
      });
      throw error;
    }

    return { data: (data || []) as EmailLogDB[], count: count || 0 };
  } catch (err) {
    console.error('Erro ao buscar logs de email:', err);
    throw err;
  }
};

export const getEmailLogsStats = async (filters: EmailLogsFilters): Promise<EmailLogsStats> => {
  try {
    const client = requireAuthenticatedClient();
    
    const { data, error } = await client
      .from('logs_email')
      .select('tipo_de_acao, erro')
      .gte('created_at', `${filters.startDate}T00:00:00`)
      .lte('created_at', `${filters.endDate}T23:59:59`);

    if (error) {
      await logErrorToDatabase({
        titulo: 'Erro ao buscar estatísticas de logs de email',
        descricao: error.message,
        categoria: 'logs_email',
        nivel: 'error',
        dados_extra: { filters, error }
      });
      throw error;
    }

    const stats: EmailLogsStats = {
      total: data?.length || 0,
      enviados: 0,
      respondidos: 0,
      cc: 0,
      cco: 0,
      erros: 0
    };

    data?.forEach((log) => {
      const tipo = (log.tipo_de_acao || '').toLowerCase();
      
      if (log.erro) {
        stats.erros++;
      }

      if (tipo.includes('enviad') || tipo === 'enviado' || tipo === 'send') {
        stats.enviados++;
      } else if (tipo.includes('respond') || tipo === 'respondido' || tipo === 'reply') {
        stats.respondidos++;
      } else if (tipo === 'cc') {
        stats.cc++;
      } else if (tipo === 'cco' || tipo === 'bcc') {
        stats.cco++;
      }
    });

    return stats;
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return { total: 0, enviados: 0, respondidos: 0, cc: 0, cco: 0, erros: 0 };
  }
};

export const getContasEmail = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const client = requireAuthenticatedClient();
    
    const { data, error } = await client
      .from('email_contas')
      .select('id, email')
      .order('email');

    if (error) throw error;

    return (data || []).map(c => ({ value: c.id, label: c.email }));
  } catch (err) {
    console.error('Erro ao buscar contas de email:', err);
    return [];
  }
};

export const getUsuariosResponsaveis = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const client = requireAuthenticatedClient();
    
    // Buscar usuários únicos que aparecem nos logs
    const { data, error } = await client
      .from('logs_email')
      .select('usuario_responsavel, usuario:usuarios!usuario_responsavel(id, nome)')
      .not('usuario_responsavel', 'is', null);

    if (error) throw error;

    // Deduplica e formata
    const uniqueUsers = new Map<string, string>();
    (data || []).forEach((log: any) => {
      if (log.usuario_responsavel && log.usuario?.nome) {
        uniqueUsers.set(log.usuario_responsavel, log.usuario.nome);
      }
    });

    return Array.from(uniqueUsers.entries())
      .map(([id, nome]) => ({ value: id, label: nome }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    console.error('Erro ao buscar usuários responsáveis:', err);
    return [];
  }
};
