import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, Package, Phone, Mail, Calendar, User, 
  FileText, Truck, Scale, DollarSign, Clock, Hash,
  Route, CreditCard, Loader2
} from 'lucide-react';
import { MappedQuote } from '@/utils/cotacaoMapper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { backendService } from '@/services/api/backendService';
import { toast } from 'sonner';

interface CotacaoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacao: MappedQuote | null;
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'analise': 'Em Análise',
    'proposta_enviada': 'Proposta Enviada',
    'aprovada': 'Aprovada',
    'rejeitada': 'Rejeitada',
    'cancelada': 'Cancelada',
    'pendente': 'Pendente',
    'Pendente': 'Pendente',
  };
  return labels[status] || 'Pendente';
};

// formatCurrency imported from @/lib/formatters
import { formatCurrency } from '@/lib/formatters';

const formatNumber = (value: number | string | undefined) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (!numValue || isNaN(numValue)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export const CotacaoDetailsModal = ({ 
  open, 
  onOpenChange, 
  cotacao 
}: CotacaoDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [detalhes, setDetalhes] = useState<any>(null);

  const loadDetalhes = useCallback(async () => {
    const cotacaoAny = cotacao as any;
    if (!cotacaoAny?.idOrcamento && !cotacao?.id) return;

    try {
      setIsLoading(true);
      const idOrcamento = cotacaoAny.idOrcamento || cotacao?.id;
      const response = await backendService.buscarDetalhesCotacao(Number(idOrcamento));
      
      if (response.success && response.data) {
        setDetalhes(response.data);
      } else {
        console.warn('Usando dados básicos:', response.error);
        setDetalhes(null);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes da cotação');
      setDetalhes(null);
    } finally {
      setIsLoading(false);
    }
  }, [cotacao]);

  useEffect(() => {
    if (open && cotacao) {
      loadDetalhes();
    } else {
      setDetalhes(null);
    }
  }, [open, cotacao, loadDetalhes]);

  if (!cotacao) return null;

  const createdDate = cotacao.criadoEm ? new Date(cotacao.criadoEm) : new Date();

  const LoadingSkeleton = () => (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border border-border/60">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-5 pb-0 border-b border-border/40">
          <div className="flex items-center justify-between pb-4">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Detalhes da Cotação
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getStatusLabel(cotacao.status)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                #{cotacao.id?.slice(0, 8) || detalhes?.nroOrcamento || 'N/A'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="p-5 space-y-4">
              {/* Informações Gerais */}
              <Card className="border border-border/60">
                <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <InfoItem label="Data de Criação" value={format(createdDate, "dd/MM/yyyy HH:mm", { locale: ptBR })} />
                    <InfoItem label="Nº Orçamento" value={detalhes?.nroOrcamento || '-'} />
                    <InfoItem label="Validade" value={detalhes?.validade ? `${detalhes.validade} dias` : '-'} />
                    <InfoItem label="Dias Pagamento" value={detalhes?.ddPgto || '-'} />
                    {detalhes?.km && <InfoItem label="Distância" value={`${detalhes.km} km`} />}
                    {detalhes?.rota && <InfoItem label="Rota" value={detalhes.rota} />}
                  </div>
                </CardContent>
              </Card>

              {/* Remetente */}
              <Card className="border border-border/60">
                <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Remetente
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <InfoItem label="Nome" value={detalhes?.nomeRemetente || cotacao.remetente.nome} />
                  </div>
                  <Separator className="bg-border/40" />
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {detalhes?.cidadeOrigem || cotacao.remetente.endereco.cidade}, {detalhes?.ufOrigem || cotacao.remetente.endereco.estado}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinatário */}
              <Card className="border border-border/60">
                <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Destinatário
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-4">
                    <InfoItem label="Nome" value={detalhes?.nomeDestinatario || cotacao.destinatario.nome} />
                  </div>
                  <Separator className="bg-border/40" />
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {detalhes?.cidadeDestino || cotacao.destinatario.endereco.cidade}, {detalhes?.ufDestino || cotacao.destinatario.endereco.estado}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tomador/Cliente */}
              {detalhes?.nomeCliente && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Tomador / Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Nome" value={detalhes.nomeCliente} />
                      <InfoItem label="Solicitante" value={detalhes.solicitante || detalhes.contato || '-'} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contato */}
              {(cotacao.contato.nome !== 'N/A' || cotacao.contato.email !== 'N/A' || cotacao.contato.telefone) && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    <div className="flex flex-wrap gap-4">
                      {cotacao.contato.nome !== 'N/A' && (
                        <InfoItem label="Nome" value={cotacao.contato.nome} />
                      )}
                      {cotacao.contato.email !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{cotacao.contato.email}</span>
                        </div>
                      )}
                      {cotacao.contato.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{cotacao.contato.telefone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Itens da Cotação */}
              {detalhes?.itens && detalhes.itens.length > 0 && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Itens da Cotação ({detalhes.itens.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {detalhes.itens.map((item: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <InfoItem label="Descrição" value={item.obs || `Item ${index + 1}`} />
                            <InfoItem label="Qtd/Vol" value={item.vol || '-'} />
                            <InfoItem label="Peso" value={item.peso ? `${formatNumber(item.peso)} kg` : '-'} />
                            <InfoItem label="Valor Mercadoria" value={formatCurrency(item.vlrMerc)} />
                            {(item.a || item.b || item.c) && (
                              <InfoItem 
                                label="Dimensões (A x L x P)" 
                                value={`${item.a || 0} x ${item.b || 0} x ${item.c || 0} cm`} 
                              />
                            )}
                            {item.m3 > 0 && <InfoItem label="M³" value={formatNumber(item.m3)} />}
                            {item.pesoCubado > 0 && <InfoItem label="Peso Cubado" value={`${formatNumber(item.pesoCubado)} kg`} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Valores e Taxas */}
              {detalhes && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Valores e Taxas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {detalhes.fretePeso > 0 && <InfoItem label="Frete Peso" value={formatCurrency(detalhes.fretePeso)} />}
                      {detalhes.freteValor > 0 && <InfoItem label="Frete Valor" value={formatCurrency(detalhes.freteValor)} />}
                      {detalhes.secat > 0 && <InfoItem label="SECAT" value={formatCurrency(detalhes.secat)} />}
                      {detalhes.pedagio > 0 && <InfoItem label="Pedágio" value={formatCurrency(detalhes.pedagio)} />}
                      {detalhes.gris > 0 && <InfoItem label="GRIS" value={formatCurrency(detalhes.gris)} />}
                      {detalhes.coleta > 0 && <InfoItem label="Coleta" value={formatCurrency(detalhes.coleta)} />}
                      {detalhes.entrega > 0 && <InfoItem label="Entrega" value={formatCurrency(detalhes.entrega)} />}
                      {detalhes.outros > 0 && <InfoItem label="Outros" value={formatCurrency(detalhes.outros)} />}
                      {detalhes.tde > 0 && <InfoItem label="TDE" value={formatCurrency(detalhes.tde)} />}
                      {detalhes.tas > 0 && <InfoItem label="TAS" value={formatCurrency(detalhes.tas)} />}
                      {detalhes.agenda > 0 && <InfoItem label="Agenda" value={formatCurrency(detalhes.agenda)} />}
                      {detalhes.restricao > 0 && <InfoItem label="Restrição" value={formatCurrency(detalhes.restricao)} />}
                      {detalhes.tda > 0 && <InfoItem label="TDA" value={formatCurrency(detalhes.tda)} />}
                      {detalhes.vlrDespacho > 0 && <InfoItem label="Despacho" value={formatCurrency(detalhes.vlrDespacho)} />}
                    </div>
                    
                    {(detalhes.percICM > 0 || detalhes.descontoPerc > 0 || detalhes.descontoValor > 0) && (
                      <>
                        <Separator className="my-4 bg-border/40" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {detalhes.percICM > 0 && <InfoItem label="ICMS (%)" value={`${formatNumber(detalhes.percICM)}%`} />}
                          {detalhes.descontoPerc > 0 && <InfoItem label="Desconto (%)" value={`${formatNumber(detalhes.descontoPerc)}%`} />}
                          {detalhes.descontoValor > 0 && <InfoItem label="Desconto (R$)" value={formatCurrency(detalhes.descontoValor)} />}
                        </div>
                      </>
                    )}

                    <Separator className="my-4 bg-border/40" />
                    <div className="flex justify-end">
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">Valor Total:</span>
                        <p className="text-xl font-semibold">{formatCurrency(detalhes.vlrTotal || detalhes.valorTotal)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabela de Preço */}
              {detalhes?.nomeTabela && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Tabela de Preço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    <InfoItem label="Tabela" value={detalhes.nomeTabela} />
                  </CardContent>
                </Card>
              )}

              {/* Observações */}
              {(detalhes?.obs || detalhes?.obsInterna || cotacao.observacoes) && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {(detalhes?.obs || cotacao.observacoes) && (
                      <div>
                        <span className="text-xs text-muted-foreground">Observações:</span>
                        <p className="text-sm whitespace-pre-wrap mt-1">
                          {detalhes?.obs || cotacao.observacoes}
                        </p>
                      </div>
                    )}
                    {detalhes?.obsInterna && (
                      <div>
                        <span className="text-xs text-muted-foreground">Observações Internas:</span>
                        <p className="text-sm whitespace-pre-wrap mt-1">
                          {detalhes.obsInterna}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

interface InfoItemProps {
  label: string;
  value: string | number | undefined;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div>
    <span className="text-xs text-muted-foreground">{label}:</span>
    <p className="font-medium">{value || '-'}</p>
  </div>
);
