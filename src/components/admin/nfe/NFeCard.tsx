import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, User } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatters';

interface NFeResult {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento?: string;
  valorPago?: number;
  juros?: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  boleto: string;
  idBoleto: number;
  status: string;
  idTitulo: number;
}

interface NFeCardProps {
  result: NFeResult;
}

export const NFeCard = ({ result }: NFeCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // formatDate imported from @/utils/dateFormatters

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'liquidado':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200';
      case 'vencido':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-mono">{result.doc}</CardTitle>
          <Badge variant="outline" className={getStatusColor(result.status)}>
            {result.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{result.cliente}</p>
            <p className="text-xs text-muted-foreground">{result.docCliente}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Emissão:</span>{' '}
            <span>{formatDate(result.emissao)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Vencimento:</span>{' '}
            <span>{formatDate(result.vencimento)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Valor:</span>{' '}
            <span className="font-medium">{formatCurrency(result.valorTitulo)}</span>
          </div>
        </div>

        {result.saldo > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <div className="flex-1 text-sm">
              <span className="text-muted-foreground">Saldo:</span>{' '}
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatCurrency(result.saldo)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
