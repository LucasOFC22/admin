import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, AlertTriangle, Bug, XCircle, RefreshCw, Trash2, Eye, Shield, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import PageHeader from '@/components/admin/PageHeader';
import { getErrorLogs, markErrorAsResolved, deleteErrorLog, type ErrorLogDB } from '@/services/errorLogsService';
import { toast } from '@/lib/toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { motion } from 'framer-motion';

import { useActivityLogger } from '@/hooks/useActivityLogger';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'critical' | 'info';
  message: string;
  stack?: string;
  component?: string;
  page?: string;
  extraData?: any;
  resolved: boolean;
  resolvedAt?: Date;
}

const ErrorLogs = () => {
  const { canAccessPage, isLoadingCargoPermissions } = usePermissionGuard();
  const { logActivity } = useActivityLogger();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mapErrorLogFromDB = (dbLog: ErrorLogDB): ErrorLog => ({
    id: dbLog.id,
    timestamp: new Date(dbLog.data_ocorrencia),
    level: dbLog.nivel as 'error' | 'warning' | 'critical' | 'info',
    message: dbLog.titulo,
    stack: dbLog.descricao,
    component: dbLog.categoria,
    page: dbLog.pagina,
    extraData: dbLog.dados_extra,
    resolved: dbLog.resolvido,
    resolvedAt: dbLog.resolvido_em ? new Date(dbLog.resolvido_em) : undefined,
  });

  useEffect(() => {
    fetchErrorLogs();
    
    logActivity({
      acao: 'pagina_visualizada',
      modulo: 'error-logs',
      detalhes: { pagina: 'logs_erro' }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchErrorLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getErrorLogs();
      const mappedLogs = data.map(mapErrorLogFromDB);
      setErrorLogs(mappedLogs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de erros');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Bug className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const filteredErrors = errorLogs.filter((error) => {
    const matchesSearch =
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.component?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.page?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || error.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleViewDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setShowDetailDialog(true);
    
    logActivity({
      acao: 'erro_detalhes_visualizados',
      modulo: 'error-logs',
      detalhes: {
        erro_id: error.id,
        erro_mensagem: error.message,
        nivel: error.level,
        pagina: error.page
      }
    });
  };

  const handleMarkResolved = async (id: string) => {
    try {
      await markErrorAsResolved(id);
      setErrorLogs((prev) =>
        prev.map((error) =>
          error.id === id ? { ...error, resolved: true, resolvedAt: new Date() } : error
        )
      );
      
      await logActivity({
        acao: 'erro_marcado_resolvido',
        modulo: 'error-logs',
        detalhes: { erro_id: id }
      });
      
      toast.success('Erro marcado como resolvido');
    } catch (error) {
      console.error('Erro ao marcar como resolvido:', error);
      toast.error('Erro ao marcar como resolvido');
    }
  };

  const handleDeleteError = async (id: string) => {
    try {
      await deleteErrorLog(id);
      setErrorLogs((prev) => prev.filter((error) => error.id !== id));
      
      await logActivity({
        acao: 'erro_excluido',
        modulo: 'error-logs',
        detalhes: { erro_id: id }
      });
      
      toast.success('Erro deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar registro');
    }
  };

  const handleRefresh = () => {
    fetchErrorLogs();
    toast.success('Logs atualizados');
  };

  const unresolvedCount = errorLogs.filter((e) => !e.resolved).length;
  const criticalCount = errorLogs.filter((e) => e.level === 'critical' && !e.resolved).length;

  const hasAccess = canAccessPage('erros');
  
  if (isLoadingCargoPermissions) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-12 w-12 animate-spin text-primary opacity-50" />
        </div>
      </>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Acesso Negado</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Você não tem permissão para acessar esta página. Entre em contato com o administrador.
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Logs de Erros"
          subtitle="Monitore e gerencie erros da aplicação em tempo real"
          icon={Bug}
          actions={
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          }
        />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 sm:p-6 space-y-4 sm:space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
                    <Bug className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{errorLogs.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Registros no sistema</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Não Resolvidos</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">{unresolvedCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Aguardando resolução</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive sm:col-span-2 lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                    <XCircle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-destructive">{criticalCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requer atenção imediata</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por mensagem, categoria ou página..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedLevel === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLevel('all')}
                      className="flex-1 sm:flex-none"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={selectedLevel === 'critical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLevel('critical')}
                      className="flex-1 sm:flex-none"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Críticos
                    </Button>
                    <Button
                      variant={selectedLevel === 'error' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLevel('error')}
                      className="flex-1 sm:flex-none"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Erros
                    </Button>
                    <Button
                      variant={selectedLevel === 'warning' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLevel('warning')}
                      className="flex-1 sm:flex-none"
                    >
                      <Bug className="h-4 w-4 mr-1" />
                      Avisos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Error List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Bug className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Registro de Erros
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {filteredErrors.length} erro(s) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    {isLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                        <p className="text-sm sm:text-base">Carregando logs...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-4">
                        {filteredErrors.map((error, index) => (
                          <motion.div
                            key={error.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <Card
                              className={cn(
                                'transition-all border-l-4',
                                error.level === 'critical' && 'border-l-destructive',
                                error.level === 'error' && 'border-l-orange-500',
                                error.level === 'warning' && 'border-l-yellow-500',
                                error.level === 'info' && 'border-l-primary',
                                error.resolved && 'opacity-60'
                              )}
                            >
                              <CardContent className="p-3 sm:p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2 sm:gap-3">
                                    <div
                                      className={cn(
                                        'p-2 rounded-full shrink-0',
                                        error.level === 'critical' && 'bg-destructive/10',
                                        error.level === 'error' && 'bg-orange-100',
                                        error.level === 'warning' && 'bg-yellow-100',
                                        error.level === 'info' && 'bg-primary/10'
                                      )}
                                    >
                                      <div className={cn(
                                        error.level === 'critical' && 'text-destructive',
                                        error.level === 'error' && 'text-orange-600',
                                        error.level === 'warning' && 'text-yellow-600',
                                        error.level === 'info' && 'text-primary'
                                      )}>
                                        {getLevelIcon(error.level)}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                        <Badge 
                                          variant={error.resolved ? 'secondary' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {error.level.toUpperCase()}
                                        </Badge>
                                        {error.component && (
                                          <Badge variant="outline" className="text-xs">
                                            {error.component}
                                          </Badge>
                                        )}
                                        {error.page && (
                                          <Badge variant="outline" className="text-xs">
                                            📄 {error.page}
                                          </Badge>
                                        )}
                                        {error.resolved && (
                                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                            ✓ Resolvido
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <p className="text-sm sm:text-base font-medium break-words">{error.message}</p>
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                                        <span>🕐 {error.timestamp.toLocaleString('pt-BR')}</span>
                                        {error.resolvedAt && (
                                          <span className="text-green-600">
                                            ✓ Resolvido: {error.resolvedAt.toLocaleString('pt-BR')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDetails(error)}
                                      className="flex-1 sm:flex-none"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Ver
                                    </Button>
                                    {!error.resolved && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMarkResolved(error.id)}
                                        className="flex-1 sm:flex-none"
                                      >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Resolver
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteError(error.id)}
                                      className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Deletar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                        {filteredErrors.length === 0 && !isLoading && (
                          <div className="text-center py-12 text-muted-foreground">
                            <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-base sm:text-lg font-medium">Nenhum erro encontrado</p>
                            <p className="text-xs sm:text-sm mt-2">Tudo está funcionando perfeitamente! 🎉</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </ScrollArea>
        </div>

        {/* Modal de Detalhes - Totalmente Responsivo */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b">
              <DialogTitle className="text-base sm:text-lg">Detalhes do Erro</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Informações detalhadas sobre o erro
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)]">
              {selectedError && (
                <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold mb-2">Mensagem</h4>
                    <p className="text-xs sm:text-sm break-words">{selectedError.message}</p>
                  </div>
                  
                  {selectedError.stack && (
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Stack Trace</h4>
                      <ScrollArea className="h-[200px] sm:h-[300px]">
                        <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap break-all">
                          {selectedError.stack}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Nível</h4>
                      <Badge variant="destructive" className="text-xs">{selectedError.level.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Status</h4>
                      <Badge variant={selectedError.resolved ? 'secondary' : 'destructive'} className="text-xs">
                        {selectedError.resolved ? 'Resolvido' : 'Não Resolvido'}
                      </Badge>
                    </div>
                    {selectedError.component && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold mb-2">Categoria</h4>
                        <p className="text-xs sm:text-sm break-words">{selectedError.component}</p>
                      </div>
                    )}
                    {selectedError.page && (
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold mb-2">Página</h4>
                        <p className="text-xs sm:text-sm break-words">{selectedError.page}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Timestamp</h4>
                      <p className="text-xs sm:text-sm">
                        {selectedError.timestamp.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  {selectedError.extraData && (
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold mb-2">Dados Extras</h4>
                      <ScrollArea className="h-[150px] sm:h-[200px]">
                        <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedError.extraData, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ErrorLogs;
