import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitacaoAcessoService, SolicitacaoAcesso } from '@/services/supabase/solicitacaoAcessoService';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useMemo } from 'react';

interface UseSolicitacoesAcessosProps {
  search?: string;
}

export const useSolicitacoesAcessos = ({ search = '' }: UseSolicitacoesAcessosProps) => {
  const queryClient = useQueryClient();
  const { notify } = useCustomNotifications();

  // Query para listar solicitações
  const { data: solicitacoes = [], isLoading, error } = useQuery({
    queryKey: ['solicitacoes-acessos'],
    queryFn: () => solicitacaoAcessoService.listarSolicitacoes(),
    staleTime: 30000, // 30 segundos
  });

  // Filtrar solicitações por busca
  const filteredSolicitacoes = useMemo(() => {
    if (!search) return solicitacoes;
    
    const searchLower = search.toLowerCase();
    return solicitacoes.filter(
      (sol) =>
        sol.nome?.toLowerCase().includes(searchLower) ||
        sol.email?.toLowerCase().includes(searchLower) ||
        sol.empresa?.toLowerCase().includes(searchLower) ||
        sol.cnpj?.toLowerCase().includes(searchLower) ||
        sol.telefone?.toLowerCase().includes(searchLower)
    );
  }, [solicitacoes, search]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = solicitacoes.length;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const novas = solicitacoes.filter(
      (sol) => sol.timestamp && new Date(sol.timestamp) >= hoje
    ).length;

    const ultimos7dias = solicitacoes.filter((sol) => {
      if (!sol.timestamp) return false;
      const diff = Date.now() - new Date(sol.timestamp).getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return { total, novas, ultimos7dias };
  }, [solicitacoes]);

  // Mutation para deletar solicitação
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Não há método delete no service, mas vamos deixar preparado
      throw new Error('Funcionalidade de deletar não implementada no serviço');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-acessos'] });
      notify.success('Sucesso', 'Solicitação deletada com sucesso');
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Erro ao deletar solicitação');
    },
  });

  return {
    solicitacoes: filteredSolicitacoes,
    isLoading,
    error,
    stats,
    deleteSolicitacao: deleteMutation.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['solicitacoes-acessos'] }),
  };
};
