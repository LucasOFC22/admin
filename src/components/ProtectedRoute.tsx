import React, { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CrossDomainRedirect } from '@/lib/auth/cookieAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import OptimizedAuthSpinner from '@/components/auth/OptimizedAuthSpinner';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { useAuthState } from '@/hooks/useAuthState';

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredAccess?: 'admin' | 'client';
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredAccess, requiredPermission }: ProtectedRouteProps) => {
  const { user, isAuthenticated, hasAdminAccess, loading: authLoading } = useAuthState();
  const { canAccess, isLoadingCargoPermissions } = usePermissionGuard();
  const location = useLocation();

  // Loading unificado: auth + permissões = um único spinner
  const needsPermissionCheck = isAuthenticated && user && (requiredPermission || requiredAccess === 'admin');
  const isStillLoading = authLoading || (needsPermissionCheck && isLoadingCargoPermissions);

  if (isStillLoading) {
    return <OptimizedAuthSpinner />;
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    if (!CrossDomainRedirect.isDev()) {
      CrossDomainRedirect.redirectToAuth();
      return <OptimizedAuthSpinner />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground mb-6">
            Você precisa estar autenticado para acessar esta área.
          </p>
          <p className="text-sm text-muted-foreground">
            Em produção, você seria redirecionado para{' '}
            <a 
              href={CrossDomainRedirect.getAuthUrl()} 
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              auth.fptranscargas.com.br
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Verificar acesso admin
  if (requiredAccess === 'admin' && !hasAdminAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  // Verificar permissões específicas
  if (requiredPermission && !canAccess(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  // Verificar permissões de tab para rotas admin
  if (requiredAccess === 'admin') {
    const tabPermissionMapping = databasePermissionsService.getSidebarTabPermissionMapping();
    const pathParts = location.pathname.split('/').filter(Boolean);
    const tab = pathParts[0] || 'dashboard';
    const tabPermission = tabPermissionMapping[tab];
    
    if (tabPermission && !canAccess(tabPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
