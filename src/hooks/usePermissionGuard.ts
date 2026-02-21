import { useAuthState } from '@/hooks/useAuthState';
import { useAdvancedPermissions } from '@/hooks/useAdvancedPermissions';
import { databasePermissionsService } from '@/services/databasePermissionsService';

export const usePermissionGuard = () => {
  const { user } = useAuthState();
  const userCargoId = user?.cargo ? Number(user.cargo) : undefined;
  
  const { 
    cargoPermissions, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    isLoadingCargoPermissions 
  } = useAdvancedPermissions(userCargoId);

  const canAccess = (permissions: string | string[], requireAll: boolean = false): boolean => {
    if (isLoadingCargoPermissions || !cargoPermissions) {
      return false;
    }

    if (!permissions) {
      return true;
    }

    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
    
    if (requireAll) {
      return hasAllPermissions(cargoPermissions, permissionsArray);
    } else {
      return hasAnyPermission(cargoPermissions, permissionsArray);
    }
  };

  const canView = (permission: string): boolean => {
    return canAccess(permission);
  };

  const canCreate = (resource: string): boolean => {
    return canAccess(`${resource}.create`);
  };

  const canEdit = (resource: string): boolean => {
    return canAccess(`${resource}.edit`);
  };

  const canDelete = (resource: string): boolean => {
    return canAccess(`${resource}.delete`);
  };

  const canApprove = (resource: string): boolean => {
    return canAccess(`${resource}.approve`);
  };

  const canOpenModal = (modalType: string): boolean => {
    return canAccess(`modals.${modalType}`);
  };

  const canAccessPage = (page: string): boolean => {
    const permissionMapping = databasePermissionsService.getSidebarTabPermissionMapping();
    const requiredPermission = permissionMapping[page];
    if (!requiredPermission) return true; // Se não há permissão mapeada, permitir acesso
    return canAccess(requiredPermission);
  };

  return {
    // Dados de permissões
    cargoPermissions,
    isLoadingCargoPermissions,
    
    // Funções de verificação genéricas
    canAccess,
    hasPermission: (permission: string) => hasPermission(cargoPermissions, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(cargoPermissions, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(cargoPermissions, permissions),
    
    // Funções de verificação específicas
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canOpenModal,
    canAccessPage,
    
    // Verificações por módulo
    admin: {
      canView: () => canView('admin.view'),
      canEditConfig: () => canAccess('admin.config'),
      canManageCargos: () => canAccess(['cargos.create', 'cargos.edit', 'cargos.delete'], false)
    },
    
    users: {
      canView: () => canView('users.view'),
      canCreate: () => canCreate('users'),
      canEdit: () => canEdit('users'),
      canDelete: () => canDelete('users')
    },
    
    quotes: {
      canView: () => canView('quotes.view'),
      canCreate: () => canCreate('quotes'),
      canEdit: () => canEdit('quotes'),
      canDelete: () => canDelete('quotes'),
      canApprove: () => canApprove('quotes')
    },
    
    whatsapp: {
      canView: () => canView('whatsapp.view'),
      canSendMessages: () => canAccess('whatsapp.create'),
      canManageChats: () => canEdit('whatsapp')
    },
    
    reports: {
      canView: () => canView('reports.view'),
      canExport: () => canAccess('reports.export')
    },
    
    modals: {
      canOpenCreate: () => canOpenModal('create'),
      canOpenEdit: () => canOpenModal('edit'),
      canOpenDelete: () => canOpenModal('delete')
    }
  };
};