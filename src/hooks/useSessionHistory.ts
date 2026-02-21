import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface SessionLog {
  id: string;
  created_at: string;
  tipo_de_acao: string;
  ip_address: string | null;
  user_agent: string | null;
  sucesso: boolean;
}

const detectDevice = (userAgent: string | null): string => {
  if (!userAgent) return 'Desconhecido';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
  return 'Desktop';
};

const getActionLabel = (action: string): { label: string; variant: 'success' | 'warning' | 'error' | 'info' } => {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    login: { label: 'Login', variant: 'success' },
    logout: { label: 'Logout', variant: 'warning' },
    sessao_expirada: { label: 'Sessão Expirada', variant: 'warning' },
    acesso_negado: { label: 'Acesso Negado', variant: 'error' },
    access_denied: { label: 'Acesso Negado', variant: 'error' },
    refresh_token: { label: 'Renovação', variant: 'info' },
    acesso_painel: { label: 'Acesso ao Painel', variant: 'info' },
  };
  return map[action] || { label: action, variant: 'info' };
};

export const useSessionHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['session-history', userId],
    queryFn: async () => {
      if (!userId) return [];

      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('logs_autenticacao')
        .select('id, created_at, tipo_de_acao, ip_address, user_agent, sucesso')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((log) => ({
        ...log,
        device: detectDevice(log.user_agent),
        actionInfo: getActionLabel(log.tipo_de_acao),
      }));
    },
    enabled: !!userId,
  });
};
