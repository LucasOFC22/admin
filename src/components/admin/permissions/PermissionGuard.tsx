import React, { ReactNode } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { useAdvancedPermissions } from '@/hooks/useAdvancedPermissions';
import AccessDenied from '@/components/admin/AccessDenied';

interface PermissionGuardProps {
  permissions?: string | string[];
  requiredAll?: boolean; // true = precisa ter TODAS as permissões, false = precisa ter ALGUMA
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions = [],
  requiredAll = false,
  children,
  fallback,
  showMessage = true
}) => {
  const { user } = useAuthState();
  const userCargoId = user?.cargo ? Number(user.cargo) : undefined;
  
  const { 
    cargoPermissions, 
    hasAnyPermission, 
    hasAllPermissions,
    isLoadingCargoPermissions 
  } = useAdvancedPermissions(userCargoId);

  // Se ainda está carregando, mostra loading
  if (isLoadingCargoPermissions) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não há permissões para verificar, permite acesso
  if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
    return <>{children}</>;
  }

  // Converte string para array se necessário
  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  
  // Verifica se tem as permissões necessárias
  let hasRequiredPermissions = false;
  
  if (requiredAll) {
    hasRequiredPermissions = hasAllPermissions(cargoPermissions, permissionsArray);
  } else {
    hasRequiredPermissions = hasAnyPermission(cargoPermissions, permissionsArray);
  }

  // Se tem as permissões, renderiza o conteúdo
  if (hasRequiredPermissions) {
    return <>{children}</>;
  }

  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Se não deve mostrar mensagem, não renderiza nada
  if (!showMessage) {
    return null;
  }

  // Renderiza componente de acesso negado
  return (
    <AccessDenied 
      permissions={permissionsArray}
      showBackButton={true}
      showPermissions={true}
    />
  );
};

export default PermissionGuard;