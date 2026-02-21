/**
 * Página de Logs de Cargos
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { LogCargo } from '@/types/allLogs';

import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { LogsFilters, LogsHeader } from '@/components/admin/logging';
import LogsPagination from '@/components/admin/logging/LogsPagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Eye, 
  ArrowRight, 
  Plus, 
  Pencil, 
  Trash2,
  Clock,
  Globe,
  Monitor,
  User,
  Building
} from 'lucide-react';

// Tipo estendido para logs com dados do usuário
interface LogCargoExtended extends LogCargo {
  usuario?: { nome: string; email: string } | null;
  cargo?: { nome: string } | null;
  departamento?: { nome: string } | null;
}

const LogsCargos = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    searchTerm: '',
    tipoAcao: ''
  });
  const [selectedLog, setSelectedLog] = useState<LogCargoExtended | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs-cargos', filters, currentPage, pageSize],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('logs_cargos')
        .select(`
          *,
          usuario:usuario_responsavel(nome, email),
          cargo:cargo_id(nome),
          departamento:departamento_id(nome)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.tipoAcao) {
        query = query.eq('tipo_de_acao', filters.tipoAcao);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as LogCargoExtended[], total: count || 0 };
    }
  });

  const logs = data?.logs || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const tiposAcao = [
    { value: 'criar', label: 'Criar' },
    { value: 'editar', label: 'Editar' },
    { value: 'excluir', label: 'Excluir' }
  ];

  const handleClear = () => {
    setFilters({ startDate: '', endDate: '', searchTerm: '', tipoAcao: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getAcaoBadge = (tipo: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode; label: string }> = {
      criar: { variant: 'default', icon: <Plus className="h-3 w-3" />, label: 'Criar' },
      editar: { variant: 'secondary', icon: <Pencil className="h-3 w-3" />, label: 'Editar' },
      excluir: { variant: 'destructive', icon: <Trash2 className="h-3 w-3" />, label: 'Excluir' }
    };

    const config = configs[tipo] || { variant: 'secondary' as const, icon: null, label: tipo };

    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatFieldName = (key: string): string => {
    const mapping: Record<string, string> = {
      nome: 'Nome',
      descricao: 'Descrição',
      departamento_id: 'Departamento',
      permissoes: 'Permissões',
      ativo: 'Status',
      nivel: 'Nível'
    };
    return mapping[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.join(', ') || '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderChanges = (log: LogCargoExtended) => {
    const { tipo_de_acao, dados_anteriores, dados_novos } = log;

    if (tipo_de_acao === 'criar' && dados_novos) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados do novo cargo:</p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
            {Object.entries(dados_novos)
              .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-green-700 dark:text-green-400 min-w-[120px]">
                    {formatFieldName(key)}:
                  </span>
                  <span className="text-foreground">{formatValue(value)}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (tipo_de_acao === 'excluir' && dados_anteriores) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados do cargo excluído:</p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
            {Object.entries(dados_anteriores)
              .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-red-700 dark:text-red-400 min-w-[120px]">
                    {formatFieldName(key)}:
                  </span>
                  <span className="text-foreground">{formatValue(value)}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (tipo_de_acao === 'editar' && dados_anteriores && dados_novos) {
      const allKeys = new Set([...Object.keys(dados_anteriores), ...Object.keys(dados_novos)]);
      const changes = Array.from(allKeys).filter(key => {
        if (['id', 'created_at', 'updated_at'].includes(key)) return false;
        const oldVal = JSON.stringify(dados_anteriores[key]);
        const newVal = JSON.stringify(dados_novos[key]);
        return oldVal !== newVal;
      });

      if (changes.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhuma alteração detectada</p>;
      }

      return (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Alterações realizadas:</p>
          {changes.map(key => (
            <div key={key} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="font-medium text-sm min-w-[100px]">{formatFieldName(key)}:</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="px-2 py-1 bg-red-500/10 text-red-700 dark:text-red-400 rounded text-sm line-through">
                  {formatValue(dados_anteriores[key])}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded text-sm">
                  {formatValue(dados_novos[key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Novo: Renderização específica para alterações de permissões
    if (tipo_de_acao === 'editar_permissoes' && dados_anteriores && dados_novos) {
      const permissoesAdicionadas = (dados_novos.permissoes_adicionadas as string[]) || [];
      const permissoesRemovidas = (dados_novos.permissoes_removidas as string[]) || [];
      const totalAnterior = (dados_anteriores.total_permissoes as number) || 0;
      const totalNovo = (dados_novos.total_permissoes as number) || 0;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <span className="font-medium text-sm">Total de permissões:</span>
            <span className="px-2 py-1 bg-muted rounded text-sm">{totalAnterior}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">{totalNovo}</span>
          </div>

          {permissoesAdicionadas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Permissões adicionadas ({permissoesAdicionadas.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {permissoesAdicionadas.map((perm: string) => (
                  <span key={perm} className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs border border-green-500/20">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {permissoesRemovidas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Permissões removidas ({permissoesRemovidas.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {permissoesRemovidas.map((perm: string) => (
                  <span key={perm} className="px-2 py-1 bg-red-500/10 text-red-700 dark:text-red-400 rounded text-xs border border-red-500/20 line-through">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {permissoesAdicionadas.length === 0 && permissoesRemovidas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma alteração de permissão detectada</p>
          )}
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">Sem detalhes disponíveis</p>;
  };

  return (
    <PermissionGuard
      permissions="admin.logs-cargos.visualizar"
      showMessage={true}
    >
      <div className="space-y-6 p-6">
        <LogsHeader
          title="Logs de Cargos"
          description="Histórico de alterações em cargos e departamentos"
          icon={<Briefcase className="h-6 w-6" />}
          onRefresh={refetch}
          data={logs}
          filename="logs_cargos"
        />

        <LogsFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(v) => setFilters({ ...filters, startDate: v })}
          onEndDateChange={(v) => setFilters({ ...filters, endDate: v })}
          selectedTipo={filters.tipoAcao}
          onTipoChange={(v) => setFilters({ ...filters, tipoAcao: v })}
          tipoOptions={tiposAcao}
          onSearch={refetch}
          onClear={handleClear}
          config={{ showTipo: true, showSearch: false }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros de Alterações</CardTitle>
            <CardDescription>
              {totalItems} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      {getAcaoBadge(log.tipo_de_acao)}
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-muted-foreground">Responsável</span>
                        <span className="text-sm font-medium truncate">
                          {log.usuario?.nome || log.usuario?.email || '-'}
                        </span>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-muted-foreground">Cargo</span>
                        <span className="text-sm font-medium truncate">
                          {log.cargo?.nome || (log.dados_novos as Record<string, unknown>)?.nome as string || '-'}
                        </span>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-muted-foreground">Departamento</span>
                        <span className="text-sm font-medium truncate">
                          {log.departamento?.nome || '-'}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
              </div>
            )}

            <LogsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>Detalhes do Log</DialogTitle>
                {selectedLog && getAcaoBadge(selectedLog.tipo_de_acao)}
              </div>
            </DialogHeader>
            
            {selectedLog && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 pr-4">
                  {/* Informações Gerais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Data/Hora</span>
                      </div>
                      <p className="font-medium">
                        {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="h-4 w-4" />
                        <span>Responsável</span>
                      </div>
                      <p className="font-medium">
                        {selectedLog.usuario?.nome || selectedLog.usuario?.email || '-'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Briefcase className="h-4 w-4" />
                        <span>Cargo</span>
                      </div>
                      <p className="font-medium">
                        {selectedLog.cargo?.nome || '-'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Building className="h-4 w-4" />
                        <span>Departamento</span>
                      </div>
                      <p className="font-medium">
                        {selectedLog.departamento?.nome || '-'}
                      </p>
                    </div>
                    
                    {selectedLog.ip_address && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Globe className="h-4 w-4" />
                          <span>Endereço IP</span>
                        </div>
                        <p className="font-medium font-mono text-sm">
                          {selectedLog.ip_address}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedLog.user_agent && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Monitor className="h-4 w-4" />
                        <span>Navegador/Dispositivo</span>
                      </div>
                      <p className="text-sm bg-muted p-2 rounded font-mono text-xs break-all">
                        {selectedLog.user_agent}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Alterações */}
                  <div>
                    <h4 className="font-medium mb-4">Alterações</h4>
                    {renderChanges(selectedLog)}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
};

export default LogsCargos;
