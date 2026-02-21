import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Campanha, CampanhaContato, useCampanhas } from '@/hooks/useCampanhas';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, RotateCcw, BarChart3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CampanhaReportCharts from './CampanhaReportCharts';

interface CampanhaDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanha: Campanha;
  onRefresh: () => void;
}

const CampanhaDetalhesModal = ({ open, onOpenChange, campanha, onRefresh }: CampanhaDetalhesModalProps) => {
  const { getContatos, reenviarContato } = useCampanhas();
  const [contatos, setContatos] = useState<CampanhaContato[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [reenviandoTodos, setReenviandoTodos] = useState(false);

  const progress = campanha.total_contatos > 0 
    ? Math.round((campanha.enviados / campanha.total_contatos) * 100) 
    : 0;

  const contatosComErro = contatos.filter(c => c.status === 'erro' || c.status === 'falha');
  const contatosEnviados = contatos.filter(c => ['enviado', 'entregue', 'lido'].includes(c.status));
  const contatosPendentes = contatos.filter(c => c.status === 'pendente' || c.status === 'enviando');

  const carregarContatos = async () => {
    setLoading(true);
    const data = await getContatos(campanha.id);
    setContatos(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      carregarContatos();
    }
  }, [open, campanha.id]);

  const handleReenviarContato = async (contatoId: string) => {
    setReenviandoId(contatoId);
    const success = await reenviarContato(campanha.id, contatoId);
    if (success) {
      await carregarContatos();
      onRefresh();
    }
    setReenviandoId(null);
  };

  const handleReenviarTodos = async () => {
    if (contatosComErro.length === 0) return;
    
    setReenviandoTodos(true);
    let sucessos = 0;
    let falhas = 0;
    
    for (const contato of contatosComErro) {
      const success = await reenviarContato(campanha.id, contato.id);
      if (success) {
        sucessos++;
      } else {
        falhas++;
      }
    }
    
    await carregarContatos();
    onRefresh();
    setReenviandoTodos(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
      case 'entregue':
      case 'lido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
      case 'falha':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'enviando':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pendente: 'secondary',
      enviando: 'default',
      enviado: 'default',
      entregue: 'default',
      lido: 'default',
      erro: 'destructive',
      falha: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="break-all">{campanha.nome}</span>
            <Badge variant="outline">{campanha.status}</Badge>
            {campanha.agendado_para && campanha.status === 'rascunho' && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                Agendada: {format(new Date(campanha.agendado_para), "dd/MM HH:mm", { locale: ptBR })}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="relatorio" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Relatório
            </TabsTrigger>
            <TabsTrigger value="erros" className="flex items-center gap-1">
              Erros
              {campanha.erros > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {campanha.erros}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="flex-1 overflow-auto space-y-4 sm:space-y-6 mt-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Template:</span>
                <p className="font-medium">{campanha.template_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Conexão:</span>
                <p className="font-medium">{campanha.conexao?.nome || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Criado em:</span>
                <p className="font-medium">
                  {format(new Date(campanha.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              {campanha.agendado_para && (
                <div>
                  <span className="text-muted-foreground">Agendado para:</span>
                  <p className="font-medium text-blue-600">
                    {format(new Date(campanha.agendado_para), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              {campanha.iniciado_em && (
                <div>
                  <span className="text-muted-foreground">Iniciado em:</span>
                  <p className="font-medium">
                    {format(new Date(campanha.iniciado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do envio</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 text-center">
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold">{campanha.total_contatos}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{campanha.enviados}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Enviados</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{campanha.entregues}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Entregues</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{campanha.lidos}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Lidos</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{campanha.erros}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Erros</div>
              </div>
            </div>

            {campanha.descricao && (
              <div>
                <span className="text-sm text-muted-foreground">Descrição:</span>
                <p className="text-sm mt-1">{campanha.descricao}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="relatorio" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <CampanhaReportCharts campanha={campanha} contatos={contatos} />
            )}
          </TabsContent>

          <TabsContent value="erros" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Contatos com Erro</span>
                <Badge variant="destructive">{contatosComErro.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {contatosComErro.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReenviarTodos}
                    disabled={loading || reenviandoTodos || reenviandoId !== null}
                    className="text-xs"
                  >
                    {reenviandoTodos ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3 mr-1" />
                    )}
                    Reenviar Todos ({contatosComErro.length})
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={carregarContatos} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : contatosComErro.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
                <p>Nenhum erro encontrado!</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  <TooltipProvider>
                    {contatosComErro.map(contato => (
                      <div key={contato.id} className="border rounded-lg p-3 bg-red-500/5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="font-medium truncate">{contato.nome || 'Sem nome'}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{contato.telefone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(contato.status)}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleReenviarContato(contato.id)}
                                  disabled={reenviandoId === contato.id || reenviandoTodos}
                                >
                                  {reenviandoId === contato.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reenviar mensagem</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {contato.erro_detalhes && (
                          <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-700 dark:text-red-400">
                            <span className="font-medium">Erro:</span> {contato.erro_detalhes}
                          </div>
                        )}
                      </div>
                    ))}
                  </TooltipProvider>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="contatos" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{contatosPendentes.length} pendentes</Badge>
                <Badge variant="default">{contatosEnviados.length} enviados</Badge>
                <Badge variant="destructive">{contatosComErro.length} erros</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={carregarContatos} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : contatos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <p>Nenhum contato encontrado</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {contatos.slice(0, 100).map(contato => (
                    <div key={contato.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        {getStatusIcon(contato.status)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{contato.nome || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{contato.telefone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contato.status)}
                      </div>
                    </div>
                  ))}
                  {contatos.length > 100 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Mostrando 100 de {contatos.length} contatos
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CampanhaDetalhesModal;
