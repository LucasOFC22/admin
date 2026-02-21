import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw, Loader2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';

const API_URL = 'https://api.fptranscargas.com.br/cotacao';

export const ColetasSection = () => {
  const { user } = useAuthState();
  const { canAccess } = usePermissionGuard();
  const { logActivity } = useClientActivityLogger();
  const [coletas, setColetas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cnpjcpf, setCnpjcpf] = useState<string>('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'coletado' | 'em_transito'>('todos');

  // Buscar CNPJ/CPF do cliente logado
  useEffect(() => {
    const fetchUserCnpj = async () => {
      if (!user?.email) return;

      try {
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('usuarios')
          .select('cnpjcpf')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Erro ao buscar CNPJ/CPF:', error);
          return;
        }

        if (data?.cnpjcpf) {
          setCnpjcpf(data.cnpjcpf);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
      }
    };

    fetchUserCnpj();
  }, [user]);

  // Buscar coletas do cliente
  const fetchColetas = async () => {
    if (!cnpjcpf) {
      toast.error('CNPJ/CPF do cliente não encontrado');
      await logActivity({
        acao: 'cliente_coletas_buscar',
        modulo: 'cliente-coletas',
        detalhes: { erro: 'CNPJ/CPF não encontrado' }
      });
      return;
    }

    setIsLoading(true);
    await logActivity({
      acao: 'cliente_coletas_buscar',
      modulo: 'cliente-coletas',
      detalhes: { cnpjcpf, statusFilter }
    });
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'coleta',
          acao: 'buscar-coleta-cliente',
          cnpjcpf: cnpjcpf,
        }),
      });

      if (!response.ok) {
        console.error('Erro ao buscar coletas:', response.statusText);
        toast.error('Erro ao buscar coletas');
        setColetas([]);
        return;
      }

      const data = await response.json();
      
      const isEmptyObject = (obj: any) => 
        obj && typeof obj === 'object' && Object.keys(obj).length === 0;
      
      let rawData: any[] = [];
      if (Array.isArray(data?.data)) {
        rawData = data.data;
      } else if (Array.isArray(data)) {
        rawData = data;
      }
      
      const coletasData = rawData
        .map((item: any) => item.json || item)
        .filter((item: any) => !isEmptyObject(item));
      
      setColetas(coletasData);
      toast.success(`${coletasData.length} coletas encontradas`);
      await logActivity({
        acao: 'cliente_coletas_visualizar',
        modulo: 'cliente-coletas',
        detalhes: { total_coletas: coletasData.length, statusFilter }
      });
    } catch (error) {
      console.error('Erro ao buscar coletas:', error);
      toast.error('Erro ao buscar coletas');
      setColetas([]);
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  // Buscar coletas automaticamente quando o CNPJ estiver disponível
  useEffect(() => {
    if (cnpjcpf) {
      fetchColetas();
    }
  }, [cnpjcpf]);

  // Loading de tela cheia durante carregamento inicial
  if (initialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <p className="text-lg font-semibold mb-1">Carregando suas coletas</p>
            <p className="text-muted-foreground text-sm">Aguarde enquanto buscamos seus dados...</p>
          </div>
        </div>
      </div>
    );
  }

  // Determinar status da coleta
  const getColetaStatus = (coleta: any) => {
    if (coleta.status) return coleta.status;
    return 'pendente';
  };

  // Filtrar coletas por status
  const filteredColetas = coletas.filter((coleta) => {
    if (statusFilter === 'todos') return true;
    return getColetaStatus(coleta) === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      coletado: { label: 'Coletado', className: 'bg-green-100 text-green-800' },
      em_transito: { label: 'Em Trânsito', className: 'bg-blue-100 text-blue-800' },
    };
    return statusConfig[status] || statusConfig.pendente;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Suas Coletas
              </CardTitle>
              <CardDescription className="mt-1">
                Acompanhe o status de todas as suas coletas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v as any);
                logActivity({
                  acao: 'cliente_coletas_filtrar',
                  modulo: 'cliente-coletas',
                  detalhes: { filtro: v }
                });
              }}>
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="pendente">Pendente</TabsTrigger>
                  <TabsTrigger value="coletado">Coletado</TabsTrigger>
                  <TabsTrigger value="em_transito">Em Trânsito</TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={viewMode} onValueChange={(v) => {
                setViewMode(v as 'card' | 'table');
                logActivity({
                  acao: 'cliente_coletas_mudar_visualizacao',
                  modulo: 'cliente-coletas',
                  detalhes: { modo: v }
                });
              }}>
                <TabsList>
                  <TabsTrigger value="card" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <TableIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Tabela</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                onClick={async () => {
                  await logActivity({
                    acao: 'cliente_coletas_refresh',
                    modulo: 'cliente-coletas',
                    detalhes: { manual: true }
                  });
                  fetchColetas();
                }} 
                variant="outline" 
                size="sm"
                disabled={isLoading || !cnpjcpf}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando coletas...</p>
            </div>
          ) : coletas.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma coleta encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não possui coletas registradas
              </p>
            </div>
          ) : filteredColetas.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma coleta encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Nenhuma coleta corresponde aos filtros selecionados
              </p>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredColetas.map((coleta, index) => {
                const status = getColetaStatus(coleta);
                const badge = getStatusBadge(status);
                return (
                  <Card key={coleta.id || index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">#{coleta.numero || coleta.id || index + 1}</p>
                          <p className="text-xs text-muted-foreground">{coleta.data || 'Data não informada'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Origem:</span> {coleta.origem || 'Não informado'}</p>
                        <p><span className="text-muted-foreground">Destino:</span> {coleta.destino || 'Não informado'}</p>
                        {coleta.volumes && (
                          <p><span className="text-muted-foreground">Volumes:</span> {coleta.volumes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Número</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Origem</th>
                    <th className="text-left p-3 font-medium">Destino</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColetas.map((coleta, index) => {
                    const status = getColetaStatus(coleta);
                    const badge = getStatusBadge(status);
                    return (
                      <tr key={coleta.id || index} className="border-b hover:bg-muted/50">
                        <td className="p-3">#{coleta.numero || coleta.id || index + 1}</td>
                        <td className="p-3">{coleta.data || '-'}</td>
                        <td className="p-3">{coleta.origem || '-'}</td>
                        <td className="p-3">{coleta.destino || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
