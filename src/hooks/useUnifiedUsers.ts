import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useLogging } from '@/hooks/useLogging';
import { Usuario, Cargo, CreateUsuarioData, UpdateUsuarioData } from '@/types/database';
import { backendService } from '@/services/api/backendService';
import { extractCnpjCpfAtual } from '@/types/cnpjcpf';

// Re-exportar tipos necessários para outros componentes
export type { Cargo };

// Tipo para usuário com informações de cargo
export interface UsuarioComCargo extends Usuario {
  cargo_info?: Cargo;
  email_verified?: boolean;
}

export interface UnifiedUserFilters {
  searchTerm: string;
  typeFilter: 'all' | 'cliente' | 'admin';
  statusFilter: 'all' | 'ativo' | 'inativo';
  cargoFilter?: number | null;
  emailVerifiedFilter?: 'all' | 'verified' | 'pending';
  dateFrom?: string;
  dateTo?: string;
}

export type SortField = 'nome' | 'email' | 'cargo' | 'data_criacao' | 'data_ultima_atividade';
export type SortOrder = 'asc' | 'desc';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export const useUnifiedUsers = () => {
  const queryClient = useQueryClient();
  const { notify } = useCustomNotifications();
  const { logUsuario } = useLogging();
  
  // Buscar level do cargo do usuário logado
  const { data: currentUserLevel = 1 } = useQuery({
    queryKey: ['current-user-cargo-level'],
    queryFn: async (): Promise<number> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 1;
      
      // Buscar o cargo do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('cargo, nome')
        .eq('supabase_id', user.id)
        .maybeSingle();
      
      if (!userData?.cargo) {
        return 1;
      }
      
      // Buscar o level do cargo do usuário
      const { data: cargoData } = await supabase
        .from('cargos')
        .select('id, nome, level')
        .eq('id', userData.cargo)
        .maybeSingle();
      
      return cargoData?.level || 1;
    }
  });

  // Query para buscar todos os usuários com informações de cargo
  const {
    data: users = [],
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['unified-users'],
    queryFn: async (): Promise<UsuarioComCargo[]> => {
      const supabaseAuth = requireAuthenticatedClient();
      // Buscar usuários
      const { data: usuariosData, error: usuariosError } = await supabaseAuth
        .from('usuarios')
        .select('*')
        .order('nome');

      if (usuariosError) {
        console.error('Erro ao buscar usuários:', usuariosError);
        throw new Error('Erro ao carregar usuários');
      }

      // Buscar cargos
      const { data: cargosData, error: cargosError } = await supabaseAuth
        .from('cargos')
        .select('*');

      if (cargosError) {
        console.error('Erro ao buscar cargos:', cargosError);
        // Não falhar se os cargos não carregarem
      }

      // Buscar status de verificação de email do Supabase Auth via backend
      const supabaseIds = (usuariosData || [])
        .filter(u => u.supabase_id)
        .map(u => u.supabase_id);
      
      let authUsersMap: Record<string, boolean> = {};
      
      if (supabaseIds.length > 0) {
        try {
          const response = await backendService.buscarUsuarios(supabaseIds);
          console.log('🔍 Resposta do /usuario/buscar:', response);
          
          if (response.success && response.data) {
            // O backend pode retornar dados com wrapper .json (formato N8N)
            let authUsers = Array.isArray(response.data) ? response.data : [response.data];
            
            // Extrair dados do wrapper .json se existir
            authUsers = authUsers.map((item: any) => item?.json || item);
            
            console.log('📋 Usuários Auth processados:', authUsers);
            
            authUsers.forEach((authUser: any) => {
              if (authUser?.id) {
                // email_confirmed_at != null significa email verificado
                const isVerified = !!authUser.email_confirmed_at;
                console.log(`✉️ Usuário ${authUser.email}: email_confirmed_at=${authUser.email_confirmed_at}, verificado=${isVerified}`);
                authUsersMap[authUser.id] = isVerified;
              }
            });
          }
        } catch (error) {
          console.error('Erro ao buscar status de verificação:', error);
          // Continuar sem o status de verificação
        }
      }

      // Combinar dados com status de verificação do Auth
      const usuariosComCargo: UsuarioComCargo[] = (usuariosData || []).map(usuario => {
        const cargoInfo = cargosData?.find(cargo => cargo.id === usuario.cargo);
        return {
          ...usuario,
          cargo_info: cargoInfo,
          email_verified: usuario.supabase_id ? authUsersMap[usuario.supabase_id] : undefined
        };
      });

      return usuariosComCargo;
    },
    staleTime: 0, // Sempre considerar stale para Realtime funcionar
  });

  // Query para buscar cargos (para formulários)
  const { data: cargos = [] } = useQuery({
    queryKey: ['cargos'],
    queryFn: async (): Promise<Cargo[]> => {
      const supabaseAuth = requireAuthenticatedClient();
      const { data, error } = await supabaseAuth
        .from('cargos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar cargos:', error);
        return [];
      }

      return data || [];
    }
  });

  // Configurar Realtime subscription (apenas se habilitado)
  useEffect(() => {
    if (!REALTIME_ENABLED) return;

    const channel = supabase
      .channel('usuarios-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'usuarios'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unified-users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUsuarioData): Promise<Usuario> => {
      // Buscar o level do cargo selecionado
      const { data: cargoData, error: cargoError } = await supabase
        .from('cargos')
        .select('level')
        .eq('id', userData.cargo)
        .single();

      if (cargoError || !cargoData) {
        throw new Error('Cargo não encontrado');
      }

      const cargoLevel = cargoData.level || 1;

      // Verificar level do cargo do usuário logado (usar o valor do cache do React Query)
      
      if (cargoLevel > currentUserLevel) {
        throw new Error(`Você não tem permissão para criar usuários com cargo de nível ${cargoLevel}. Seu cargo tem nível ${currentUserLevel}.`);
      }

      // Cria usuário com senha padronizada "fpcargas" e envia convite
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: 'fpcargas',
        options: {
          emailRedirectTo: "https://fptranscargas.com.br/",
          data: {
            nome: userData.nome,
            telefone: userData.telefone,
            cargo: userData.cargo,
            acesso_area_admin: userData.acesso_area_admin,
            acesso_area_cliente: userData.acesso_area_cliente
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        // Tratar erro de rate limit (429 Too Many Requests)
        if (authError.status === 429 || authError.message?.includes('security purposes')) {
          const match = authError.message?.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          throw new Error(`Aguarde ${seconds} segundos antes de tentar criar outro usuário. Limite de segurança atingido.`);
        }
        // Tratar erro de email já existente
        if (authError.message?.includes('already registered')) {
          throw new Error('Este email já está cadastrado no sistema.');
        }
        throw new Error(authError.message || 'Erro ao criar usuário');
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário: dados não retornados');
      }

      // Depois insere no banco de dados com o nível hierárquico do cargo
      // Limpar dados para inserção - remover campos undefined e preparar arrays
      const insertData = {
        id: crypto.randomUUID(), // Gerar UUID para o campo id
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone || '',
        cnpjcpf: userData.cnpjcpf && Array.isArray(userData.cnpjcpf) && userData.cnpjcpf.length > 0 
          ? { cnpjcpf: userData.cnpjcpf, cnpjcpf_atual: (userData as any).cnpjcpf_atual || userData.cnpjcpf[0] }
          : null,
        cargo: userData.cargo,
        nivel_hierarquico: cargoLevel,
        acesso_area_cliente: userData.acesso_area_cliente ?? false,
        acesso_area_admin: userData.acesso_area_admin ?? false,
        ativo: userData.ativo ?? true,
        supabase_id: authData.user.id,
        data_criacao: new Date().toISOString(),
        data_ultima_atividade: new Date().toISOString(),
        filas: userData.filas && userData.filas.length > 0 ? userData.filas : null,
        tags: userData.tags && userData.tags.length > 0 ? userData.tags : null
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw new Error('Erro ao criar usuário no banco de dados');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'criar',
        usuario_afetado_id: data.id,
        dados_novos: {
          nome: userData.nome,
          email: userData.email,
          cargo_id: userData.cargo,
          acesso_area_admin: userData.acesso_area_admin,
          acesso_area_cliente: userData.acesso_area_cliente
        }
      });

      return data;
    },
    onSuccess: (data) => {
      notify.success('Sucesso', `Usuário "${data.nome}" criado com senha padrão "fpcargas"! Um email de verificação foi enviado para ${data.email}. O usuário deve confirmar o email antes de fazer login.`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao criar usuário');
    }
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateUsuarioData }): Promise<Usuario> => {
      // Buscar dados anteriores
      const { data: oldData } = await supabase
        .from('usuarios')
        .select('nome, email, cargo, acesso_area_admin, acesso_area_cliente, ativo')
        .eq('id', id)
        .single();

      let finalUpdates: Record<string, any> = { ...updates };
      
      // Se está alterando o cargo, buscar o level do novo cargo
      if (updates.cargo) {
        const { data: cargoData, error: cargoError } = await supabase
          .from('cargos')
          .select('level')
          .eq('id', updates.cargo)
          .single();

        if (cargoError || !cargoData) {
          throw new Error('Cargo não encontrado');
        }

        const cargoLevel = cargoData.level || 1;

        // Verificar level do cargo do usuário logado (usar o valor do cache do React Query)
        if (cargoLevel > currentUserLevel) {
          throw new Error(`Você não tem permissão para definir cargo de nível ${cargoLevel}. Seu cargo tem nível ${currentUserLevel}.`);
        }

        // Atualizar o nível hierárquico com base no cargo
        finalUpdates.nivel_hierarquico = cargoLevel;
      }

      // Se está atualizando cnpjcpf, converter para novo formato objeto
      if (updates.cnpjcpf && Array.isArray(updates.cnpjcpf)) {
        const newArray = updates.cnpjcpf as string[];
        // Usar cnpjcpf_atual passado pelo formulário, ou buscar o atual do banco, ou usar o primeiro
        const passedAtual = (updates as any).cnpjcpf_atual;
        
        let newAtual = passedAtual;
        if (!newAtual || !newArray.includes(newAtual)) {
          const { data: currentUserData } = await supabase
            .from('usuarios')
            .select('cnpjcpf')
            .eq('id', id)
            .single();
          
          const currentAtual = extractCnpjCpfAtual(currentUserData?.cnpjcpf);
          newAtual = currentAtual && newArray.includes(currentAtual) 
            ? currentAtual 
            : newArray[0];
        }
        
        finalUpdates.cnpjcpf = {
          cnpjcpf: newArray,
          cnpjcpf_atual: newAtual
        };
        // Remover cnpjcpf_atual separado pois já está no objeto
        delete finalUpdates.cnpjcpf_atual;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          ...finalUpdates,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw new Error('Erro ao atualizar usuário');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'editar',
        usuario_afetado_id: id.toString(),
        dados_anteriores: oldData ? {
          nome: oldData.nome,
          email: oldData.email,
          cargo: oldData.cargo,
          acesso_area_admin: oldData.acesso_area_admin,
          acesso_area_cliente: oldData.acesso_area_cliente,
          ativo: oldData.ativo
        } : undefined,
        dados_novos: { ...updates } as Record<string, unknown>
      });

      return data;
    },
    onSuccess: (data) => {
      notify.success('Sucesso', `Usuário "${data.nome}" atualizado com sucesso`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao atualizar usuário');
    }
  });

  // Mutation para desativar usuário (soft delete)
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      // Buscar dados do usuário antes da desativação
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      // Soft delete: desativar usuário e remover todos os acessos
      const { error } = await supabase
        .from('usuarios')
        .update({
          ativo: false,
          acesso_area_cliente: false,
          acesso_area_admin: false,
          cargo: null,
          filas: [],
          tags: [],
          nivel_hierarquico: 1
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao desativar usuário:', error);
        throw new Error('Erro ao desativar usuário');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'desativar',
        usuario_afetado_id: id.toString(),
        dados_anteriores: {
          nome: userData.nome,
          email: userData.email,
          ativo: userData.ativo,
          acesso_area_cliente: userData.acesso_area_cliente,
          acesso_area_admin: userData.acesso_area_admin,
          cargo: userData.cargo,
          filas: userData.filas,
          tags: userData.tags
        },
        dados_novos: {
          ativo: false,
          acesso_area_cliente: false,
          acesso_area_admin: false,
          cargo: null,
          filas: [],
          tags: []
        }
      });
    },
    onSuccess: () => {
      notify.success('Sucesso', 'Usuário desativado com sucesso');
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao desativar usuário');
    }
  });

  // Mutation para resetar senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string): Promise<void> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Erro ao enviar email de reset:', error);
        throw new Error('Erro ao enviar email de redefinição de senha');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'resetar_senha',
        dados_novos: { email }
      });
    },
    onSuccess: (_, email) => {
      notify.success('Sucesso', `Email de redefinição de senha enviado para ${email}`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao enviar email');
    }
  });

  // Mutation para reenviar email de verificação
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string): Promise<void> => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Erro ao reenviar email de verificação:', error);
        // Tratar erro de rate limit
        if (error.status === 429 || error.message?.includes('security purposes')) {
          const match = error.message?.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          throw new Error(`Aguarde ${seconds} segundos antes de tentar novamente. Limite de segurança atingido.`);
        }
        throw new Error(error.message || 'Erro ao reenviar email de verificação');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'reenviar_verificacao',
        dados_novos: { email }
      });
    },
    onSuccess: (_, email) => {
      notify.success('Sucesso', `Email de verificação reenviado para ${email}`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao reenviar email');
    }
  });

  // Mutation para alternar acesso
  const toggleAccessMutation = useMutation({
    mutationFn: async ({ id, accessType, value }: { id: number; accessType: 'cliente' | 'admin'; value: boolean }): Promise<Usuario> => {
      const updateData = accessType === 'cliente' 
        ? { acesso_area_cliente: value, ativo: value } 
        : { acesso_area_admin: value };

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          ...updateData,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar acesso:', error);
        throw new Error('Erro ao alterar acesso do usuário');
      }

      // Log da atividade
      await logUsuario({
        tipo_de_acao: 'alterar_acesso',
        usuario_afetado_id: id.toString(),
        dados_novos: {
          tipo_acesso: accessType,
          novo_valor: value
        }
      });

      return data;
    },
    onSuccess: (data) => {
      notify.success('Sucesso', `Acesso do usuário "${data.nome}" atualizado`);
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao alterar acesso');
    }
  });

  // Funções de filtro
  const filterUsers = (filters: UnifiedUserFilters) => {
    return users.filter(user => {
      // Filtro de nível hierárquico: usuário só pode ver usuários com cargo de nível igual ou inferior ao seu
      // Comparar pelo level do cargo, não pelo nivel_hierarquico do usuário
      const userCargoLevel = user.cargo_info?.level || 1;
      if (userCargoLevel > currentUserLevel) {
        return false;
      }
      
      // Filtro de busca
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          user.nome.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.telefone && user.telefone.toLowerCase().includes(searchLower)) ||
          (user.cnpjcpf && (
            Array.isArray(user.cnpjcpf) 
              ? user.cnpjcpf.some(doc => doc.includes(searchLower.replace(/\D/g, '')))
              : typeof user.cnpjcpf === 'object' && 'cnpjcpf' in user.cnpjcpf
                ? (user.cnpjcpf as { cnpjcpf: string[] }).cnpjcpf.some(doc => doc.includes(searchLower.replace(/\D/g, '')))
                : false
          )) ||
          (user.cargo_info?.nome && user.cargo_info.nome.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Filtro de tipo
      if (filters.typeFilter !== 'all') {
        if (filters.typeFilter === 'cliente' && user.acesso_area_cliente !== true) return false;
        if (filters.typeFilter === 'admin' && user.acesso_area_admin !== true) return false;
      }

      // Filtro de status
      if (filters.statusFilter !== 'all') {
        if (filters.statusFilter === 'ativo' && user.ativo !== true) return false;
        if (filters.statusFilter === 'inativo' && user.ativo !== false) return false;
      }

      // Filtro por cargo
      if (filters.cargoFilter) {
        if (user.cargo !== filters.cargoFilter) return false;
      }

      // Filtro por email verificado
      if (filters.emailVerifiedFilter && filters.emailVerifiedFilter !== 'all') {
        if (filters.emailVerifiedFilter === 'verified' && user.email_verified !== true) return false;
        if (filters.emailVerifiedFilter === 'pending' && user.email_verified !== false) return false;
      }

      // Filtro por data de criação (de)
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const userDate = user.data_criacao ? new Date(user.data_criacao) : null;
        if (!userDate || userDate < fromDate) return false;
      }

      // Filtro por data de criação (até)
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Incluir o dia inteiro
        const userDate = user.data_criacao ? new Date(user.data_criacao) : null;
        if (!userDate || userDate > toDate) return false;
      }

      return true;
    });
  };

  // Estatísticas - filtrar por nível hierárquico para que a contagem corresponda aos usuários visíveis
  const getUserStats = () => {
    // Filtrar usuários visíveis baseado no nível do cargo
    const visibleUsers = users.filter(user => {
      const userCargoLevel = user.cargo_info?.level || 1;
      return userCargoLevel <= currentUserLevel;
    });
    
    const total = visibleUsers.length;
    const clientes = visibleUsers.filter(u => u.acesso_area_cliente === true).length;
    const admins = visibleUsers.filter(u => u.acesso_area_admin === true).length;
    const ativos = visibleUsers.filter(u => u.ativo === true).length;

    return {
      total,
      clientes,
      admins,
      ativos
    };
  };

  // Função helper para obter usuário por ID
  const getUserById = (id: number) => {
    return users.find(user => user.id === id);
  };

  // Função para ordenar usuários
  const sortUsers = (
    usersToSort: UsuarioComCargo[], 
    field: SortField, 
    order: SortOrder
  ): UsuarioComCargo[] => {
    return [...usersToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'nome':
          aValue = a.nome?.toLowerCase() || '';
          bValue = b.nome?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'cargo':
          aValue = a.cargo_info?.nome?.toLowerCase() || '';
          bValue = b.cargo_info?.nome?.toLowerCase() || '';
          break;
        case 'data_criacao':
          aValue = new Date(a.data_criacao || 0).getTime();
          bValue = new Date(b.data_criacao || 0).getTime();
          break;
        case 'data_ultima_atividade':
          aValue = new Date(a.data_ultima_atividade || 0).getTime();
          bValue = new Date(b.data_ultima_atividade || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para paginar usuários
  const paginateUsers = (
    usersToPaginate: UsuarioComCargo[],
    options: PaginationOptions
  ): UsuarioComCargo[] => {
    const startIndex = (options.page - 1) * options.pageSize;
    const endIndex = startIndex + options.pageSize;
    return usersToPaginate.slice(startIndex, endIndex);
  };

  const error = queryError ? 'Erro ao carregar usuários' : null;

  return {
    users,
    cargos,
    isLoading,
    error,
    refetch,
    getUserStats,
    getUserById,
    filterUsers,
    sortUsers,
    paginateUsers,
    createUser: createUserMutation.mutateAsync,
    updateUser: (id: number, updates: UpdateUsuarioData) => 
      updateUserMutation.mutateAsync({ id, updates }),
    deleteUser: deleteUserMutation.mutateAsync,
    toggleAccess: (id: number, accessType: 'cliente' | 'admin', value: boolean) =>
      toggleAccessMutation.mutateAsync({ id, accessType, value }),
    resetPassword: resetPasswordMutation.mutateAsync,
    resendVerificationEmail: resendVerificationMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isTogglingAccess: toggleAccessMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isResendingVerification: resendVerificationMutation.isPending
  };
};
