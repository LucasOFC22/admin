import { useState, useEffect } from 'react';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { QuotesFilters } from './useQuotesFilters';
import { backendService } from '@/services/api/backendService';

interface AdminQuote {
  id: string;
  quoteId: string;
  senderName: string;
  senderDocument: string;
  recipientName: string;
  recipientDocument: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: string;
  value: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'proposta_enviada' | 'aceitar' | 'rejeitar' | 'recusada';
  createdAt: string;
  validUntil: string;
  [key: string]: any;
}

export const useAdminQuotes = (status?: string, filters?: QuotesFilters) => {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [allQuotes, setAllQuotes] = useState<AdminQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filtros: any = {};
      
      if (status && status !== 'todos') {
        filtros.status = status;
      }
      
      if (filters) {
        if (filters.remetenteCNPJ) filtros.remetente = filters.remetenteCNPJ;
        if (filters.destinatarioCNPJ) filtros.destinatario = filters.destinatarioCNPJ;
        if (filters.cotacaoId) filtros.id = filters.cotacaoId;
        if (filters.dateRange?.from) filtros.dataInicio = filters.dateRange.from.toISOString();
        if (filters.dateRange?.to) filtros.dataFim = filters.dateRange.to.toISOString();
        if (filters.valueRangeMin) filtros.vlr_min = filters.valueRangeMin;
        if (filters.valueRangeMax) filtros.vlr_max = filters.valueRangeMax;
      }

      const response = await backendService.buscarCotacoes(filtros);
      
      if (response.success && response.data) {
        const quotesData = Array.isArray(response.data) ? response.data : [];
        
        const mappedQuotes = quotesData.map((q: any) => {
          const getId = () => String(q.idOrcamento || '');
          const getQuoteId = () => String(q.nroOrcamento || q.idOrcamento || '');
          const getOrigin = () => {
            const city = q.cidadeOrigem || '';
            const state = q.ufOrigem || '';
            return city && state ? `${city}, ${state}` : city || state || '';
          };
          const getDestination = () => {
            const city = q.cidadeDestino || '';
            const state = q.ufDestino || '';
            return city && state ? `${city}, ${state}` : city || state || '';
          };

          return {
            id: getId(),
            quoteId: getQuoteId(),
            senderName: String(q.remetenteNome || q.solicitante || ''),
            senderDocument: String(q.remetenteCnpj || ''),
            recipientName: String(q.destinatarioNome || ''),
            recipientDocument: String(q.destinatarioCnpj || ''),
            origin: getOrigin(),
            destination: getDestination(),
            cargoType: String(q.descTabela || ''),
            weight: q.peso ? `${q.peso} kg` : '',
            value: parseFloat(q.vlrTotal || 0),
            status: q.status || 'pending',
            createdAt: String(q.emissao || new Date().toISOString()),
            validUntil: String(q.validade || ''),
            clientName: String(q.solicitante || ''),
            ...q
          };
        });

        setQuotes(mappedQuotes);
        setAllQuotes(mappedQuotes);
      } else {
        setQuotes([]);
        setAllQuotes([]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar cotações:', err);
      setError(err.message);
      setQuotes([]);
      setAllQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [status, filters]);

  const getQuotesByStatus = (statusFilter: string) => {
    return allQuotes.filter(q => q.status === statusFilter);
  };

  const stats = {
    total: allQuotes.length,
    pending: allQuotes.filter(q => q.status === 'pending' || !q.status).length,
    approved: allQuotes.filter(q => q.status === 'approved' || q.status === 'aceitar').length,
    rejected: allQuotes.filter(q => q.status === 'rejected' || q.status === 'rejeitar' || q.status === 'recusada').length,
    sent: allQuotes.filter(q => q.status === 'proposta_enviada').length,
  };

  return {
    quotes,
    allQuotes,
    isLoading,
    error,
    stats,
    getQuotesByStatus,
    refetch: fetchQuotes
  };
};
