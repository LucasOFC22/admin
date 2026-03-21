import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, ArrowRight, Eye, Pencil, Printer, Settings, Calendar, Truck, Weight as WeightIcon, Clock } from 'lucide-react';
import { MappedQuote } from '@/utils/cotacaoMapper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface CotacaoCardProps {
  cotacao: MappedQuote;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (cotacao: MappedQuote) => void;
  onPrint: (id: string) => void;
  onViewDetails: (cotacao: MappedQuote) => void;
  onChangeStatus: (cotacao: MappedQuote) => void;
}

const getStatusConfig = (status: string) => {
  const s = status?.toUpperCase();
  if (s === 'PENDENTE') return { label: 'Pendente', variant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  if (s === 'ANALISE' || s === 'EM_ANALISE') return { label: 'Em Análise', variant: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  if (s === 'PROPOSTA_ENVIADA') return { label: 'Enviada', variant: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
  if (s === 'APROVADA') return { label: 'Aprovada', variant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (s === 'REJEITADA') return { label: 'Rejeitada', variant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (s === 'CANCELADA') return { label: 'Cancelada', variant: 'bg-muted text-muted-foreground' };
  return { label: status || 'Pendente', variant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
};

const formatCurrency = (value: number) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatWeight = (weightNum: number) => {
  if (!weightNum) return '0 kg';
  if (weightNum >= 1000) {
    return `${new Intl.NumberFormat('pt-BR').format(weightNum)} kg`;
  }
  return `${weightNum} kg`;
};

export default function CotacaoCard({ cotacao, onStatusChange, onEdit, onPrint, onViewDetails, onChangeStatus }: CotacaoCardProps) {
  const statusConfig = getStatusConfig(cotacao.status);
  const createdDate = cotacao.criadoEm ? new Date(cotacao.criadoEm) : new Date();
  const nro = cotacao.nroOrcamento || cotacao.quoteId || '—';

  const originCity = cotacao.originCity && cotacao.originCity !== 'N/A' ? cotacao.originCity : '';
  const destCity = cotacao.destCity && cotacao.destCity !== 'N/A' ? cotacao.destCity : '';
  const destState = cotacao.destState && cotacao.destState !== 'N/A' ? cotacao.destState : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group border border-border/60 bg-card hover:shadow-lg transition-shadow">
        {/* Header */}
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold tracking-tight text-base">
                Orçamento #{nro}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {format(createdDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.variant}`}>
              {statusConfig.label.toUpperCase()}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          {/* Solicitante */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
            <p className="text-sm font-semibold truncate">{cotacao.senderName !== 'N/A' ? cotacao.senderName : '—'}</p>
          </div>

          {/* Origem → Destino */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <p className="text-sm font-medium">{originCity || '—'}</p>
              {cotacao.originState && cotacao.originState !== 'N/A' && (
                <p className="text-xs text-muted-foreground">{cotacao.originState}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destino</p>
              <p className="text-sm font-medium">{destCity || '—'}</p>
              {destState && (
                <p className="text-xs text-muted-foreground">{destState}</p>
              )}
            </div>
          </div>

          {/* Destinatário */}
          {cotacao.recipientName && cotacao.recipientName !== 'N/A' && (
            <div>
              <p className="text-xs text-muted-foreground">Destinatário</p>
              <p className="text-sm font-medium truncate">{cotacao.recipientName}</p>
            </div>
          )}

          {/* Peso + Valor */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="text-sm font-semibold">{formatWeight(cotacao.weightNum)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-sm font-semibold text-primary">{formatCurrency(cotacao.value)}</p>
            </div>
          </div>

          {/* Status interno + Dias */}
          {(cotacao.statusInterno || cotacao.dias > 0) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {cotacao.statusInterno && (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {cotacao.statusInterno}
                </span>
              )}
              {cotacao.dias > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {cotacao.dias} dias
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-2 pt-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onEdit(cotacao)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onPrint(cotacao.id)} className="h-8 w-8">
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onViewDetails(cotacao)} className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Detalhes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onChangeStatus(cotacao)} className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alterar Status</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
