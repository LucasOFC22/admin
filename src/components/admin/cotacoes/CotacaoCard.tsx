import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, ArrowRight, Eye, Pencil, Printer, Settings, Truck, Clock, DollarSign, Package, User, Building2, Mail } from 'lucide-react';
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
  if (s === 'PENDENTE') return { label: 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' };
  if (s === 'ANALISE' || s === 'EM_ANALISE') return { label: 'Em Análise', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' };
  if (s === 'PROPOSTA_ENVIADA') return { label: 'Enviada', color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400', dotColor: 'bg-indigo-500' };
  if (s === 'APROVADA') return { label: 'Aprovada', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' };
  if (s === 'REJEITADA') return { label: 'Rejeitada', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' };
  if (s === 'CANCELADA') return { label: 'Cancelada', color: 'bg-muted', textColor: 'text-muted-foreground', dotColor: 'bg-muted-foreground' };
  return { label: status || 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' };
};

const formatCurrency = (value: number) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatWeight = (weightNum: number) => {
  if (!weightNum) return '0 kg';
  return `${new Intl.NumberFormat('pt-BR').format(weightNum)} kg`;
};

export default function CotacaoCard({ cotacao, onStatusChange, onEdit, onPrint, onViewDetails, onChangeStatus }: CotacaoCardProps) {
  const statusConfig = getStatusConfig(cotacao.status);
  const createdDate = cotacao.criadoEm ? new Date(cotacao.criadoEm) : new Date();
  const nro = cotacao.nroOrcamento || cotacao.quoteId || '—';

  const originCity = cotacao.originCity && cotacao.originCity !== 'N/A' ? cotacao.originCity : '';
  const originState = cotacao.originState && cotacao.originState !== 'N/A' ? cotacao.originState : '';
  const destCity = cotacao.destCity && cotacao.destCity !== 'N/A' ? cotacao.destCity : '';
  const destState = cotacao.destState && cotacao.destState !== 'N/A' ? cotacao.destState : '';

  const hasRoute = originCity || destCity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 group">
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.color}`} />

        <div className="p-5 pt-4">
          {/* Header: Number + Status + Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                #{nro}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {format(createdDate, "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
              <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Solicitante */}
          <div className="flex items-start gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Solicitante</p>
              <p className="text-sm font-semibold truncate">{cotacao.senderName !== 'N/A' ? cotacao.senderName : '—'}</p>
            </div>
          </div>

          {/* Destinatário */}
          {cotacao.recipientName && cotacao.recipientName !== 'N/A' && (
            <div className="flex items-start gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Destinatário</p>
                <p className="text-sm font-medium truncate">{cotacao.recipientName}</p>
              </div>
            </div>
          )}

          {/* Rota */}
          {hasRoute && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-muted/50">
              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium truncate">
                {originCity ? `${originCity}${originState ? ` (${originState})` : ''}` : '—'}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-xs font-medium truncate">
                {destCity ? `${destCity}${destState ? ` (${destState})` : ''}` : '—'}
              </span>
            </div>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Peso</p>
                <p className="text-sm font-bold">{formatWeight(cotacao.weightNum)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(cotacao.value)}</p>
              </div>
            </div>
          </div>

          {/* Tags: Status interno + Dias */}
          {(cotacao.statusInterno || cotacao.dias > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {cotacao.statusInterno && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  {cotacao.statusInterno}
                </span>
              )}
              {cotacao.dias > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {cotacao.dias}d
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex gap-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(cotacao)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Editar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onPrint(cotacao.id)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Imprimir</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onViewDetails(cotacao)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Detalhes</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onChangeStatus(cotacao)} className="h-7 text-xs gap-1.5">
                    <Settings className="h-3 w-3" />
                    Status
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Alterar Status</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
