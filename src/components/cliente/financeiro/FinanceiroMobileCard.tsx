import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Eye, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { formatDateOnly } from '@/utils/dateFormatters';
import { motion } from 'framer-motion';

interface Frete {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento: string;
  valorPago: number;
  juros: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  boleto: string;
  idBoleto: number;
  status: string;
  ctes: string;
  idTitulo: number;
}

interface FinanceiroMobileCardProps {
  frete: Frete;
  onViewDetails: (frete: Frete) => void;
  onDownloadFatura: (frete: Frete) => void;
  onDownloadBoleto: (frete: Frete) => void;
  index: number;
}

export const FinanceiroMobileCard = ({
  frete,
  onViewDetails,
  onDownloadFatura,
  onDownloadBoleto,
  index
}: FinanceiroMobileCardProps) => {
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return formatDateOnly(date);
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      Liquidado: { label: 'Liquidado', className: 'bg-green-100 text-green-700 border-green-200' },
      Pendente: { label: 'Pendente', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      Vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700 border-red-200' },
      'Em Aberto': { label: 'Em Aberto', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    };

    const statusInfo = statusMap[status || 'Pendente'] || statusMap.Pendente;
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
        onClick={() => onViewDetails(frete)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header com Doc e Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Documento</p>
              <p className="font-semibold text-base truncate">{frete.doc}</p>
            </div>
            {getStatusBadge(frete.status)}
          </div>

          {/* Cliente */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cliente</p>
            <p className="text-sm font-medium line-clamp-2">{frete.cliente}</p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Emissão
              </p>
              <p className="text-sm font-medium">{formatDate(frete.emissao)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Vencimento
              </p>
              <p className="text-sm font-medium">{formatDate(frete.vencimento)}</p>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor Total
              </p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(frete.valorTitulo)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Saldo
              </p>
              <p className="text-sm font-bold text-orange-600">
                {formatCurrency(frete.saldo)}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails(frete)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadFatura(frete)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            {frete.idBoleto !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadBoleto(frete)}
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
