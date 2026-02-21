import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Megaphone, Search, Filter, Download, RefreshCw, 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, 
  Send, Eye, MessageSquare, Activity
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogsCampanhas, TIPOS_EVENTO, LogCampanha } from '@/hooks/useLogsCampanhas';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import LogsPagination from '@/components/admin/logging/LogsPagination';

const CATEGORIAS = [
  { value: 'campanha', label: 'Campanhas', icon: Megaphone },
  { value: 'mensagem', label: 'Mensagens', icon: MessageSquare },
  { value: 'erro', label: 'Erros', icon: AlertTriangle },
  { value: 'sistema', label: 'Sistema', icon: Activity },
  { value: 'contato', label: 'Contatos', icon: Eye },
];

const LogsCampanhas: React.FC = () => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();
  const canExport = hasPermission('admin.logs-campanhas.exportar');

  const {
    logs,
    totalLogs,
    loading,
    stats,
    campanhas,
    filters,
    currentPage,
    pageSize,
    totalPages,
    setFilters,
    setCurrentPage,
    setPageSize,
    refresh,
    exportCSV,
  } = useLogsCampanhas();

  const handleClearFilters = () => {
    setFilters({
      campanha_id: undefined,
      tipo_evento: undefined,
      categoria: undefined,
      telefone: undefined,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  };

  const getEventoBadge = (tipoEvento: string) => {
    const config = TIPOS_EVENTO.find(t => t.value === tipoEvento);
    return (
      <Badge className={`${config?.color || 'bg-gray-400'} text-white`}>
        {config?.label || tipoEvento}
      </Badge>
    );
  };

  const renderStatusTransition = (log: LogCampanha) => {
    if (!log.status_anterior && !log.status_novo) return '-';
    return (
      <div className="flex items-center gap-1 text-xs">
        {log.status_anterior && (
          <Badge variant="outline" className="text-xs">{log.status_anterior}</Badge>
        )}
        {log.status_anterior && log.status_novo && <span>→</span>}
        {log.status_novo && (
          <Badge variant="secondary" className="text-xs">{log.status_novo}</Badge>
        )}
      </div>
    );
  };

  return (
    <PermissionGuard 
      permissions="admin.logs-campanhas.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full p-6 space-y-6">
        <PageHeader
          title="Logs de Campanhas"
          subtitle="Histórico detalhado de eventos de campanhas WhatsApp"
          icon={Megaphone}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Logs Campanhas' }
          ]}
          actions={
            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {canExport && (
                <Button onClick={exportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          }
        />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total de Eventos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.por_categoria.mensagem || 0}</div>
                  <div className="text-sm text-muted-foreground">Mensagens</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.sucesso}</div>
                  <div className="text-sm text-muted-foreground">Sucesso</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.erros}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.por_categoria.campanha || 0}</div>
                  <div className="text-sm text-muted-foreground">Campanhas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Campanha</Label>
                <Select 
                  value={filters.campanha_id || "all"} 
                  onValueChange={(v) => setFilters({ campanha_id: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    {campanhas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={filters.categoria || "all"} 
                  onValueChange={(v) => setFilters({ categoria: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select 
                  value={filters.tipo_evento || "all"} 
                  onValueChange={(v) => setFilters({ tipo_evento: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {TIPOS_EVENTO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="Buscar por telefone..."
                  value={filters.telefone || ''}
                  onChange={(e) => setFilters({ telefone: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={refresh}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">
              Logs ({totalLogs} registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data/Hora</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Tipo Evento</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Transição Status</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-[80px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <React.Fragment key={log.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {log.campanha?.nome || '-'}
                          </TableCell>
                          <TableCell>
                            {getEventoBadge(log.tipo_evento)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={log.acao || undefined}>
                            {log.acao || '-'}
                          </TableCell>
                          <TableCell>
                            {renderStatusTransition(log)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.telefone || '-'}
                          </TableCell>
                          <TableCell>
                            {(log.erro_mensagem || log.dados_extra || log.message_id) ? (
                              <Button variant="ghost" size="sm">
                                {expandedRow === log.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRow === log.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <div className="space-y-3 text-sm">
                                {/* Informações gerais */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {log.template_name && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">Template: </span>
                                      <span>{log.template_name}</span>
                                    </div>
                                  )}
                                  {log.message_id && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">Message ID: </span>
                                      <span className="font-mono text-xs">{log.message_id}</span>
                                    </div>
                                  )}
                                  {log.conexao?.nome && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">Conexão: </span>
                                      <span>{log.conexao.nome}</span>
                                    </div>
                                  )}
                                  {log.duracao_ms && (
                                    <div>
                                      <span className="font-medium text-muted-foreground">Duração: </span>
                                      <span>{log.duracao_ms}ms</span>
                                    </div>
                                  )}
                                </div>

                                {/* Contadores snapshot */}
                                <div className="grid grid-cols-5 gap-2 p-2 bg-muted/50 rounded">
                                  <div className="text-center">
                                    <div className="text-xs text-muted-foreground">Total</div>
                                    <div className="font-bold">{log.total_contatos}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-muted-foreground">Enviados</div>
                                    <div className="font-bold text-blue-600">{log.enviados}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-muted-foreground">Entregues</div>
                                    <div className="font-bold text-green-600">{log.entregues}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-muted-foreground">Lidos</div>
                                    <div className="font-bold text-emerald-600">{log.lidos}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-muted-foreground">Erros</div>
                                    <div className="font-bold text-red-600">{log.erros}</div>
                                  </div>
                                </div>

                                {/* Erro */}
                                {log.erro_mensagem && (
                                  <div className="mt-2">
                                    <span className="font-medium text-red-600 block mb-1">Erro:</span>
                                    <pre className="p-2 overflow-auto max-w-full bg-red-50 dark:bg-red-950/20 rounded text-xs">
                                      {log.erro_codigo && <span className="font-bold">[{log.erro_codigo}] </span>}
                                      {log.erro_mensagem}
                                    </pre>
                                  </div>
                                )}

                                {/* Erro detalhes JSON */}
                                {log.erro_detalhes && Object.keys(log.erro_detalhes).length > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground block mb-1">Detalhes do Erro:</span>
                                    <pre className="p-2 overflow-auto max-w-full bg-muted rounded text-xs">
                                      {JSON.stringify(log.erro_detalhes, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Dados extra */}
                                {log.dados_extra && Object.keys(log.dados_extra).length > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground block mb-1">Dados Extras:</span>
                                    <pre className="p-2 overflow-auto max-w-full bg-muted rounded text-xs">
                                      {JSON.stringify(log.dados_extra, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Metadados */}
                                {(log.ip_origem || log.user_agent) && (
                                  <div className="text-xs text-muted-foreground border-t pt-2">
                                    {log.ip_origem && <span>IP: {log.ip_origem} | </span>}
                                    {log.user_agent && <span className="truncate max-w-[400px] inline-block align-bottom">UA: {log.user_agent}</span>}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <LogsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalLogs}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default LogsCampanhas;
