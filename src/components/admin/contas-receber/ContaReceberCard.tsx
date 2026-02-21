import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, FileText, Printer, Copy, Info, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';

interface ContaReceber {
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
  contaRecebimento?: string;
  nossonumero?: string;
  boleto?: string;
  idBoleto?: number;
  status: string;
  linhadigitavel?: string;
  ctes?: string;
  idTitulo: number;
}

interface ContaReceberCardProps {
  conta: ContaReceber;
  onImprimirFatura: (conta: ContaReceber) => void;
  onImprimirBoleto: (conta: ContaReceber) => void;
  onCopiarLinhaDigitavel: (conta: ContaReceber) => void;
  onVerDetalhes: (conta: ContaReceber) => void;
  isDownloading?: boolean;
  downloadType?: 'fatura' | 'boleto' | null;
}

export const ContaReceberCard = ({ 
  conta, 
  onImprimirFatura, 
  onImprimirBoleto, 
  onCopiarLinhaDigitavel,
  onVerDetalhes,
  isDownloading = false,
  downloadType = null
}: ContaReceberCardProps) => {
  // formatCurrency imported from @/lib/formatters

  // formatDate imported from @/utils/dateFormatters

  const formatCTEs = (ctes?: string) => {
    if (!ctes) return '-';
    const ctesList = ctes.split('/').map(c => c.trim()).filter(c => c);
    if (ctesList.length === 0) return '-';
    return ctesList.join(', ');
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'liquidado':
      case 'pago':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Liquidado
          </Badge>
        );
      case 'aberto':
      case 'pendente':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Aberto
          </Badge>
        );
      case 'atrasado':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Atrasado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-lg text-primary">
              Fatura #{conta.doc}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {conta.cliente}
            </div>
          </div>
          {getStatusBadge(conta.status)}
        </div>

        {/* CTEs */}
        {conta.ctes && (
          <div className="bg-muted/50 p-2 rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-1">CTEs:</div>
            <div className="text-xs break-words">{formatCTEs(conta.ctes)}</div>
          </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Emissão</div>
            <div className="font-medium">{formatDate(conta.emissao)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vencimento</div>
            <div className="font-medium">{formatDate(conta.vencimento)}</div>
          </div>
          {conta.dataPagamento && (
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Pagamento</div>
              <div className="font-medium">{formatDate(conta.dataPagamento)}</div>
            </div>
          )}
        </div>

        {/* Valores */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor Total:</span>
            <span className="font-bold text-lg text-primary">
              {formatCurrency(conta.valorTitulo)}
            </span>
          </div>
          {conta.valorPago !== undefined && conta.valorPago > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Pago:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(conta.valorPago)}
              </span>
            </div>
          )}
          {conta.saldo > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Em Aberto:</span>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(conta.saldo)}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onVerDetalhes(conta)}>
                <Info className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onImprimirFatura(conta)} disabled={isDownloading && downloadType === 'fatura'}>
                {isDownloading && downloadType === 'fatura' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {isDownloading && downloadType === 'fatura' ? 'Baixando...' : 'Imprimir Fatura'}
              </DropdownMenuItem>
              {(conta.idBoleto !== undefined && conta.idBoleto !== null && conta.idBoleto !== 0) && (
                <>
                  <DropdownMenuItem onClick={() => onImprimirBoleto(conta)} disabled={isDownloading && downloadType === 'boleto'}>
                    {isDownloading && downloadType === 'boleto' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading && downloadType === 'boleto' ? 'Baixando...' : 'Imprimir Boleto'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopiarLinhaDigitavel(conta)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Linha Digitável
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};
