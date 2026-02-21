import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertTriangle, Trash2, Download, Search, CheckCircle2, XCircle } from 'lucide-react';
import { errorLogService } from '@/services/error/errorLogService';
import { useImprovedAsyncOperation } from '@/hooks/useImprovedAsyncOperation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

const ErrorLogsManagement = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState<string>('all');
  const [resolvidoFilter, setResolvidoFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  
  const { data: errorLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['errorLogs'],
    queryFn: () => errorLogService.getErrorLogs(1000),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const { execute: cleanOldLogs, loading: cleaningLogs } = useImprovedAsyncOperation({
    successMessage: 'Logs antigos removidos com sucesso',
    errorMessage: 'Erro ao remover logs antigos'
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleCleanOldLogs = async () => {
    await cleanOldLogs(() => errorLogService.deleteOldLogs(30));
    refetch();
  };

  const markAsResolvedMutation = useMutation({
    mutationFn: async (logId: number) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('erros')
        .update({
          resolvido: true, 
          resolvido_em: new Date().toISOString() 
        })
        .eq('id', logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Log marcado como resolvido');
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
    },
    onError: () => {
      toast.error('Erro ao marcar log como resolvido');
    }
  });

  const markAsUnresolvedMutation = useMutation({
    mutationFn: async (logId: number) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('erros')
        .update({ 
          resolvido: false, 
          resolvido_em: null 
        })
        .eq('id', logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Log marcado como não resolvido');
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
    },
    onError: () => {
      toast.error('Erro ao marcar log como não resolvido');
    }
  });

  const exportLogs = () => {
    const dataStr = JSON.stringify(errorLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const errorTypes = [...new Set(errorLogs.map(log => log.categoria || 'outros'))];
  
  const filteredLogs = errorLogs.filter(log => {
    // Filtro por tipo
    if (selectedType !== 'all' && log.categoria !== selectedType) return false;
    
    // Filtro por nível
    if (nivelFilter !== 'all' && log.nivel !== nivelFilter) return false;
    
    // Filtro por resolvido
    if (resolvidoFilter === 'resolvido' && !log.resolvido) return false;
    if (resolvidoFilter === 'nao-resolvido' && log.resolvido) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.titulo?.toLowerCase().includes(search) ||
        log.descricao?.toLowerCase().includes(search) ||
        log.pagina?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const errorStats = {
    total: errorLogs.length,
    resolvidos: errorLogs.filter(log => log.resolvido).length,
    naoResolvidos: errorLogs.filter(log => !log.resolvido).length,
    today: errorLogs.filter(log => {
      const logDate = new Date(log.criado_em || '');
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    critical: errorLogs.filter(log => log.nivel === 'critical').length,
    error: errorLogs.filter(log => log.nivel === 'error').length,
    warning: errorLogs.filter(log => log.nivel === 'warning').length,
    byType: errorTypes.reduce((acc, type) => {
      acc[type] = errorLogs.filter(log => log.categoria === type).length;
      return acc;
    }, {} as Record<string, number>)
  };

  const getErrorTypeColor = (categoria: string) => {
    switch (categoria) {
      case 'api': return 'destructive';
      case 'react': return 'destructive';
      case 'javascript': return 'destructive';
      case 'promise': return 'secondary';
      case 'resource': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs de Erro</h1>
          <p className="text-muted-foreground">
            Monitore e analise erros da aplicação
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleCleanOldLogs} 
            variant="outline" 
            size="sm"
            disabled={cleaningLogs}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Antigos
          </Button>
          <Button onClick={handleRefresh} size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Não Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorStats.naoResolvidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{errorStats.resolvidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorStats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.today}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={nivelFilter} onValueChange={setNivelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resolvidoFilter} onValueChange={setResolvidoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="nao-resolvido">Não Resolvidos</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm('');
                setNivelFilter('all');
                setResolvidoFilter('all');
                setSelectedType('all');
              }}
              variant="outline"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="all">Todos ({errorStats.total})</TabsTrigger>
          {errorTypes.slice(0, 5).map(type => (
            <TabsTrigger key={type} value={type}>
              {type.replace('_', ' ')} ({errorStats.byType[type]})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhum erro encontrado</p>
                <p className="text-muted-foreground">
                  {selectedType === 'all' 
                    ? 'Não há logs de erro registrados.' 
                    : `Não há erros do tipo "${selectedType}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id} className={log.resolvido ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={getErrorTypeColor(log.categoria || 'outros')}>
                            {log.categoria?.replace('_', ' ') || 'outros'}
                          </Badge>
                          {log.nivel && (
                            <Badge variant={log.nivel === 'critical' || log.nivel === 'error' ? 'destructive' : 'outline'}>
                              {log.nivel}
                            </Badge>
                          )}
                          {log.resolvido && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolvido
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{log.titulo}</CardTitle>
                        <CardDescription className="mt-1">
                          {log.descricao}
                        </CardDescription>
                        <div className="mt-2 space-y-1">
                          {log.pagina && (
                            <CardDescription>
                              <span className="font-medium">Página:</span> {log.pagina}
                            </CardDescription>
                          )}
                          {log.data_ocorrencia && (
                            <CardDescription>
                              <span className="font-medium">Ocorrência:</span> {format(new Date(log.data_ocorrencia), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </CardDescription>
                          )}
                          {log.resolvido_em && (
                            <CardDescription>
                              <span className="font-medium">Resolvido em:</span> {format(new Date(log.resolvido_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-muted-foreground text-right">
                          {log.criado_em && format(new Date(log.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                        {log.id && (
                          <Button
                            size="sm"
                            variant={log.resolvido ? "outline" : "default"}
                            onClick={() => {
                              if (log.resolvido) {
                                markAsUnresolvedMutation.mutate(log.id!);
                              } else {
                                markAsResolvedMutation.mutate(log.id!);
                              }
                            }}
                            disabled={markAsResolvedMutation.isPending || markAsUnresolvedMutation.isPending}
                          >
                            {log.resolvido ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reabrir
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Resolver
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {log.dados_extra && Object.keys(log.dados_extra).length > 0 && (
                    <CardContent className="pt-0">
                      <details className="bg-muted p-3 rounded text-sm">
                        <summary className="cursor-pointer font-medium mb-2">
                          Dados Extras ({Object.keys(log.dados_extra).length} campos)
                        </summary>
                        <pre className="whitespace-pre-wrap break-words text-xs mt-2">
                          {JSON.stringify(log.dados_extra, null, 2)}
                        </pre>
                      </details>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorLogsManagement;