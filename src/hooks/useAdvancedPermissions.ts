import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';

export const useAdvancedPermissions = (cargoId?: number) => {
  const queryClient = useQueryClient();
  const { notify } = useCustomNotifications();

  // Realtime subscription para mudanças na tabela cargos (apenas se habilitado)
  useEffect(() => {
    if (!REALTIME_ENABLED) return;

    const channel = supabase
      .channel('cargos-permissions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cargos' },
        () => {
          console.log('🔄 Cargo atualizado, invalidando cache de permissões');
          // Invalidar todas as queries de permissões
          queryClient.invalidateQueries({ queryKey: ['cargo-permissions'] });
          databasePermissionsService.invalidateCache();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Query para buscar permissões de um cargo específico
  const {
    data: cargoPermissions,
    isLoading: isQueryLoading,
    isFetching,
    error: cargoPermissionsError
  } = useQuery({
    queryKey: ['cargo-permissions', cargoId],
    queryFn: () => databasePermissionsService.getCargoPermissions(cargoId!),
    enabled: !!cargoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // Manter em cache por 30 minutos
  });

  // CORREÇÃO: Considerar loading quando cargoId existe mas dados ainda não carregaram
  // Isso evita redirecionamento indevido durante refresh da página
  const isLoadingCargoPermissions = !!cargoId && (isQueryLoading || (isFetching && !cargoPermissions));

  // Mutation para atualizar permissões de um cargo
  const updateCargoPermissionsMutation = useMutation({
    mutationFn: async ({ cargoId, permissionIds }: { cargoId: number; permissionIds: string[] }) => {
      return databasePermissionsService.updateCargoPermissions(cargoId, permissionIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargo-permissions', variables.cargoId] });
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      databasePermissionsService.invalidateCache(); // Invalidar cache das permissões
      notify.success('Sucesso', 'Permissões atualizadas com sucesso');
    },
    onError: (error: any) => {
      notify.error('Erro', error.message || 'Falha ao atualizar permissões');
    }
  });

  // Funções de verificação de permissões
  const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
    return databasePermissionsService.hasPermission(userPermissions, requiredPermission);
  };

  const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return databasePermissionsService.hasAnyPermission(userPermissions, requiredPermissions);
  };

  const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return databasePermissionsService.hasAllPermissions(userPermissions, requiredPermissions);
  };

  const isCriticalPermission = async (permissionId: string): Promise<boolean> => {
    return databasePermissionsService.isCriticalPermission(permissionId);
  };

  // Obter grupos de permissões
  const getPermissionGroups = async () => {
    return databasePermissionsService.getPermissionGroups();
  };

  return {
    // Dados
    cargoPermissions: cargoPermissions ?? [],
    isLoadingCargoPermissions,
    cargoPermissionsError,
    
    // Mutations
    updateCargoPermissions: updateCargoPermissionsMutation.mutateAsync,
    isUpdatingPermissions: updateCargoPermissionsMutation.isPending,
    
    // Funções de verificação
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isCriticalPermission,
    getPermissionGroups,
    
    // Refresh
    refetchCargoPermissions: () => queryClient.invalidateQueries({ queryKey: ['cargo-permissions', cargoId] })
  };
};