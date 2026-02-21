import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { cn } from '@/lib/utils';
import LogsPagination from '@/components/admin/logging/LogsPagination';

interface LogMensagemRapida {
  id: number;
  mensagem_id: number | null;
  usuario_responsavel: string | null;
  tipo_de_acao: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  timestamp: string;
  usuarios?: { nome: string } | null;
}

const ACTION_ALIASES: Record<string, string> = {
  created: 'criar',
  create: 'criar',
  deleted: 'excluir',
  delete: 'excluir',
  updated: 'editar',
  update: 'editar',
  edited: 'editar',
  activate: 'ativar',
  activated: 'ativar',
  deactivate: 'desativar',
  deactivated: 'desativar',
};

const TIPOS_ACAO = ['criar', 'editar', 'excluir', 'ativar', 'desativar'];

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título',
  conteudo: 'Conteúdo',
  ativo: 'Status',
  atalho: 'Atalho',
  categoria: 'Categoria',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
  id: 'ID',
  mensagem_id: 'ID da Mensagem',
};

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  criar: { label: 'Criação', icon: Plus, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  editar: { label: 'Edição', icon: Pencil, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  excluir: { label: 'Exclusão', icon: Trash2, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  ativar: { label: 'Ativação', icon: ToggleRight, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  desativar: { label: 'Desativação', icon: ToggleLeft, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
};

const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (key === 'ativo') return value ? 'Ativo' : 'Inativo';
  if (key === 'created_at' || key === 'updated_at') {
    try {
      return format(new Date(value as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'string' && value.length > 150) {
    return value.substring(0, 150) + '...';
  }
  return String(value);
};

const LogsMensagensRapidas: React.FC = () => {
  const [logs, setLogs] = useState<LogMensagemRapida[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.logs-mensagens-rapidas.exportar');

  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedTipoAcao, setSelectedTipoAcao] = useState<string>('');
  const [searchMensagemId, setSearchMensagemId] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const activeFiltersCount = [selectedUsuario, selectedTipoAcao, searchMensagemId].filter(Boolean).length;

  const loadUsuarios = useCallback(async () => {
    const supabase = requireAuthenticatedClient();
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .order('nome');
    setUsuarios((data || []).map(u => ({ id: String(u.id), nome: u.nome })));
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query sem join (buscar usuários separadamente)
      let query = supabase
        .from('logs_mensagens_rapidas')
        .select('*', { count: 'exact' })
        .gte('timestamp', `${startDate}T00:00:00`)
        .lte('timestamp', `${endDate}T23:59:59`)
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (selectedUsuario) {
        query = query.eq('usuario_responsavel', selectedUsuario);
      }
      if (selectedTipoAcao) {
        // log.tipo_de_acao no banco vem como created/updated/deleted...
        const dbAction = Object.keys(ACTION_ALIASES).find((k) => ACTION_ALIASES[k] === selectedTipoAcao);
        query = query.eq('tipo_de_acao', dbAction || selectedTipoAcao);
      }
      if (searchMensagemId) {
        query = query.eq('mensagem_id', parseInt(searchMensagemId));
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const usuarioIds = [...new Set((data || []).map(log => log.usuario_responsavel).filter(Boolean))] as string[];
      const usuariosMap = new Map<string, string>();

      if (usuarioIds.length > 0) {
        const { data: usuariosData } = await requireAuthenticatedClient()
          .from('usuarios')
          .select('id, nome')
          .in('id', usuarioIds);

        if (usuariosData) {
          usuariosData.forEach(u => usuariosMap.set(String(u.id), u.nome));
        }
      }

      // Enriquecer logs com nomes de usuários e normalizar tipo de ação
      const enrichedData = (data || []).map(log => {
        const normalizedAction = ACTION_ALIASES[String(log.tipo_de_acao || '').toLowerCase()] || log.tipo_de_acao;
        return {
          ...log,
          tipo_de_acao: normalizedAction,
          usuarios: log.usuario_responsavel
            ? { nome: usuariosMap.get(String(log.usuario_responsavel)) || 'Desconhecido' }
            : null
        };
      });

      setLogs(enrichedData);
      setTotalLogs(count || 0);
    } catch (error) {
      toast.error('Erro ao carregar logs de mensagens rápidas');
    } finally {
      setLoading(false);
    }
  }, [selectedUsuario, selectedTipoAcao, searchMensagemId, startDate, endDate, currentPage, pageSize]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearFilters = () => {
    setSelectedUsuario('');
    setSelectedTipoAcao('');
    setSearchMensagemId('');
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
      ['ID', 'Mensagem ID', 'Usuário', 'Tipo Ação', 'Data/Hora', 'Dados Anteriores', 'Dados Novos'].join(';'),
      ...logs.map(log => [
        log.id,
        log.mensagem_id || '-',
        log.usuarios?.nome || log.usuario_responsavel || '-',
        log.tipo_de_acao || '-',
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
        JSON.stringify(log.dados_anteriores || {}),
        JSON.stringify(log.dados_novos || {})
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_mensagens_rapidas_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('Logs exportados com sucesso!');
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  const renderDataComparison = (log: LogMensagemRapida) => {
    const { dados_anteriores, dados_novos, tipo_de_acao } = log;
    
    if (tipo_de_acao === 'criar' && dados_novos) {
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Dados criados:</h4>
          <div className="grid gap-2">
            {Object.entries(dados_novos)
              .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-foreground min-w-[120px]">
                    {FIELD_LABELS[key] || key}:
                  </span>
                  <span className="text-muted-foreground">{formatFieldValue(key, value)}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (tipo_de_acao === 'excluir' && dados_anteriores) {
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Dados excluídos:</h4>
          <div className="grid gap-2">
            {Object.entries(dados_anteriores)
              .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-foreground min-w-[120px]">
                    {FIELD_LABELS[key] || key}:
                  </span>
                  <span className="text-muted-foreground line-through opacity-70">
                    {formatFieldValue(key, value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if ((tipo_de_acao === 'editar' || tipo_de_acao === 'ativar' || tipo_de_acao === 'desativar') && dados_anteriores && dados_novos) {
      const changedFields = Object.keys(dados_novos).filter(key => {
        if (['id', 'created_at', 'updated_at'].includes(key)) return false;
        return JSON.stringify(dados_anteriores[key]) !== JSON.stringify(dados_novos[key]);
      });

      if (changedFields.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhuma alteração detectada</p>;
      }

      return (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Alterações realizadas:</h4>
          <div className="grid gap-3">
            {changedFields.map(key => (
              <div key={key} className="rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {FIELD_LABELS[key] || key}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 rounded bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm">
                    <span className="text-red-700 dark:text-red-400">
                      {formatFieldValue(key, dados_anteriores[key])}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 rounded bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm">
                    <span className="text-green-700 dark:text-green-400">
                      {formatFieldValue(key, dados_novos[key])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>;
  };

  return (
    <PermissionGuard 
      permissions="admin.logs-mensagens-rapidas.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full">
          <PageHeader
            title="Logs de Mensagens Rápidas"
            subtitle="Histórico de alterações nas mensagens rápidas"
            icon={History}
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Logs de Mensagens Rápidas' }
            ]}
            actions={
              <div className="flex gap-2">
                <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
                {canExport && (
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                )}
              </div>
            }
          />

          <div className="flex-1 overflow-auto p-6 space-y-4">
            {/* Filtros Colapsáveis */}
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Filtros</span>
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      filtersOpen && "rotate-180"
                    )} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
                      <Select value={selectedUsuario || "all"} onValueChange={(v) => setSelectedUsuario(v === "all" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Usuário" />
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

                      <Select value={selectedTipoAcao || "all"} onValueChange={(v) => setSelectedTipoAcao(v === "all" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de ação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          {TIPOS_ACAO.map(t => (
                            <SelectItem key={t} value={t}>
                              {ACTION_CONFIG[t]?.label || t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="ID da mensagem..."
                        value={searchMensagemId}
                        onChange={(e) => setSearchMensagemId(e.target.value)}
                      />

                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />

                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="flex justify-end mt-4">
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar filtros
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Lista de Logs */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-12 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum log encontrado</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Tente ajustar os filtros ou o período de busca
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => {
                      const config = ACTION_CONFIG[log.tipo_de_acao || ''] || ACTION_CONFIG.editar;
                      const Icon = config.icon;
                      const isExpanded = expandedRows.has(log.id);

                      return (
                        <div key={log.id} className="group">
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className={cn("p-2.5 rounded-full flex-shrink-0", config.bgColor)}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">
                                  {log.usuarios?.nome || `Usuário #${log.usuario_responsavel}`}
                                </span>
                                <span className="text-muted-foreground text-sm">realizou</span>
                                <Badge variant="outline" className={cn("font-normal", config.color)}>
                                  {config.label}
                                </Badge>
                                {log.mensagem_id && (
                                  <span className="text-xs text-muted-foreground">
                                    na mensagem #{log.mensagem_id}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {format(new Date(log.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>

                            <ChevronDown 
                              className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
                                isExpanded && "rotate-180"
                              )} 
                            />
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pl-16">
                              <div className="rounded-lg border border-border bg-muted/20 p-4">
                                {renderDataComparison(log)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paginação */}
            <LogsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalLogs}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default LogsMensagensRapidas;
