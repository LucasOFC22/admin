import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { CookieAuth, CrossDomainRedirect } from '@/lib/auth/cookieAuth';
import { supabaseAuthService, SupabaseUser } from '@/services/auth/supabaseAuthService';
import { tokenRefreshService } from '@/services/auth/tokenRefreshService';
import { sessionRecoveryService } from '@/services/auth/sessionRecoveryService';
import { logService } from '@/services/logger/logService';
import { databasePermissionsService } from '@/services/databasePermissionsService';

export interface UnifiedAuthContextType {
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
  hasClientAccess: boolean;
  hasDriverAccess: boolean;
  userEmail: string | undefined;
  userType: 'admin' | 'cliente' | undefined;
  loading: boolean;
  authInitialized: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  user: SupabaseUser | null;
  forceSyncAuth: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    // Fallback seguro caso o hook seja chamado antes do provider estar montado
    return {
      isAuthenticated: false,
      hasAdminAccess: false,
      hasClientAccess: false,
      hasDriverAccess: false,
      userEmail: undefined,
      userType: undefined,
      loading: true,
      authInitialized: false,
      logout: async () => {},
      signOut: async () => {},
      user: null,
      forceSyncAuth: async () => {},
      refreshAuth: async () => false
    };
  }
  return context;
};

interface UnifiedAuthProviderProps {
  children: React.ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  const initAuth = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      // Verificar cookie cross-domain
      const cookieData = CookieAuth.validateAuthCookie();

      if (!cookieData) {
        if (mountedRef.current) {
          setUser(null);
        }
        return null;
      }

      // Usar cadeia de recuperação para garantir sessão Supabase válida
      const recovery = await sessionRecoveryService.ensureValidSupabaseSession();
      if (!recovery.success) {
        console.warn('[UnifiedAuthContext] Cadeia de recuperação falhou - sessão irrecuperável');
        CookieAuth.clearAuthCookie();
        if (mountedRef.current) {
          setUser(null);
        }
        if (!CrossDomainRedirect.isDev()) {
          CrossDomainRedirect.redirectToAuth();
        }
        return null;
      }
      console.log('[UnifiedAuthContext] Sessão recuperada via:', recovery.method);

      // Buscar dados do usuário no banco
      const currentUser = await supabaseAuthService.getCurrentUser();
      
      if (mountedRef.current) {
        setUser(currentUser);
        
        // Renovar cookie se válido
        if (currentUser) {
          CookieAuth.refreshAuthCookie();
        }
        
        // Pre-fetch permissões do cargo em background
        if (currentUser && currentUser.cargo) {
          const cargoId = Number(currentUser.cargo);
          if (cargoId && !isNaN(cargoId)) {
            databasePermissionsService.getCargoPermissions(cargoId).catch(() => {
              // Silencioso - será carregado novamente pelo hook se falhar
            });
          }
        }
      }
      
      return currentUser;
    } catch (error) {
      console.error('[UnifiedAuthContext] Error initializing auth:', error);
      if (mountedRef.current) {
        setUser(null);
      }
      
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setAuthInitialized(true);
      }
      initializingRef.current = false;
    }
  }, []);

  const forceSyncAuth = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    supabaseAuthService.clearCache();
    setLoading(true);
    await initAuth();
  }, [initAuth]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      supabaseAuthService.clearCache();
      const currentUser = await supabaseAuthService.getCurrentUser();
      
      if (mountedRef.current) {
        setUser(currentUser);
        
        if (currentUser) {
          CookieAuth.refreshAuthCookie();
        }
      }
      
      return !!currentUser;
    } catch (error) {
      console.error('[UnifiedAuthContext] Error refreshing auth:', error);
      if (mountedRef.current) {
        setUser(null);
      }
      
      return false;
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Inicializar o serviço de refresh automático do token
    tokenRefreshService.initialize();

    // Listener para evento de sessão expirada (JWT expired - refresh falhou)
    const handleSessionExpired = () => {
      console.warn('[UnifiedAuthContext] Session expired event received - redirecionando para login');
      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
      }
      if (!CrossDomainRedirect.isDev()) {
        CrossDomainRedirect.redirectToAuth();
      }
    };

    // Listener para evento de token renovado com sucesso
    const handleTokenRefreshed = () => {
      console.log('[UnifiedAuthContext] Token refreshed - atualizando usuário...');
      if (mountedRef.current) {
        supabaseAuthService.clearCache();
        supabaseAuthService.getCurrentUser().then(currentUser => {
          if (mountedRef.current && currentUser) {
            setUser(currentUser);
          }
        });
      }
    };

    // Listener para visibilitychange - renovar token quando o usuário volta à aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log('[UnifiedAuthContext] Tab voltou a ficar visível - verificando token...');
        const session = CookieAuth.getSupabaseSession();
        if (session?.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const remaining = session.expires_at - now;
          
          if (remaining <= 0) {
            console.log('[UnifiedAuthContext] Token expirado durante background - refresh imediato');
            tokenRefreshService.refreshToken(true).then(success => {
              if (!success && mountedRef.current) {
                console.warn('[UnifiedAuthContext] Refresh pós-background falhou');
                handleSessionExpired();
              }
            });
          } else if (remaining < 120) {
            console.log('[UnifiedAuthContext] Token quase expirando - refresh proativo');
            tokenRefreshService.refreshToken();
          } else {
            tokenRefreshService.scheduleRefresh(remaining);
          }
        } else if (session?.access_token) {
          tokenRefreshService.scheduleRefresh();
        }
      }
    };

    // Listener para focus
    const handleFocus = () => {
      if (!mountedRef.current) return;
      const session = CookieAuth.getSupabaseSession();
      if (session?.expires_at) {
        const remaining = session.expires_at - Math.floor(Date.now() / 1000);
        if (remaining <= 0) {
          tokenRefreshService.refreshToken(true).then(success => {
            if (!success && mountedRef.current) {
              handleSessionExpired();
            }
          });
        }
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      mountedRef.current = false;
      tokenRefreshService.destroy();
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initAuth]);

  const logout = useCallback(async () => {
    try {
      if (user) {
        await logService.logAutenticacao({
          usuario_id: user.id,
          tipo_de_acao: 'logout',
          sucesso: true,
          detalhes: {
            email: user.email,
            origem: 'UnifiedAuthContext'
          }
        });
      }

      // Parar refresh automático e fazer logout completo
      tokenRefreshService.destroy();
      await supabaseAuthService.logout();
      
      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
      }

      if (!CrossDomainRedirect.isDev()) {
        CrossDomainRedirect.redirectToAuth();
      }
    } catch (error) {
      console.error('[UnifiedAuthContext] Error during logout:', error);
      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
      }
    }
  }, [user]);

  const signOut = useCallback(async () => {
    await logout();
  }, [logout]);

  // Derivar estado de autenticação do cookie e do usuário
  const isAuthenticated = CookieAuth.hasValidAuthCookie() && !!user;
  const accessAreas = CookieAuth.getAccessAreas();

  const authState: UnifiedAuthContextType = {
    isAuthenticated,
    hasAdminAccess: user?.hasAdminAccess || accessAreas?.admin === true,
    hasClientAccess: user?.hasClientAccess || accessAreas?.cliente === true,
    hasDriverAccess: accessAreas?.motorista === true,
    userEmail: user?.email,
    userType: user?.tipo,
    loading,
    authInitialized,
    logout,
    signOut,
    user,
    forceSyncAuth,
    refreshAuth
  };

  return (
    <UnifiedAuthContext.Provider value={authState}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};
