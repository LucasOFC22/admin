import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';

// Singleton para evitar múltiplas subscriptions realtime
let realtimeRefCount = 0;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedQueryClient: ReturnType<typeof useQueryClient> | null = null;

export const useAdvancedPermissions = (cargoId?: number) => {
  const queryClient = useQueryClient();
  const { notify } = useCustomNotifications();
  const subscribedRef = useRef(false);

  // Realtime subscription singleton - apenas uma instância global
  useEffect(() => {
    if (!REALTIME_ENABLED) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    
    sharedQueryClient = queryClient;
    realtimeRefCount++;

    if (realtimeRefCount === 1 && !realtimeChannel) {
      realtimeChannel = supabase
        .channel('cargos-permissions-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cargos' },
          () => {
            if (sharedQueryClient) {
              sharedQueryClient.invalidateQueries({ queryKey: ['cargo-permissions'] });
              databasePermissionsService.invalidateCache();
            }
          }
        )
        .subscribe();
    }

    return () => {
      subscribedRef.current = false;
      realtimeRefCount--;
      if (realtimeRefCount <= 0 && realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        realtimeRefCount = 0;
        sharedQueryClient = null;
      }
    };
  }, [queryClient]);

  // Query para buscar permissões de um cargo específico
  const {
    data: cargoPermissions,
    isLoading: isQueryLoading,
    error: cargoPermissionsError
  } = useQuery({
    queryKey: ['cargo-permissions', cargoId],
    queryFn: () => databasePermissionsService.getCargoPermissions(cargoId!),
    enabled: !!cargoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const isLoadingCargoPermissions = !!cargoId && isQueryLoading;

  // Mutation para atualizar permissões de um cargo
  const updateCargoPermissionsMutation = useMutation({
    mutationFn: async ({ cargoId, permissionIds }: { cargoId: number; permissionIds: string[] }) => {
      return databasePermissionsService.updateCargoPermissions(cargoId, permissionIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargo-permissions', variables.cargoId] });
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      databasePermissionsService.invalidateCache();
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

  const getPermissionGroups = async () => {
    return databasePermissionsService.getPermissionGroups();
  };

  return {
    cargoPermissions: cargoPermissions ?? [],
    isLoadingCargoPermissions,
    cargoPermissionsError,
    
    updateCargoPermissions: updateCargoPermissionsMutation.mutateAsync,
    isUpdatingPermissions: updateCargoPermissionsMutation.isPending,
    
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isCriticalPermission,
    getPermissionGroups,
    
    refetchCargoPermissions: () => queryClient.invalidateQueries({ queryKey: ['cargo-permissions', cargoId] })
  };
};
