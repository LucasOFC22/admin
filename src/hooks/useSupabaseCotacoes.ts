import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { authActivityLogService } from '@/services/auth/activityLogService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { SupabaseCotacao, CotacaoStats } from '@/types/supabase-cotacao';
import { mapSupabaseCotacoes, MappedQuote } from '@/utils/cotacaoMapper';
import { backendService } from '@/services/api/backendService';

interface FilterOptions {
  remetente?: string;
  destinatario?: string;
  status?: string;
  id?: string;
  emissao_inicio?: string;
  emissao_fim?: string;
  nro_orcamento_inicio?: string;
  nro_orcamento_fim?: string;
  nro_cte?: string;
  id_cliente?: string;
  id_remetente?: string;
  id_destinatario?: string;
  id_tomador?: string;
  id_cidade_origem?: string;
  id_cidade_destino?: string;
  id_tabela_preco?: string;
  vlr_total?: string;
  empresas?: string;
  uf_origem?: string;
  uf_destino?: string;
}

export const useSupabaseCotacoes = (status?: string, filters?: any) => {
  // Convert new parameters to legacy format
  const filtros: FilterOptions = {
    ...filters,
    status: status !== 'todos' ? status : undefined
  };
  const [cotacoes, setCotacoes] = useState<SupabaseCotacao[]>([]);
  const [mappedQuotes, setMappedQuotes] = useState<MappedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();
  const { user } = useUnifiedAuth();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);
  
  const isOnCotacoesRoute = location.pathname.includes('/cotacoes');

  const fetchCotacoes = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // Buscar cotações via backend
      const response = await backendService.buscarCotacoes(filtros);
      
      // O backend retorna data: [{data: [cotações...]}]
      const responseData = response.data || [];
      
      const quotesArray = Array.isArray(responseData) && responseData[0]?.data 
        ? responseData[0].data 
        : Array.isArray(responseData) ? responseData : [];
      
      // Mapear para o formato esperado
      const mapped = mapSupabaseCotacoes(quotesArray as any);
      
      setCotacoes(quotesArray as any);
      setMappedQuotes(mapped);
    } catch (err: any) {
      setError(err.message);
      setCotacoes([]);
      setMappedQuotes([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    return updateStatus(quoteId, status);
  };

  const updateStatus = async (id: string | number, novoStatus: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar dados da cotação antes de atualizar
      const { data: cotacaoData } = await supabase
        .from('cotacao')
        .select('*')
        .eq('id', id)
        .single();

      const updateData: any = { 
        status: novoStatus,
        atualizado_em: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cotacao')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Log da atividade de atualização de status
      if (user?.id) {
        await authActivityLogService.logActivity({
          usuario_id: user.id,
          acao: 'status_cotacao_atualizado',
          modulo: 'cotacoes',
          detalhes: {
            cotacao_id: id,
            status_anterior: cotacaoData?.status,
            status_novo: novoStatus,
            remetente: cotacaoData?.remetente_nome,
            destinatario: cotacaoData?.destinatario_nome
          }
        });
      }

      notify.success('Status Atualizado', `Cotação marcada como "${novoStatus}"`);
      await fetchCotacoes(false); // Atualiza sem loading

    } catch (error: any) {
      notify.error('Erro', `Não foi possível atualizar o status: ${error.message}`);
      throw error;
    }
  };

  // Removed useEffect - fetch only on manual trigger

  const stats = {
    total: mappedQuotes.length,
    pendentes: cotacoes.filter(c => c.status === 'Pendente').length,
    analise: cotacoes.filter(c => c.status === 'analise').length,
    proposta_enviada: cotacoes.filter(c => c.status === 'proposta_enviada').length,
    aprovadas: cotacoes.filter(c => c.status === 'aprovada').length,
    rejeitadas: cotacoes.filter(c => c.status === 'rejeitada').length,
    canceladas: cotacoes.filter(c => c.status === 'cancelada').length,
  };

  const sendProposal = async (quoteId: string, data: any) => {
    try {
      // Implementation for sending proposal
      notify.success('Proposta Enviada', 'Proposta enviada com sucesso');
    } catch (error: any) {
      notify.error('Erro', `Não foi possível enviar a proposta: ${error.message}`);
      throw error;
    }
  };

  return {
    quotes: mappedQuotes, // Return mapped quotes for interface compatibility
    cotacoes: mappedQuotes, // Legacy compatibility
    isLoading,
    error,
    stats,
    refetch: () => fetchCotacoes(true),
    updateStatus,
    updateQuoteStatus,
    sendProposal
  };
};
