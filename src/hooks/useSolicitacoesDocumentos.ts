import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { SolicitacaoDocumento } from '@/types/database';
import { toast } from '@/lib/toast';
import { useActivityLogger } from './useActivityLogger';

interface UseSolicitacoesDocumentosParams {
  search?: string;
  status?: string;
  tipo?: string;
}

export const useSolicitacoesDocumentos = (params: UseSolicitacoesDocumentosParams = {}) => {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLogger();

  // Fetch solicitações
  const { data: solicitacoes = [], isLoading, refetch } = useQuery({
    queryKey: ['solicitacoes-documentos', params],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('solicitacoes_documentos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.tipo) {
        query = query.eq('tipo_documento', params.tipo);
      }

      if (params.search) {
        query = query.or(`email_resposta.ilike.%${params.search}%,numero_cte.ilike.%${params.search}%,numero_nfe.ilike.%${params.search}%,cpf_cnpj.ilike.%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SolicitacaoDocumento[];
    },
  });

  // Calcular estatísticas
  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === 'pendente').length,
    em_processamento: solicitacoes.filter(s => s.status === 'em_processamento').length,
    finalizados: solicitacoes.filter(s => s.status === 'finalizado').length,
    erros: solicitacoes.filter(s => s.status === 'erro').length,
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('solicitacoes_documentos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-documentos'] });
      toast.success('Status atualizado com sucesso');
      
      logActivity({
        acao: 'solicitacao_documento_status_atualizado',
        modulo: 'solicitacoes-documentos',
        detalhes: {
          solicitacao_id: data.id,
          novo_status: data.status
        }
      });
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('solicitacoes_documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-documentos'] });
      toast.success('Solicitação excluída com sucesso');
      
      logActivity({
        acao: 'solicitacao_documento_excluida',
        modulo: 'solicitacoes-documentos',
        detalhes: {
          solicitacao_id: id
        }
      });
    },
    onError: () => {
      toast.error('Erro ao excluir solicitação');
    },
  });

  return {
    solicitacoes,
    isLoading,
    stats,
    refetch,
    updateStatus: updateStatusMutation.mutate,
    deleteSolicitacao: deleteMutation.mutate,
  };
};
