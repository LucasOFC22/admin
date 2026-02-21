
// Legacy AuthContext - kept for compatibility
// All auth functionality has been moved to UnifiedAuthContext

import React, { createContext, useContext } from 'react';
import { useUnifiedAuth, UnifiedAuthContextType } from './UnifiedAuthContext';

// Re-export UnifiedAuth as legacy AuthContext for compatibility
export const AuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const useAuth = () => {
  return useUnifiedAuth();
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useUnifiedAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
