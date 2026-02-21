import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePermissionSystem } from './PermissionSystemProvider';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { PermissionGroup, Permission } from '@/types/permissions';
import { 
  Shield, 
  Users, 
  FileText, 
  MessageCircle, 
  BarChart3, 
  Square, 
  Layout,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const categoryIcons = {
  admin: Shield,
  users: Users,
  quotes: FileText,
  whatsapp: MessageCircle,
  reports: BarChart3,
  modals: Square,
  pages: Layout,
  critical: AlertTriangle
};

/**
 * Componente para gerenciar e visualizar o sistema de permissões
 */
const PermissionManager: React.FC = () => {
  const { isInitialized, isLoading, error, syncStats, forceSync } = usePermissionSystem();
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const loadPermissionGroups = async () => {
    try {
      setLoadingGroups(true);
      const groups = await databasePermissionsService.getPermissionGroups();
      setPermissionGroups(groups);
    } catch (err) {
      console.error('Erro ao carregar grupos de permissões:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      loadPermissionGroups();
    }
  }, [isInitialized]);

  const handleRefresh = async () => {
    await forceSync();
    await loadPermissionGroups();
  };

  if (!isInitialized && isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Inicializando sistema de permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>Erro no sistema de permissões: {error}</p>
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sistema de Permissões
              </CardTitle>
              <CardDescription>
                Gerenciamento automático de permissões do sistema
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={isLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <p className="text-2xl font-bold text-green-600">Ativo</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Permissões</span>
              </div>
              <p className="text-2xl font-bold">
                {syncStats?.permissions?.total || 0}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Críticas</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {syncStats?.permissions?.critical || 0}
              </p>
            </div>
          </div>
          
          {syncStats && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Sincronização com banco:</span>
                <Badge variant={syncStats.sync?.synchronized ? 'default' : 'secondary'}>
                  {syncStats.sync?.synchronized ? 'Sincronizado' : 'Pendente'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Permissões */}
      <Card>
        <CardHeader>
          <CardTitle>Permissões do Sistema</CardTitle>
          <CardDescription>
            Todas as permissões registradas automaticamente pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGroups ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando permissões...</span>
            </div>
          ) : (
            <Tabs defaultValue={permissionGroups[0]?.category} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                {permissionGroups.map((group) => {
                  const Icon = categoryIcons[group.category];
                  return (
                    <TabsTrigger key={group.category} value={group.category} className="flex items-center gap-1">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{group.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {permissionGroups.map((group) => (
                <TabsContent key={group.category} value={group.category}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {React.createElement(categoryIcons[group.category], { className: "h-5 w-5" })}
                      <h3 className="text-lg font-semibold">{group.label}</h3>
                      <Badge variant="outline">{group.permissions.length}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {group.permissions.map((permission) => (
                          <PermissionCard key={permission.id} permission={permission} />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface PermissionCardProps {
  permission: Permission;
}

const PermissionCard: React.FC<PermissionCardProps> = ({ permission }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{permission.name}</span>
            {permission.critical && (
              <Badge variant="destructive" className="text-xs">
                Crítica
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {permission.action}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{permission.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {permission.id}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Recurso: {permission.resource}</span>
            {permission.updated_at && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>Atualizado: {new Date(permission.updated_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PermissionManager;