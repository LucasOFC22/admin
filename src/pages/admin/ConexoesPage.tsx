import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import ConnectionList from '@/components/admin/conexoes/ConnectionList';
import CreateConnectionDialog from '@/components/admin/conexoes/CreateConnectionDialog';
import { conexoesService } from '@/services/conexoesService';
import { useRealtimeConexoes } from '@/hooks/useRealtimeConexoes';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

interface Conexao {
  id: string;
  nome: string;
  canal: 'whatsapp' | 'facebook' | 'instagram';
  status: string;
  updated_at: string;
  is_default: boolean;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_webhook_url?: string;
  telefone?: string;
}

const ConexoesPage = () => {
  const { logActivity } = useActivityLogger();
  const { hasPermission } = usePermissionGuard();
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const canCreate = hasPermission('admin.conexoes.criar');
  const canEdit = hasPermission('admin.conexoes.editar');
  const canDelete = hasPermission('admin.conexoes.excluir');

  const loadData = async () => {
    setLoading(true);
    try {
      const conexoesData = await conexoesService.fetchAllConnections();
      setConexoes(conexoesData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    logActivity({
      acao: 'pagina_visualizada',
      modulo: 'conexoes',
      detalhes: { pagina: 'conexoes' }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime updates para conexões
  useRealtimeConexoes((updatedConexao) => {
    setConexoes((prev) =>
      prev.map((c) =>
        c.id === updatedConexao.id
          ? { ...c, ...updatedConexao }
          : c
      )
    );

    toast({
      title: 'Conexão atualizada',
      description: `${updatedConexao.nome}: ${updatedConexao.status}`,
    });
  });

  const getTotalStats = () => {
    const connected = conexoes.filter(c => c.status === 'CONNECTED').length;
    const disconnected = conexoes.filter(c => c.status !== 'CONNECTED').length;
    const total = conexoes.length;
    return { connected, disconnected, total };
  };

  const stats = getTotalStats();

  return (
    <PermissionGuard 
      permissions="admin.whatsapp.conexoes.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
          title="Conexões WhatsApp"
          subtitle="Gerencie suas conexões com a API oficial do WhatsApp Business"
          icon={Network}
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Conexões" }
          ]}
          actions={
            <div className="flex gap-2">
              {conexoes.length === 0 && canCreate && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Conexão
                </Button>
              )}
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          }
        />
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Total de Conexões</div>
                    <div className="text-3xl font-bold text-primary mt-1">{stats.total}</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Conectadas</div>
                    <div className="text-3xl font-bold text-green-600 mt-1">{stats.connected}</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Desconectadas</div>
                    <div className="text-3xl font-bold text-red-600 mt-1">{stats.disconnected}</div>
                  </div>
                </div>

                {/* Aviso de limite */}
                {conexoes.length >= 1 && (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-600 dark:text-amber-400">
                      Limite atingido: apenas 1 conexão permitida por conta. Para criar uma nova, exclua a conexão existente.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Connections List */}
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Carregando conexões...
                  </div>
                ) : (
                  <ConnectionList 
                    conexoes={conexoes} 
                    onRefresh={loadData}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                )}
              </div>
              </motion.div>
            </ScrollArea>
          </div>
        </div>

      <CreateConnectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadData}
      />
    </PermissionGuard>
  );
};

export default ConexoesPage;
