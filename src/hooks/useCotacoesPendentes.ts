import { useQuery } from '@tanstack/react-query';
import { backendService } from '@/services/api/backendService';
import { mapSupabaseCotacoes, MappedQuote } from '@/utils/cotacaoMapper';

export interface CotacaoPendente extends MappedQuote {
  prioridade: 'urgente' | 'medio' | 'suave';
  horasPendente: number;
}

export const getPrioridadeCotacaoColor = (level: CotacaoPendente['prioridade']) => {
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

export const getPrioridadeCotacaoLabel = (level: CotacaoPendente['prioridade']) => {
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

const calcularPrioridade = (criadoEm: string | Date): { prioridade: CotacaoPendente['prioridade']; horasPendente: number } => {
  const criado = new Date(criadoEm);
  const agora = new Date();
  const horasPendente = Math.round(((agora.getTime() - criado.getTime()) / (1000 * 60 * 60)) * 10) / 10;

  let prioridade: CotacaoPendente['prioridade'] = 'suave';
  if (horasPendente > 48) {
    prioridade = 'urgente';
  } else if (horasPendente > 24) {
    prioridade = 'medio';
  }

  return { prioridade, horasPendente };
};

export const useCotacoesPendentes = () => {
  return useQuery({
    queryKey: ['cotacoes-pendentes'],
    queryFn: async (): Promise<CotacaoPendente[]> => {
      const response = await backendService.buscarCotacoes({});

      if (!response.success) {
        throw new Error('Erro ao buscar cotações');
      }

      const responseData = response.data || [];
      const quotesArray = Array.isArray(responseData) && responseData[0]?.data
        ? responseData[0].data
        : Array.isArray(responseData) ? responseData : [];

      const mapped = mapSupabaseCotacoes(quotesArray as any);

      // Filtrar: valor = 0 significa sem valor (pendente de precificação)
      const pendentes = mapped
        .filter(q => q.value === 0 || q.value === null || q.value === undefined)
        .map(q => {
          const { prioridade, horasPendente } = calcularPrioridade(q.criadoEm);
          return { ...q, prioridade, horasPendente } as CotacaoPendente;
        })
        .sort((a, b) => b.horasPendente - a.horasPendente); // mais antigas primeiro

      return pendentes;
    },
    refetchInterval: 60000,
  });
};
