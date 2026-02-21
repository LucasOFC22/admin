import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { n8nUsersService, N8nUserProfile, CreateUserData } from '@/services/n8n/usersService';
import { UserFilters, UserStats } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

export const useUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para buscar usuários - OTIMIZADO: sem polling agressivo
  const {
    data: users = [],
    isLoading: loading,
    error: queryError,
    refetch: originalRefetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<N8nUserProfile[]> => {
      const fetchedUsers = await n8nUsersService.getUsers();
      return Array.isArray(fetchedUsers) ? fetchedUsers : [];
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Atualiza ao focar a janela
    refetchInterval: false, // REMOVIDO: polling contínuo
    refetchIntervalInBackground: false,
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData): Promise<N8nUserProfile> => {
      return await n8nUsersService.createUser(userData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Sucesso',
        description: `Usuário "${data.name}" criado com sucesso!`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao criar usuário';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<N8nUserProfile> }): Promise<N8nUserProfile> => {
      return await n8nUsersService.updateUser(id, userData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Sucesso',
        description: `Usuário "${data.name}" atualizado com sucesso!`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao atualizar usuário';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await n8nUsersService.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao excluir usuário';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // REMOVIDO: useEffect com setInterval duplicado

  const filterUsers = (filters: UserFilters): N8nUserProfile[] => {
    if (!Array.isArray(users)) {
      console.warn('Users is not an array:', users);
      return [];
    }
    
    return users.filter(user => {
      const matchesSearch = !filters.searchTerm || 
        user.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        user.empresa?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'active' && user.ativo) ||
        (filters.statusFilter === 'inactive' && !user.ativo);
      
      const matchesCargo = filters.cargoFilter === 'all' || user.tipo === filters.cargoFilter;
      
      return matchesSearch && matchesStatus && matchesCargo;
    });
  };

  const getUserStats = (): UserStats => {
    if (!Array.isArray(users)) {
      return { total: 0, active: 0, inactive: 0, uniqueCargos: 0 };
    }
    
    const active = users.filter(u => u.ativo).length;
    const inactive = users.filter(u => !u.ativo).length;
    const uniqueCargos = [...new Set(users.map(u => u.tipo).filter(Boolean))].length;

    return {
      total: users.length,
      active,
      inactive,
      uniqueCargos,
    };
  };

  const error = queryError ? 'Erro ao carregar usuários' : null;

  const refetch = () => {
    originalRefetch();
  };

  return {
    users,
    loading,
    error,
    createUser: createUserMutation.mutateAsync,
    updateUser: (id: string, userData: Partial<N8nUserProfile>) => 
      updateUserMutation.mutateAsync({ id, userData }),
    deleteUser: deleteUserMutation.mutateAsync,
    filterUsers,
    getUserStats,
    refetch,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending
  };
};
