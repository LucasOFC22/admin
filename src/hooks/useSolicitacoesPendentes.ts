import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface SolicitacaoPendente {
  id: string;
  tipo_documento: string;
  numero_cte: string | null;
  numero_nfe: string | null;
  cpf_cnpj: string | null;
  email_resposta: string | null;
  origem: string | null;
  criado_em: string;
  prioridade: 'urgente' | 'medio' | 'suave';
  horas_pendente: number;
}

export const getPrioridadeDocColor = (level: SolicitacaoPendente['prioridade']) => {
  switch (level) {
    case 'urgente':
      return 'bg-red-500 text-white';
    case 'medio':
      return 'bg-yellow-500 text-black';
    case 'suave':
      return 'bg-green-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPrioridadeDocLabel = (level: SolicitacaoPendente['prioridade']) => {
  switch (level) {
    case 'urgente':
      return 'Urgente';
    case 'medio':
      return 'Médio';
    case 'suave':
      return 'Suave';
    default:
      return level;
  }
};

export const useSolicitacoesPendentes = () => {
  return useQuery({
    queryKey: ['solicitacoes-documentos-pendentes'],
    queryFn: async (): Promise<SolicitacaoPendente[]> => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.rpc('get_solicitacoes_documentos_pendentes');

      if (error) {
        console.error('Erro ao buscar solicitações pendentes:', error);
        throw error;
      }

      return (data || []) as SolicitacaoPendente[];
    },
    refetchInterval: 60000,
  });
};
