import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { permissionSyncService } from '@/services/permissionSyncService';

interface PermissionSystemContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  syncStats: any;
  forceSync: () => Promise<void>;
}

const PermissionSystemContext = createContext<PermissionSystemContextType | undefined>(undefined);

interface PermissionSystemProviderProps {
  children: ReactNode;
}

/**
 * Provider que inicializa o sistema de permissões automaticamente
 * Deve ser usado no nível mais alto da aplicação
 */
export const PermissionSystemProvider: React.FC<PermissionSystemProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<any>(null);

  const initializeSystem = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await databasePermissionsService.initialize();

      const stats = await databasePermissionsService.getSystemStats();
      setSyncStats(stats);

      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao inicializar sistema de permissões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const forceSync = async () => {
    try {
      setIsLoading(true);
      
      await permissionSyncService.forcSync();
      await databasePermissionsService.refreshPermissions();
      
      const stats = await databasePermissionsService.getSystemStats();
      setSyncStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização';
      setError(errorMessage);
      console.error('❌ Erro na sincronização forçada:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeSystem();
  }, []);

  const contextValue: PermissionSystemContextType = {
    isInitialized,
    isLoading,
    error,
    syncStats,
    forceSync
  };

  return (
    <PermissionSystemContext.Provider value={contextValue}>
      {children}
    </PermissionSystemContext.Provider>
  );
};

/**
 * Hook para acessar o contexto do sistema de permissões
 */
export const usePermissionSystem = (): PermissionSystemContextType => {
  const context = useContext(PermissionSystemContext);
  if (context === undefined) {
    throw new Error('usePermissionSystem must be used within a PermissionSystemProvider');
  }
  return context;
};

/**
 * Componente de debug para mostrar informações do sistema de permissões
 */
export const PermissionSystemDebug: React.FC = () => {
  const { isInitialized, isLoading, error, syncStats, forceSync } = usePermissionSystem();

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm">
        <h3 className="text-sm font-semibold mb-2">Sistema de Permissões</h3>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isInitialized ? 'text-green-600' : 'text-red-600'}>
              {isInitialized ? '✅ Ativo' : '❌ Inativo'}
            </span>
          </div>
          
          {isLoading && (
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className="text-blue-600">🔄 Carregando...</span>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 text-xs mt-1">
              Erro: {error}
            </div>
          )}
          
          {syncStats && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between">
                <span>Registry:</span>
                <span>{syncStats.permissions.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Banco:</span>
                <span>{syncStats.sync?.database.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Sync:</span>
                <span className={syncStats.sync?.synchronized ? 'text-green-600' : 'text-yellow-600'}>
                  {syncStats.sync?.synchronized ? '✅' : '⚠️'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={forceSync}
          disabled={isLoading}
          className="mt-2 w-full text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Sincronizando...' : 'Forçar Sync'}
        </button>
      </div>
    );
  }

  return null;
};