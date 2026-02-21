import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CookieAuth, CrossDomainRedirect } from '@/lib/auth/cookieAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import OptimizedAuthSpinner from '@/components/auth/OptimizedAuthSpinner';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { supabaseAuthService, SupabaseUser } from '@/services/auth/supabaseAuthService';

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredAccess?: 'admin' | 'client';
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredAccess, requiredPermission }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { canAccess, isLoadingCargoPermissions } = usePermissionGuard();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Verificar cookie cross-domain
      const cookieData = CookieAuth.validateAuthCookie();
      
      if (!cookieData) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verificar se tem acesso admin no cookie
      if (requiredAccess === 'admin' && !cookieData.access_areas?.admin) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Buscar dados completos do usuário no banco
      const userData = await supabaseAuthService.getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [requiredAccess]);

  // Loading state
  if (loading) {
    return <OptimizedAuthSpinner message="Verificando autenticação..." />;
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    if (!CrossDomainRedirect.isDev()) {
      CrossDomainRedirect.redirectToAuth();
      return <OptimizedAuthSpinner message="Redirecionando para login..." />;
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
  if (requiredAccess === 'admin' && !user.hasAdminAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  // Verificar permissões específicas
  if (requiredPermission) {
    if (isLoadingCargoPermissions) {
      return <OptimizedAuthSpinner message="Verificando permissões..." />;
    }
    if (!canAccess(requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  // Verificar permissões de tab para rotas admin
  if (requiredAccess === 'admin') {
    if (isLoadingCargoPermissions) {
      return <OptimizedAuthSpinner message="Verificando permissões..." />;
    }
    
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
