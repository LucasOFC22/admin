import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileWarning, Search, Filter, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import LogsPagination from '@/components/admin/logging/LogsPagination';

interface LogOcorrencia {
  id: string;
  ocorrencia_id: string | null;
  usuario_responsavel: number | null;
  tipo_de_acao: string | null;
  dados_anteriores: any;
  dados_novos: any;
  created_at: string;
}

const TIPOS_ACAO = ['criar', 'editar', 'excluir', 'finalizar', 'reabrir', 'comentar'];

const LogsOcorrencias: React.FC = () => {
  const [logs, setLogs] = useState<LogOcorrencia[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.logs-ocorrencias.exportar');

  const [usuarios, setUsuarios] = useState<{ id: number; nome: string }[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedTipoAcao, setSelectedTipoAcao] = useState<string>('');
  const [searchOcorrenciaId, setSearchOcorrenciaId] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadUsuarios = useCallback(async () => {
    const supabase = requireAuthenticatedClient();
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .order('nome');
    setUsuarios((data || []).map(u => ({ id: Number(u.id), nome: u.nome })));
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('logs_ocorrencia')
        .select('*', { count: 'exact' })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (selectedUsuario) {
        query = query.eq('usuario_responsavel', parseInt(selectedUsuario));
      }
      if (selectedTipoAcao) {
        query = query.eq('tipo_de_acao', selectedTipoAcao);
      }
      if (searchOcorrenciaId) {
        query = query.eq('ocorrencia_id', searchOcorrenciaId);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalLogs(count || 0);
    } catch (error) {
      toast.error('Erro ao carregar logs de ocorrências');
    } finally {
      setLoading(false);
    }
  }, [selectedUsuario, selectedTipoAcao, searchOcorrenciaId, startDate, endDate, currentPage, pageSize]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedUsuario('');
    setSelectedTipoAcao('');
    setSearchOcorrenciaId('');
    setStartDate(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Ocorrência ID', 'Usuário ID', 'Tipo Ação', 'Created At', 'Dados Anteriores', 'Dados Novos'].join(';'),
      ...logs.map(log => [
        log.id,
        log.ocorrencia_id || '-',
        log.usuario_responsavel || '-',
        log.tipo_de_acao || '-',
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        JSON.stringify(log.dados_anteriores || {}),
        JSON.stringify(log.dados_novos || {})
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_ocorrencias_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('Logs exportados com sucesso!');
  };

  const getTipoAcaoBadgeColor = (tipo: string | null) => {
    const colors: Record<string, string> = {
      criar: 'bg-green-500',
      editar: 'bg-blue-500',
      excluir: 'bg-red-500',
      finalizar: 'bg-emerald-600',
      reabrir: 'bg-orange-500',
      comentar: 'bg-purple-500',
    };
    return colors[tipo || ''] || 'bg-gray-400';
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <PermissionGuard 
      permissions="admin.logs-ocorrencias.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full p-6 space-y-6">
          <PageHeader
          title="Logs de Ocorrências"
          subtitle="Histórico de alterações nas ocorrências"
          icon={FileWarning}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Logs Ocorrências' }
          ]}
          actions={
            <div className="flex gap-2">
              <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {canExport && (
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Usuário Responsável</Label>
                <Select value={selectedUsuario || "all"} onValueChange={(v) => setSelectedUsuario(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {usuarios.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ação</Label>
                <Select value={selectedTipoAcao || "all"} onValueChange={(v) => setSelectedTipoAcao(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {TIPOS_ACAO.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ID Ocorrência</Label>
                <Input
                  placeholder="Buscar por ID..."
                  value={searchOcorrenciaId}
                  onChange={(e) => setSearchOcorrenciaId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    <TableHead>Ocorrência ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo Ação</TableHead>
                    <TableHead className="w-[100px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                          <TableCell className="font-mono text-xs">
                            {log.ocorrencia_id ? `${log.ocorrencia_id.slice(0, 8)}...` : '-'}
                          </TableCell>
                          <TableCell>
                            {log.usuario_responsavel || '-'}
                          </TableCell>
                          <TableCell>
                            {log.tipo_de_acao ? (
                              <Badge className={`${getTipoAcaoBadgeColor(log.tipo_de_acao)} text-white`}>
                                {log.tipo_de_acao}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {(log.dados_anteriores || log.dados_novos) ? (
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
                            <TableCell colSpan={5} className="bg-muted/30 p-3">
                              <div className="space-y-2 text-xs">
                                {log.ocorrencia_id && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">ID Ocorrência Completo: </span>
                                    <span className="font-mono">{log.ocorrencia_id}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                  {log.dados_anteriores && Object.keys(log.dados_anteriores).length > 0 && (
                                    <div>
                                      <span className="font-medium text-muted-foreground block mb-1">Dados Anteriores:</span>
                                      <pre className="p-2 overflow-auto max-w-full bg-red-50 dark:bg-red-950/20 rounded text-[10px]">
                                        {JSON.stringify(log.dados_anteriores, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.dados_novos && Object.keys(log.dados_novos).length > 0 && (
                                    <div>
                                      <span className="font-medium text-muted-foreground block mb-1">Dados Novos:</span>
                                      <pre className="p-2 overflow-auto max-w-full bg-green-50 dark:bg-green-950/20 rounded text-[10px]">
                                        {JSON.stringify(log.dados_novos, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
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
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default LogsOcorrencias;
