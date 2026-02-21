import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { VagaEmprego, CreateVagaData, UpdateVagaData } from '@/types/vagas';
import { toast } from '@/lib/toast';
import { useLogsVagas } from './useLogsVagas';

export const useVagas = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['vagas', searchTerm],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('vagas_emprego')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`titulo.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VagaEmprego[];
    },
  });
};

export const useAllVagas = () => {
  return useQuery({
    queryKey: ['vagas', 'all'],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('vagas_emprego')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VagaEmprego[];
    },
  });
};

export const useCreateVaga = () => {
  const queryClient = useQueryClient();
  const { registrarLog } = useLogsVagas();

  return useMutation({
    mutationFn: async (vaga: CreateVagaData) => {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('vagas_emprego')
        .insert(vaga)
        .select()
        .single();

      if (error) throw error;
      return data as VagaEmprego;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['vagas'] });
      toast.success('Vaga criada com sucesso!');
      
      // Registrar log
      await registrarLog({
        tipo_de_acao: 'criar',
        vaga_id: data.id,
        dados_novos: {
          titulo: data.titulo,
          cidade: data.cidade,
          descricao: data.descricao,
          requisitos: data.requisitos,
          vagas: data.vagas,
          ativo: data.ativo
        }
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar vaga: ' + error.message);
    },
  });
};

export const useUpdateVaga = () => {
  const queryClient = useQueryClient();
  const { registrarLog } = useLogsVagas();

  return useMutation({
    mutationFn: async ({ id, data, dadosAnteriores }: { id: number; data: UpdateVagaData; dadosAnteriores?: VagaEmprego }) => {
      const supabase = requireAuthenticatedClient();
      const { data: updated, error } = await supabase
        .from('vagas_emprego')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { updated: updated as VagaEmprego, dadosAnteriores };
    },
    onSuccess: async ({ updated, dadosAnteriores }) => {
      queryClient.invalidateQueries({ queryKey: ['vagas'] });
      toast.success('Vaga atualizada com sucesso!');
      
      // Determinar tipo de ação
      let tipoAcao: 'editar' | 'ativar' | 'desativar' = 'editar';
      if (dadosAnteriores && dadosAnteriores.ativo !== updated.ativo) {
        tipoAcao = updated.ativo ? 'ativar' : 'desativar';
      }
      
      // Registrar log
      await registrarLog({
        tipo_de_acao: tipoAcao,
        vaga_id: updated.id,
        dados_anteriores: dadosAnteriores ? {
          titulo: dadosAnteriores.titulo,
          cidade: dadosAnteriores.cidade,
          descricao: dadosAnteriores.descricao,
          requisitos: dadosAnteriores.requisitos,
          vagas: dadosAnteriores.vagas,
          ativo: dadosAnteriores.ativo
        } : null,
        dados_novos: {
          titulo: updated.titulo,
          cidade: updated.cidade,
          descricao: updated.descricao,
          requisitos: updated.requisitos,
          vagas: updated.vagas,
          ativo: updated.ativo
        }
      });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar vaga: ' + error.message);
    },
  });
};

export const useDeleteVaga = () => {
  const queryClient = useQueryClient();
  const { registrarLog } = useLogsVagas();

  return useMutation({
    mutationFn: async ({ id, dadosAnteriores }: { id: number; dadosAnteriores?: VagaEmprego }) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('vagas_emprego')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, dadosAnteriores };
    },
    onSuccess: async ({ id, dadosAnteriores }) => {
      queryClient.invalidateQueries({ queryKey: ['vagas'] });
      toast.success('Vaga excluída com sucesso!');
      
      // Registrar log
      await registrarLog({
        tipo_de_acao: 'excluir',
        vaga_id: id,
        dados_anteriores: dadosAnteriores ? {
          titulo: dadosAnteriores.titulo,
          cidade: dadosAnteriores.cidade,
          descricao: dadosAnteriores.descricao,
          requisitos: dadosAnteriores.requisitos,
          vagas: dadosAnteriores.vagas,
          ativo: dadosAnteriores.ativo
        } : null
      });
    },
    onError: (error) => {
      toast.error('Erro ao excluir vaga: ' + error.message);
    },
  });
};
