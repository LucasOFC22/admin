import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface FreightStats {
  fretes7dias: number;
  fretes15dias: number;
  fretes30dias: number;
}

interface UseClientFreightStatsReturn {
  stats: FreightStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const API_URL = 'https://api.fptranscargas.com.br/cotacao';

export const useClientFreightStats = (): UseClientFreightStatsReturn => {
  const { user } = useUnifiedAuth();
  const [stats, setStats] = useState<FreightStats>({
    fretes7dias: 0,
    fretes15dias: 0,
    fretes30dias: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFreightStats = async () => {
    if (!user?.cnpjcpf) {
      setIsLoading(false);
      setError('CNPJ/CPF do usuário não encontrado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'cotacao',
          acao: 'buscar-cotacao-cliente',
          cnpjcpf: user.cnpjcpf,
        }),
      });

      if (!response.ok) {
        console.error('Erro ao buscar fretes:', response.statusText);
        setError('Erro ao buscar dados de fretes');
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Processar a resposta para contar fretes por período
      const cotacoes = data?.cotacoes || data?.data || data || [];
      
      if (!Array.isArray(cotacoes)) {
        console.warn('Resposta inesperada do backend:', data);
        setStats({ fretes7dias: 0, fretes15dias: 0, fretes30dias: 0 });
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const dias7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dias15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const dias30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let fretes7dias = 0;
      let fretes15dias = 0;
      let fretes30dias = 0;

      cotacoes.forEach((cotacao: any) => {
        const dataCotacao = new Date(cotacao.data_criacao || cotacao.created_at || cotacao.data);
        
        if (dataCotacao >= dias7) {
          fretes7dias++;
        }
        if (dataCotacao >= dias15) {
          fretes15dias++;
        }
        if (dataCotacao >= dias30) {
          fretes30dias++;
        }
      });

      setStats({ fretes7dias, fretes15dias, fretes30dias });
    } catch (err) {
      console.error('Erro ao buscar estatísticas de fretes:', err);
      setError('Erro ao carregar estatísticas de fretes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.cnpjcpf) {
      fetchFreightStats();
    }
  }, [user?.cnpjcpf]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchFreightStats,
  };
};
