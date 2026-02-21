import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Search, Filter, Download, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
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

interface Erro {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  pagina: string | null;
  nivel: string | null;
  data_ocorrencia: string | null;
  dados_extra: any;
  resolvido: boolean | null;
  resolvido_em: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  tipo: string | null;
}

const NIVEIS = ['info', 'warn', 'error', 'critical'];
const CATEGORIAS = ['frontend', 'backend', 'database', 'api', 'auth', 'integration'];

const Erros: React.FC = () => {
  const [erros, setErros] = useState<Erro[]>([]);
  const [totalErros, setTotalErros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.erros.exportar');
  const canEdit = hasPermission('admin.erros.editar');

  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedResolvido, setSelectedResolvido] = useState<string>('');
  const [searchTitulo, setSearchTitulo] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const LIMIT = 50;

  const loadErros = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('erros')
        .select('*', { count: 'exact' })
        .gte('criado_em', `${startDate}T00:00:00`)
        .lte('criado_em', `${endDate}T23:59:59`)
        .order('criado_em', { ascending: false })
        .range(page * LIMIT, (page + 1) * LIMIT - 1);

      if (selectedNivel) {
        query = query.eq('nivel', selectedNivel);
      }
      if (selectedCategoria) {
        query = query.eq('categoria', selectedCategoria);
      }
      if (selectedResolvido === 'true') {
        query = query.eq('resolvido', true);
      } else if (selectedResolvido === 'false') {
        query = query.eq('resolvido', false);
      }
      if (searchTitulo) {
        query = query.ilike('titulo', `%${searchTitulo}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setErros(data || []);
      setTotalErros(count || 0);
    } catch (error) {
      toast.error('Erro ao carregar erros');
    } finally {
      setLoading(false);
    }
  }, [selectedNivel, selectedCategoria, selectedResolvido, searchTitulo, startDate, endDate, page]);

  useEffect(() => {
    loadErros();
  }, [loadErros]);

  const handleSearch = () => {
    setPage(0);
    loadErros();
  };

  const handleClearFilters = () => {
    setSelectedNivel('');
    setSelectedCategoria('');
    setSelectedResolvido('');
    setSearchTitulo('');
    setStartDate(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setPage(0);
  };

  const handleToggleResolvido = async (erro: Erro) => {
    try {
      const supabase = requireAuthenticatedClient();
      const novoStatus = !erro.resolvido;
      const { error } = await supabase
        .from('erros')
        .update({ 
          resolvido: novoStatus,
          resolvido_em: novoStatus ? new Date().toISOString() : null,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', erro.id);

      if (error) throw error;

      toast.success(novoStatus ? 'Erro marcado como resolvido' : 'Erro reaberto');
      loadErros();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Título', 'Descrição', 'Categoria', 'Nível', 'Página', 'Tipo', 'Resolvido', 'Data Ocorrência', 'Criado Em'].join(';'),
      ...erros.map(erro => [
        erro.id,
        erro.titulo,
        erro.descricao || '-',
        erro.categoria || '-',
        erro.nivel || '-',
        erro.pagina || '-',
        erro.tipo || '-',
        erro.resolvido ? 'Sim' : 'Não',
        erro.data_ocorrencia ? format(new Date(erro.data_ocorrencia), 'dd/MM/yyyy HH:mm:ss') : '-',
        erro.criado_em ? format(new Date(erro.criado_em), 'dd/MM/yyyy HH:mm:ss') : '-'
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `erros_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    toast.success('Erros exportados com sucesso!');
  };

  const getNivelBadgeColor = (nivel: string | null) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-500',
      warn: 'bg-yellow-500',
      error: 'bg-red-500',
      critical: 'bg-red-700',
    };
    return colors[nivel || ''] || 'bg-gray-400';
  };

  const totalPages = Math.ceil(totalErros / LIMIT);

  return (
    <PermissionGuard 
      permissions="admin.erros.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full p-6 space-y-6">
          <PageHeader
          title="Erros do Sistema"
          subtitle="Visualize e gerencie todos os erros registrados"
          icon={AlertTriangle}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Erros' }
          ]}
          actions={
            <div className="flex gap-2">
              <Button onClick={loadErros} variant="outline" size="sm" disabled={loading}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Nível</Label>
                <Select value={selectedNivel || "all"} onValueChange={(v) => setSelectedNivel(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    {NIVEIS.map(n => (
                      <SelectItem key={n} value={n}>
                        {n.charAt(0).toUpperCase() + n.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={selectedCategoria || "all"} onValueChange={(v) => setSelectedCategoria(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedResolvido || "all"} onValueChange={(v) => setSelectedResolvido(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="false">Pendentes</SelectItem>
                    <SelectItem value="true">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Buscar Título</Label>
                <Input
                  placeholder="Buscar por título..."
                  value={searchTitulo}
                  onChange={(e) => setSearchTitulo(e.target.value)}
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
              Erros ({totalErros} registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : erros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum erro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    erros.map(erro => (
                      <React.Fragment key={erro.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedRow(expandedRow === erro.id ? null : erro.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {erro.criado_em ? format(new Date(erro.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {erro.titulo}
                          </TableCell>
                          <TableCell>
                            {erro.categoria ? (
                              <Badge variant="outline">{erro.categoria}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {erro.nivel ? (
                              <Badge className={`${getNivelBadgeColor(erro.nivel)} text-white`}>
                                {erro.nivel}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {erro.pagina || '-'}
                          </TableCell>
                          <TableCell>
                            {erro.resolvido ? (
                              <Badge className="bg-green-500 text-white">Resolvido</Badge>
                            ) : (
                              <Badge variant="destructive">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {canEdit && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleResolvido(erro);
                                  }}
                                  title={erro.resolvido ? 'Reabrir' : 'Marcar como resolvido'}
                                >
                                  {erro.resolvido ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                {expandedRow === erro.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRow === erro.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30 p-3">
                              <div className="space-y-2 text-xs">
                                {erro.descricao && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Descrição: </span>
                                    <span>{erro.descricao}</span>
                                  </div>
                                )}
                                {erro.tipo && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Tipo: </span>
                                    <span>{erro.tipo}</span>
                                  </div>
                                )}
                                {erro.data_ocorrencia && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Data Ocorrência: </span>
                                    <span>{format(new Date(erro.data_ocorrencia), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</span>
                                  </div>
                                )}
                                {erro.resolvido_em && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Resolvido em: </span>
                                    <span>{format(new Date(erro.resolvido_em), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</span>
                                  </div>
                                )}
                                {erro.dados_extra && Object.keys(erro.dados_extra).length > 0 && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">Dados Extra: </span>
                                    <pre className="mt-1 p-2 overflow-auto max-w-full bg-muted/50 rounded text-[10px]">
                                      {JSON.stringify(erro.dados_extra, null, 2)}
                                    </pre>
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

export default Erros;
