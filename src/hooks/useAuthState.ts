import { useState, useEffect, useRef } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const useAuthState = () => {
  const auth = useUnifiedAuth();
  
  // Iniciar com o estado real do contexto
  const [localLoading, setLocalLoading] = useState(() => {
    return !auth.authInitialized;
  });
  
  const initialLoadRef = useRef(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Atualizar loading local quando auth inicializar
    if (auth.authInitialized && initialLoadRef.current) {
      initialLoadRef.current = false;
      setLocalLoading(false);
    }
  }, [auth.authInitialized]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const waitForAuth = async (timeout = 2000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (auth.authInitialized && !auth.loading) {
        resolve(auth.isAuthenticated);
        return;
      }

      const startTime = Date.now();
      const checkAuth = () => {
        if (!mountedRef.current) {
          resolve(false);
          return;
        }

        if (auth.authInitialized && !auth.loading) {
          resolve(auth.isAuthenticated);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(auth.isAuthenticated);
          return;
        }

        setTimeout(checkAuth, 50);
      };

      checkAuth();
    });
  };

  const isLoading = !auth.authInitialized || (localLoading && auth.loading);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    hasAdminAccess: auth.hasAdminAccess,
    hasClientAccess: auth.hasClientAccess,
    hasDriverAccess: auth.hasDriverAccess,
    userEmail: auth.userEmail,
    userType: auth.userType,
    loading: isLoading,
    logout: auth.logout,
    forceSyncAuth: auth.forceSyncAuth,
    refreshAuth: auth.refreshAuth,
    waitForAuth
  };
};
