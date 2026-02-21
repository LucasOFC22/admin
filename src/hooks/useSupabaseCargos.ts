import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { Cargo, CreateCargoData, UpdateCargoData, CargoComDepartamento } from '@/types/database';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';
import { logService } from '@/services/logger/logService';

export const useSupabaseCargos = () => {
  const queryClient = useQueryClient();
  const { notify } = useCustomNotifications();

  // Query para buscar todos os cargos - OTIMIZADO: sem polling agressivo
  const {
    data: cargos = [],
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['cargos'],
    queryFn: async (): Promise<CargoComDepartamento[]> => {
      try {
        const supabase = requireAuthenticatedClient();
        
        // Buscar cargos
        const { data: cargosData, error: cargosError } = await supabase
          .from('cargos')
          .select('*')
          .order('nome');

        if (cargosError) {
          console.error('Erro ao buscar cargos:', cargosError);
          
          await logErrorToDatabase({
            titulo: 'Erro ao buscar cargos',
            descricao: cargosError.message || 'Falha na query de cargos',
            categoria: 'database',
            nivel: 'error',
            dados_extra: { error: cargosError }
          });
          
          throw new Error('Erro ao carregar cargos');
        }

        // Buscar departamentos
        const { data: departamentosData, error: departamentosError } = await supabase
          .from('cargos_departamento')
          .select('*');

        if (departamentosError) {
          console.error('Erro ao buscar departamentos:', departamentosError);
          
          await logErrorToDatabase({
            titulo: 'Erro ao buscar departamentos',
            descricao: departamentosError.message || 'Falha na query de departamentos',
            categoria: 'database',
            nivel: 'warning',
            dados_extra: { error: departamentosError }
          });
        }

        // Combinar dados
        const cargosComDepartamento: CargoComDepartamento[] = (cargosData || []).map(cargo => {
          const departamentoInfo = departamentosData?.find(dep => dep.id === cargo.departamento);
          return {
            ...cargo,
            departamento_info: departamentoInfo
          };
        });

        return cargosComDepartamento;
      } catch (error: any) {
        await logErrorToDatabase({
          titulo: 'Erro crítico ao carregar cargos',
          descricao: error?.message || 'Erro desconhecido',
          categoria: 'database',
          nivel: 'critical',
          dados_extra: { error }
        });
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Atualiza ao focar a janela
    refetchInterval: false, // REMOVIDO: polling contínuo
    refetchIntervalInBackground: false,
  });

  // Mutation para criar cargo
  const createCargoMutation = useMutation({
    mutationFn: async (cargoData: CreateCargoData): Promise<Cargo> => {
      try {
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('cargos')
          .insert({
            ...cargoData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar cargo:', error);
          
          await logErrorToDatabase({
            titulo: 'Erro ao criar cargo',
            descricao: error.message || 'Falha ao inserir cargo',
            categoria: 'database',
            nivel: 'error',
            dados_extra: { error, cargoData }
          });
          
          throw new Error('Erro ao criar cargo');
        }

        // Log da criação
        await logService.logCargo({
          tipo_de_acao: 'criar',
          cargo_id: data.id.toString(),
          departamento_id: data.departamento?.toString() || null,
          dados_novos: {
            nome: data.nome,
            descricao: data.descricao,
            level: data.level,
            departamento: data.departamento
          }
        });

        return data;
      } catch (error: any) {
        await logErrorToDatabase({
          titulo: 'Erro crítico ao criar cargo',
          descricao: error?.message || 'Erro desconhecido',
          categoria: 'database',
          nivel: 'error',
          dados_extra: { error, cargoData }
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      notify.success('Sucesso', `Cargo "${data.nome}" criado com sucesso`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao criar cargo');
    }
  });

  // Mutation para atualizar cargo
  const updateCargoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateCargoData }): Promise<Cargo> => {
      const supabase = requireAuthenticatedClient();
      
      // Buscar dados anteriores para log
      const { data: oldData } = await supabase
        .from('cargos')
        .select('nome, descricao, level, ativo, departamento')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('cargos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cargo:', error);
        throw new Error('Erro ao atualizar cargo');
      }

      // Log da atualização
      await logService.logCargo({
        tipo_de_acao: 'editar',
        cargo_id: id.toString(),
        departamento_id: data.departamento?.toString() || null,
        dados_anteriores: oldData ? {
          nome: oldData.nome,
          descricao: oldData.descricao,
          level: oldData.level,
          ativo: oldData.ativo,
          departamento: oldData.departamento
        } : undefined,
        dados_novos: {
          nome: data.nome,
          descricao: data.descricao,
          level: data.level,
          ativo: data.ativo,
          departamento: data.departamento
        }
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      notify.success('Sucesso', `Cargo "${data.nome}" atualizado com sucesso`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao atualizar cargo');
    }
  });

  // Mutation para deletar cargo
  const deleteCargoMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const supabase = requireAuthenticatedClient();
      
      // Buscar dados para log
      const { data: cargoData } = await supabase
        .from('cargos')
        .select('nome, descricao, departamento')
        .eq('id', id)
        .single();

      // Primeiro, verificar se há usuários vinculados a este cargo
      const { data: usuarios, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('cargo', id)
        .eq('ativo', true);

      if (checkError) {
        console.error('Erro ao verificar usuários:', checkError);
        throw new Error('Erro ao verificar usuários vinculados');
      }

      if (usuarios && usuarios.length > 0) {
        throw new Error(`Não é possível excluir este cargo. Há ${usuarios.length} usuário(s) vinculado(s) a ele.`);
      }

      const { error } = await supabase
        .from('cargos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar cargo:', error);
        throw new Error('Erro ao excluir cargo');
      }

      // Log da exclusão
      await logService.logCargo({
        tipo_de_acao: 'excluir',
        cargo_id: id.toString(),
        departamento_id: cargoData?.departamento?.toString() || null,
        dados_anteriores: cargoData ? {
          nome: cargoData.nome,
          descricao: cargoData.descricao,
          departamento: cargoData.departamento
        } : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      notify.success('Sucesso', 'Cargo excluído com sucesso');
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao excluir cargo');
    }
  });

  // Funções helper
  const getCargoById = (id: number) => {
    return cargos.find(cargo => cargo.id === id);
  };

  const getStats = () => {
    const total = cargos.length;
    const ativos = cargos.filter(c => c.ativo !== false).length;
    const inativos = total - ativos;
    const admin = cargos.filter(c => {
      const nome = c.nome?.toLowerCase() || '';
      return nome.includes('admin') || nome.includes('administrador');
    }).length;

    return {
      total,
      ativos,
      inativos,
      admin,
      custom: total - admin
    };
  };

  const error = queryError ? 'Erro ao carregar cargos' : null;

  return {
    cargos,
    isLoading,
    error,
    refetch,
    getStats,
    getCargoById,
    createCargo: createCargoMutation.mutateAsync,
    updateCargo: (id: number, updates: UpdateCargoData) => 
      updateCargoMutation.mutateAsync({ id, updates }),
    deleteCargo: deleteCargoMutation.mutateAsync,
    isCreating: createCargoMutation.isPending,
    isUpdating: updateCargoMutation.isPending,
    isDeleting: deleteCargoMutation.isPending
  };
};
