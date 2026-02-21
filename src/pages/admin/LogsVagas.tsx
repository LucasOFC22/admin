/**
 * Página de Logs de Vagas de Emprego
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { LogsFilters, LogsHeader } from '@/components/admin/logging';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  Eye, 
  Plus, 
  Pencil, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Clock,
  Monitor,
  Globe,
  ArrowRight,
  Users
} from 'lucide-react';

interface LogVagaComRelacoes {
  id: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  usuario_id: string | null;
  dados_novos: Record<string, unknown> | null;
  tipo_de_acao: string;
  dados_anteriores: Record<string, unknown> | null;
  vaga_id: number | null;
  usuario: { nome: string; email: string } | null;
}

const LogsVagas = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    searchTerm: '',
    tipoAcao: ''
  });
  const [selectedLog, setSelectedLog] = useState<LogVagaComRelacoes | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs-vagas', filters, currentPage, pageSize],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('logs_vagas')
        .select(`
          *,
          usuario:usuario_id(nome, email)
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
      return { logs: data as LogVagaComRelacoes[], total: count || 0 };
    }
  });

  const logs = data?.logs || [];
  const totalItems = data?.total || 0;

  const tiposAcao = [
    { value: 'criar', label: 'Criar' },
    { value: 'editar', label: 'Editar' },
    { value: 'excluir', label: 'Excluir' },
    { value: 'ativar', label: 'Ativar' },
    { value: 'desativar', label: 'Desativar' }
  ];

  const handleClear = () => {
    setFilters({ startDate: '', endDate: '', searchTerm: '', tipoAcao: '' });
    setCurrentPage(1);
  };

  const getAcaoBadge = (tipo: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      criar: { variant: 'default', icon: <Plus className="h-3 w-3" />, label: 'Criar' },
      editar: { variant: 'secondary', icon: <Pencil className="h-3 w-3" />, label: 'Editar' },
      excluir: { variant: 'destructive', icon: <Trash2 className="h-3 w-3" />, label: 'Excluir' },
      ativar: { variant: 'default', icon: <ToggleRight className="h-3 w-3" />, label: 'Ativar' },
      desativar: { variant: 'outline', icon: <ToggleLeft className="h-3 w-3" />, label: 'Desativar' }
    };

    const config = configs[tipo] || { variant: 'outline' as const, icon: null, label: tipo };

    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatFieldName = (key: string): string => {
    const mapping: Record<string, string> = {
      titulo: 'Título',
      descricao: 'Descrição',
      cidade: 'Cidade',
      requisitos: 'Requisitos',
      vagas: 'Quantidade de Vagas',
      ativo: 'Status'
    };
    return mapping[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ativo' : 'Inativo';
    if (Array.isArray(value)) return value.join(', ') || '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderChanges = (log: LogVagaComRelacoes) => {
    const { tipo_de_acao, dados_anteriores, dados_novos } = log;

    if (tipo_de_acao === 'criar' && dados_novos) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados da nova vaga:</p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
            {Object.entries(dados_novos).map(([key, value]) => (
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
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados da vaga excluída:</p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
            {Object.entries(dados_anteriores).map(([key, value]) => (
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

    if (tipo_de_acao === 'ativar' || tipo_de_acao === 'desativar') {
      return (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <span className="font-medium">Status alterado:</span>
          <Badge variant={tipo_de_acao === 'ativar' ? 'default' : 'outline'}>
            {tipo_de_acao === 'ativar' ? 'Ativada' : 'Desativada'}
          </Badge>
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">Sem detalhes disponíveis</p>;
  };

  return (
    <PermissionGuard
      permissions="admin.logs-vagas.visualizar"
      showMessage={true}
    >
      <div className="space-y-6 p-6">
        <LogsHeader
          title="Vagas de Emprego"
          description="Histórico completo de alterações em vagas de emprego"
          icon={<Briefcase className="h-6 w-6" />}
          onRefresh={refetch}
          data={logs}
          filename="logs_vagas"
        />

        <LogsFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(v) => setFilters({ ...filters, startDate: v })}
          onEndDateChange={(v) => setFilters({ ...filters, endDate: v })}
          selectedTipo={filters.tipoAcao}
          onTipoChange={(v) => setFilters({ ...filters, tipoAcao: v })}
          tipoOptions={tiposAcao}
          searchValue={filters.searchTerm}
          onSearchChange={(v) => setFilters({ ...filters, searchTerm: v })}
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
          <CardContent>
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
                          {log.usuario?.nome || log.usuario?.email || log.usuario_id?.slice(0, 8) || '-'}
                        </span>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-muted-foreground">Vaga</span>
                        <span className="text-sm font-medium truncate">
                          {(log.dados_novos?.titulo || log.dados_anteriores?.titulo || `ID: ${log.vaga_id}`) as string}
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
                        <Users className="h-4 w-4" />
                        <span>Responsável</span>
                      </div>
                      <p className="font-medium">
                        {selectedLog.usuario?.nome || selectedLog.usuario?.email || '-'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Briefcase className="h-4 w-4" />
                        <span>Vaga ID</span>
                      </div>
                      <p className="font-medium">
                        {selectedLog.vaga_id || '-'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Globe className="h-4 w-4" />
                        <span>Endereço IP</span>
                      </div>
                      <p className="font-medium font-mono text-sm">
                        {selectedLog.ip_address || '-'}
                      </p>
                    </div>
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
                    <h4 className="text-sm font-medium mb-4">Detalhes da Ação</h4>
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

export default LogsVagas;
