import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface AdminStats {
  totalContatos: number;
  contatosNovos: number;
  contatosRespondidos: number;
  contatosTrend: number;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalContatos: 0,
    contatosNovos: 0,
    contatosRespondidos: 0,
    contatosTrend: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const fetchStats = async (isManual = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = requireAuthenticatedClient();

      // Buscar contatos
      const { data: contatos, error: contatosError } = await supabase
        .from('contatos')
        .select('status, created_at');

      if (contatosError) {
        console.error('❌ Erro ao buscar contatos:', contatosError);
        throw contatosError;
      }

      // Calcular estatísticas de contatos
      const totalContatos = contatos?.length || 0;
      const contatosNovos = contatos?.filter(c => c.status === 'novo').length || 0;
      const contatosRespondidos = contatos?.filter(c => c.status === 'respondido').length || 0;

      // Calcular tendências (dados do mês atual vs mês anterior)
      const hoje = new Date();
      const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

      // Contatos do mês atual
      const contatosMesAtual = contatos?.filter(c => 
        new Date(c.created_at) >= inicioMesAtual
      ).length || 0;

      // Contatos do mês anterior
      const contatosMesAnterior = contatos?.filter(c => {
        const data = new Date(c.created_at);
        return data >= inicioMesAnterior && data <= fimMesAnterior;
      }).length || 0;

      // Calcular percentual de mudança
      const contatosTrend = contatosMesAnterior > 0
        ? ((contatosMesAtual - contatosMesAnterior) / contatosMesAnterior) * 100
        : contatosMesAtual > 0 ? 100 : 0;

      setStats({
        totalContatos,
        contatosNovos,
        contatosRespondidos,
        contatosTrend: Math.round(contatosTrend)
      });

    } catch (error: any) {
      setError(error.message || 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: () => fetchStats(true)
  };
};
