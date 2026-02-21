import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Ocorrencia, StatusOcorrencia } from '@/types/ocorrencias';
import { useActivityLogger } from './useActivityLogger';
import { toast } from '@/lib/toast';

export const useOcorrencias = (filters?: {
  tipo?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLogger();

  const { data: ocorrencias = [], isLoading, error } = useQuery({
    queryKey: ['ocorrencias', filters],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('ocorrencias')
        .select(`
          *,
          contato:contatos_whatsapp!usuario_id(nome, telefone)
        `)
        .order('criado_em', { ascending: false });

      // Aplicar filtros
      if (filters?.tipo) {
        query = query.eq('tipo_ocorrencia', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`numero_cte.ilike.%${filters.search}%,email_resposta.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%`);
      }
      if (filters?.startDate) {
        query = query.gte('criado_em', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('criado_em', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Ocorrencia[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, oldStatus }: { id: string; status: StatusOcorrencia; oldStatus: StatusOcorrencia }) => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('ocorrencias')
        .update({ 
          status,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar log na tabela logs_ocorrencia
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('id')
          .eq('supabase_id', user.id)
          .maybeSingle();

        if (profile) {
          await supabase.from('logs_ocorrencia').insert({
            ocorrencia_id: id,
            usuario_responsavel: profile.id,
            tipo_de_acao: 'status_atualizado',
            dados_anteriores: { status: oldStatus },
            dados_novos: { status: status },
            created_at: new Date().toISOString()
          });
        }
      }

      // Registrar log de atividade
      await logActivity({
        acao: 'ocorrencia_status_alterado',
        modulo: 'ocorrencias',
        detalhes: {
          ocorrencia_id: id,
          status_anterior: oldStatus,
          status_novo: status
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['ocorrencia-logs'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  });

  const addObservacaoMutation = useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao: string }) => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('ocorrencias')
        .update({ 
          descricao: observacao,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar log de atividade
      await logActivity({
        acao: 'ocorrencia_observacao_adicionada',
        modulo: 'ocorrencias',
        detalhes: {
          ocorrencia_id: id
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      toast.success('Observação adicionada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao adicionar observação:', error);
      toast.error('Erro ao adicionar observação');
    }
  });

  const editOcorrenciaMutation = useMutation({
    mutationFn: async ({ id, dados, dadosAnteriores }: { id: string; dados: Partial<Ocorrencia>; dadosAnteriores: Partial<Ocorrencia> }) => {
      const supabase = requireAuthenticatedClient();
      // Atualizar a ocorrência
      const { data, error } = await supabase
        .from('ocorrencias')
        .update({
          ...dados,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar log na tabela logs_ocorrencia
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('id')
          .eq('supabase_id', user.id)
          .maybeSingle();

        if (profile) {
          await supabase.from('logs_ocorrencia').insert({
            ocorrencia_id: id,
            usuario_responsavel: profile.id,
            tipo_de_acao: 'dados_editados',
            dados_anteriores: dadosAnteriores,
            dados_novos: dados,
            created_at: new Date().toISOString()
          });
        }
      }

      // Registrar log de atividade também
      await logActivity({
        acao: 'ocorrencia_editada',
        modulo: 'ocorrencias',
        detalhes: {
          ocorrencia_id: id,
          campos_alterados: Object.keys(dados)
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['ocorrencia-logs'] });
      toast.success('Ocorrência atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao editar ocorrência:', error);
      toast.error('Erro ao editar ocorrência');
    }
  });

  // Calcular estatísticas
  const stats = {
    total: ocorrencias.length,
    pendentes: ocorrencias.filter(o => o.status === 'pendente').length,
    em_analise: ocorrencias.filter(o => o.status === 'em_analise').length,
    resolvidas: ocorrencias.filter(o => o.status === 'resolvido').length,
    canceladas: ocorrencias.filter(o => o.status === 'cancelado').length,
    por_tipo: ocorrencias.reduce((acc, o) => {
      acc[o.tipo_ocorrencia] = (acc[o.tipo_ocorrencia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    ocorrencias,
    isLoading,
    error,
    stats,
    updateStatus: updateStatusMutation.mutate,
    addObservacao: addObservacaoMutation.mutate,
    editOcorrencia: editOcorrenciaMutation.mutate,
    isUpdating: updateStatusMutation.isPending || addObservacaoMutation.isPending || editOcorrenciaMutation.isPending
  };
};
