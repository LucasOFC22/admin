import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Activity, Search, Filter, Download, RefreshCw, ChevronDown, ChevronUp,
  Globe, Monitor, Smartphone, FileText, Eye, LogIn, LogOut, Edit, Trash2, Plus
} from 'lucide-react';
import MostAccessedPagesCard from '@/components/admin/logging/MostAccessedPagesCard';

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

interface LogAtividade {
  id: string;
  usuario_id: string | null;
  acao: string;
  detalhes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  modulo: string | null;
  tipo: string | null;
  usuarios?: { nome: string } | null;
}

const MODULOS_DISPONIVEIS = [
  'cotacoes',
  'coletas',
  'usuarios',
  'whatsapp',
  'financeiro',
  'configuracoes',
  'ocorrencias',
  'documentos',
  'admin',
];

// Helper: Formatar User Agent
const formatUserAgent = (ua: string | null): { browser: string; os: string; device: 'Desktop' | 'Mobile' | 'Tablet' } => {
  if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido', device: 'Desktop' };
  
  let browser = 'Desconhecido';
  let os = 'Desconhecido';
  let device: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';

  // Detectar navegador
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  // Detectar SO
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua.includes('iPhone')) { os = 'iOS'; device = 'Mobile'; }
  else if (ua.includes('iPad')) { os = 'iPadOS'; device = 'Tablet'; }

  return { browser, os, device };
};

// Helper: Formatar detalhes JSON
const formatDetalhes = (detalhes: string | null): Record<string, unknown> | null => {
  if (!detalhes) return null;
  try {
    return typeof detalhes === 'string' ? JSON.parse(detalhes) : detalhes;
  } catch {
    return { valor: detalhes };
  }
};

// Helper: Traduzir ações
const formatAcao = (acao: string): string => {
  const traducoes: Record<string, string> = {
    'pagina_visualizada': 'Visualizou página',
    'erro_excluido': 'Excluiu erro',
    'login_sucesso': 'Realizou login',
    'logout': 'Realizou logout',
    'usuario_criado': 'Criou usuário',
    'usuario_atualizado': 'Atualizou usuário',
    'usuario_excluido': 'Excluiu usuário',
    'cotacao_criada': 'Criou cotação',
    'cotacao_atualizada': 'Atualizou cotação',
    'coleta_criada': 'Criou coleta',
    'coleta_atualizada': 'Atualizou coleta',
    'ocorrencia_criada': 'Criou ocorrência',
    'ocorrencia_atualizada': 'Atualizou ocorrência',
    'config_atualizada': 'Atualizou configuração',
  };
  return traducoes[acao] || acao.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Helper: Ícone da ação
const getAcaoIcon = (tipo: string | null) => {
  const iconClass = "h-4 w-4";
  switch (tipo) {
    case 'create': return <Plus className={`${iconClass} text-green-500`} />;
    case 'update': return <Edit className={`${iconClass} text-blue-500`} />;
    case 'delete': return <Trash2 className={`${iconClass} text-red-500`} />;
    case 'view': return <Eye className={`${iconClass} text-muted-foreground`} />;
    case 'login': return <LogIn className={`${iconClass} text-purple-500`} />;
    case 'logout': return <LogOut className={`${iconClass} text-orange-500`} />;
    default: return <FileText className={`${iconClass} text-muted-foreground`} />;
  }
};

const LogsAtividades: React.FC = () => {
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.logs-atividades.exportar');

  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedModulo, setSelectedModulo] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [searchAcao, setSearchAcao] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const LIMIT = 50;

  const loadUsuarios = useCallback(async () => {
    const supabase = requireAuthenticatedClient();
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .order('nome');
    setUsuarios(data || []);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('logs_atividade')
        .select('*, usuarios:usuario_id(nome)', { count: 'exact' })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(page * LIMIT, (page + 1) * LIMIT - 1);

      if (selectedUsuario) {
        query = query.eq('usuario_id', selectedUsuario);
      }
      if (selectedModulo) {
        query = query.eq('modulo', selectedModulo);
      }
      if (selectedTipo) {
        query = query.eq('tipo', selectedTipo);
      }
      if (searchAcao) {
        query = query.ilike('acao', `%${searchAcao}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalLogs(count || 0);
    } catch (error) {
      toast.error('Erro ao carregar logs de atividade');
    } finally {
      setLoading(false);
    }
  }, [selectedUsuario, selectedModulo, selectedTipo, searchAcao, startDate, endDate, page]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearch = () => {
    setPage(0);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSelectedUsuario('');
    setSelectedModulo('');
    setSelectedTipo('');
    setSearchAcao('');
    setStartDate(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setPage(0);
  };

  const handleExport = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Módulo', 'Tipo', 'Ação', 'Detalhes', 'IP', 'User Agent'].join(';'),
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.usuarios?.nome || '-',
        log.modulo || '-',
        log.tipo || '-',
        log.acao,
        log.detalhes || '-',
        log.ip_address || '-',
        log.user_agent || '-'
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_atividade_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('Logs exportados com sucesso!');
  };

  const getTipoBadgeVariant = (tipo: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case 'create': return 'default';
      case 'delete': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTipoLabel = (tipo: string | null): string => {
    const labels: Record<string, string> = {
      'create': 'Criação',
      'update': 'Edição',
      'delete': 'Exclusão',
      'view': 'Visualização',
      'login': 'Login',
      'logout': 'Logout',
    };
    return labels[tipo || ''] || tipo || '-';
  };

  const totalPages = Math.ceil(totalLogs / LIMIT);

  return (
    
      <PermissionGuard 
        permissions="admin.logs-atividades.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full p-6 space-y-6">
          <PageHeader
            title="Logs de Atividade"
            subtitle="Visualize todas as atividades dos usuários no sistema"
            icon={Activity}
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Logs de Atividade' }
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Usuário</Label>
                  <Select value={selectedUsuario || "all"} onValueChange={(v) => setSelectedUsuario(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Módulo</Label>
                  <Select value={selectedModulo || "all"} onValueChange={(v) => setSelectedModulo(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os módulos</SelectItem>
                      {MODULOS_DISPONIVEIS.map(m => (
                        <SelectItem key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={selectedTipo || "all"} onValueChange={(v) => setSelectedTipo(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Edição</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                      <SelectItem value="view">Visualização</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Buscar Ação</Label>
                  <Input
                    className="h-9"
                    placeholder="Buscar..."
                    value={searchAcao}
                    onChange={(e) => setSearchAcao(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Data Início</Label>
                  <Input
                    className="h-9"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    className="h-9"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Páginas Mais Acessadas */}
          <MostAccessedPagesCard startDate={startDate} endDate={endDate} />

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Registros</span>
                <Badge variant="secondary" className="font-normal">
                  {totalLogs} log{totalLogs !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Data/Hora</TableHead>
                      <TableHead className="w-[120px]">Usuário</TableHead>
                      <TableHead className="w-[100px]">Módulo</TableHead>
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Carregando...</span>
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                            <TableCell className="font-mono text-xs">
                              {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.usuarios?.nome || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {log.modulo ? (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {log.modulo}
                                </Badge>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {log.tipo ? (
                                <Badge variant={getTipoBadgeVariant(log.tipo)} className="text-xs font-normal">
                                  {getTipoLabel(log.tipo)}
                                </Badge>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getAcaoIcon(log.tipo)}
                                <span className="text-sm truncate max-w-[250px]">
                                  {formatAcao(log.acao)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(log.detalhes || log.ip_address || log.user_agent) && (
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  {expandedRow === log.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedRow === log.id && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Card de Detalhes */}
                                  {log.detalhes && (
                                    <Card className="bg-background border-muted">
                                      <CardHeader className="py-2 px-3">
                                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                          <FileText className="h-3 w-3" />
                                          Detalhes da Ação
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="py-2 px-3">
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                                          {JSON.stringify(formatDetalhes(log.detalhes), null, 2)}
                                        </pre>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Card de Conexão */}
                                  <Card className="bg-background border-muted">
                                    <CardHeader className="py-2 px-3">
                                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Globe className="h-3 w-3" />
                                        Conexão
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">IP:</span>
                                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                          {log.ip_address || 'N/A'}
                                        </code>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Card de Dispositivo */}
                                  {log.user_agent && (
                                    <Card className="bg-background border-muted">
                                      <CardHeader className="py-2 px-3">
                                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                          {formatUserAgent(log.user_agent).device === 'Mobile' ? (
                                            <Smartphone className="h-3 w-3" />
                                          ) : (
                                            <Monitor className="h-3 w-3" />
                                          )}
                                          Dispositivo
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="py-2 px-3 space-y-1.5">
                                        {(() => {
                                          const ua = formatUserAgent(log.user_agent);
                                          return (
                                            <div className="flex flex-wrap gap-1.5">
                                              <Badge variant="outline" className="text-[10px] font-normal">
                                                {ua.os}
                                              </Badge>
                                              <Badge variant="outline" className="text-[10px] font-normal">
                                                {ua.browser}
                                              </Badge>
                                              <Badge variant="secondary" className="text-[10px] font-normal">
                                                {ua.device}
                                              </Badge>
                                            </div>
                                          );
                                        })()}
                                      </CardContent>
                                    </Card>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    
  );
};

export default LogsAtividades;
