import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, ArrowRight, Eye, Pencil, Printer, DollarSign, Weight, Calendar, Hash } from 'lucide-react';
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

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    'Pendente': { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    'PENDENTE': { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    'pendente': { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    'analise': { label: 'Análise', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    'proposta_enviada': { label: 'Enviada', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
    'aprovada': { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    'rejeitada': { label: 'Rejeitada', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    'cancelada': { label: 'Cancelada', className: 'bg-muted text-muted-foreground border-border' },
  };
  return map[status] || map['Pendente'];
};

const formatCurrency = (value: number) => {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatWeight = (weight: string) => {
  if (!weight || weight === 'N/A') return null;
  const num = parseFloat(weight.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (isNaN(num)) return weight;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.', ',')}t`;
  return `${num}kg`;
};

export default function CotacaoCard({ cotacao, onEdit, onPrint, onViewDetails }: CotacaoCardProps) {
  const statusBadge = getStatusBadge(cotacao.status || 'Pendente');
  const createdDate = cotacao.criadoEm ? new Date(cotacao.criadoEm) : new Date();
  const nroOrcamento = (cotacao as any).nroOrcamento || (cotacao as any).quoteId || cotacao.id?.slice(0, 6);
  const formattedValue = formatCurrency(cotacao.value);
  const formattedWeight = formatWeight(cotacao.weight);

  // Extract city only (without state)
  const originCity = cotacao.remetente?.endereco?.cidade !== 'N/A' 
    ? cotacao.remetente.endereco.cidade 
    : cotacao.origin?.split(',')[0]?.trim();
  const destCity = cotacao.destinatario?.endereco?.cidade !== 'N/A'
    ? cotacao.destinatario.endereco.cidade
    : cotacao.destination?.split(',')[0]?.trim();
  const destState = cotacao.destinatario?.endereco?.estado !== 'N/A'
    ? cotacao.destinatario.endereco.estado
    : cotacao.destination?.split(',')[1]?.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all duration-150 overflow-hidden">
        {/* Top row: ID + Status + Date */}
        <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-mono font-semibold text-foreground">
              <Hash className="h-3 w-3 text-muted-foreground" />
              {nroOrcamento}
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            {format(createdDate, "dd/MM/yy", { locale: ptBR })}
          </span>
        </div>

        {/* Route: Origin → Destination */}
        <div className="px-3 sm:px-4 pb-2">
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{originCity || '—'}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{destCity || '—'}</span>
            {destState && destState !== 'N/A' && (
              <span className="text-muted-foreground">({destState})</span>
            )}
          </div>
        </div>

        {/* Client name */}
        <div className="px-3 sm:px-4 pb-2">
          <p className="text-[11px] text-muted-foreground truncate">
            {cotacao.senderName !== 'N/A' ? cotacao.senderName : cotacao.remetente?.nome || '—'}
          </p>
        </div>

        {/* Bottom row: metrics + actions */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-muted/30 border-t border-border/30">
          <div className="flex items-center gap-3">
            {formattedWeight && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Weight className="h-3 w-3" />
                {formattedWeight}
              </span>
            )}
            {formattedValue && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                {formattedValue}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onViewDetails(cotacao)} className="h-7 w-7" title="Detalhes">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(cotacao)} className="h-7 w-7" title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onPrint(cotacao.id)} className="h-7 w-7" title="Imprimir">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
