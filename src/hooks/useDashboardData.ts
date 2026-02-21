import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface DashboardStats {
  usuarios: { total: number; change: string };
  cargos: { total: number; change: string };
  permissoes: { total: number; change: string };
  veiculos: { total: number; change: string };
}

interface DashboardActivity {
  icon: string;
  title: string;
  time: string;
  color: string;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    usuarios: { total: 0, change: '+0%' },
    cargos: { total: 0, change: '+0%' },
    permissoes: { total: 0, change: '+0%' },
    veiculos: { total: 0, change: '+0%' }
  });
  
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar atividades das últimas 24 horas (1 dia)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const supabase = requireAuthenticatedClient();
        const { data: activityLogs, error: activityError } = await supabase
          .from('auth_activity_log')
          .select('*, usuario:usuarios!auth_activity_log_usuario_id_fkey(nome)')
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (activityError) throw activityError;

        // Mapear atividades para o formato esperado
        const mappedActivities = (activityLogs || []).map(log => {
          const iconMap: Record<string, string> = {
            'login': 'users',
            'logout': 'users',
            'usuario_criado': 'users',
            'usuario_atualizado': 'users',
            'contato_visualizado': 'file-text',
            'contato_arquivado': 'file-text',
            'status_cotacao_atualizado': 'shield',
            'ocorrencia_status_alterado': 'activity',
          };

          return {
            icon: iconMap[log.acao] || 'activity',
            title: `${log.usuario?.nome || 'Usuário'}: ${log.acao.replace(/_/g, ' ')}`,
            time: formatTimeAgo(log.created_at),
            color: 'bg-blue-500'
          };
        });

        setActivities(mappedActivities);
        
        // Buscar estatísticas (mantém mock por enquanto)
        setStats({
          usuarios: { total: 245, change: '+12%' },
          cargos: { total: 15, change: '+5%' },
          permissoes: { total: 32, change: '+8%' },
          veiculos: { total: 89, change: '+15%' }
        });
        
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error('Erro ao buscar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Função auxiliar para formatar tempo
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `há ${Math.floor(diffHours / 24)} dia${Math.floor(diffHours / 24) !== 1 ? 's' : ''}`;
    }
  };

  return { stats, activities, isLoading, error };
};
