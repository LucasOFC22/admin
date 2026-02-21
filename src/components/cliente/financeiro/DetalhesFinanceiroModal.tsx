import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  CreditCard, 
  Calendar,
  DollarSign,
  User,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { formatDateOnly } from '@/utils/dateFormatters';

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

interface DetalhesFinanceiroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frete: Frete | null;
  onDownloadFatura: (frete: Frete) => void;
  onDownloadBoleto: (frete: Frete) => void;
}

export const DetalhesFinanceiroModal = ({ 
  open, 
  onOpenChange, 
  frete,
  onDownloadFatura,
  onDownloadBoleto
}: DetalhesFinanceiroModalProps) => {
  if (!frete) return null;

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return formatDateOnly(date);
  };

  const formatCtes = (ctes?: string) => {
    if (!ctes) return '-';
    const cteList = ctes.split('/').filter(c => c.trim());
    return cteList.join(', ');
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      Liquidado: { 
        label: 'Liquidado', 
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200' 
      },
      Pendente: { 
        label: 'Pendente', 
        icon: Clock,
        className: 'bg-blue-100 text-blue-700 border-blue-200' 
      },
      Vencido: { 
        label: 'Vencido', 
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200' 
      },
      'Em Aberto': { 
        label: 'Em Aberto', 
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200' 
      }
    };

    const statusInfo = statusMap[status || 'Pendente'] || statusMap.Pendente;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant="outline" className={statusInfo.className}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const DetailRow = ({ 
    label, 
    value, 
    icon: Icon 
  }: { 
    label: string; 
    value: string | number; 
    icon?: any 
  }) => (
    <div className="flex items-start justify-between py-2.5 gap-4">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-2xl max-h-[95vh] p-0 gap-0 flex flex-col">
        {/* Header Fixo */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl mb-2">
                Detalhes do Título
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Doc: <span className="font-semibold text-foreground">{frete.doc}</span>
                </span>
                {getStatusBadge(frete.status)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full flex-shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4 sm:space-y-5">
            {/* Informações do Cliente */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-0 divide-y">
                <DetailRow label="Nome" value={frete.cliente} />
                <DetailRow label="Documento" value={frete.docCliente} />
              </div>
            </div>

            {/* CTEs Vinculados */}
            {frete.ctes && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CTEs Vinculados
                </h3>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm break-words">{formatCtes(frete.ctes)}</p>
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-0 divide-y">
                <DetailRow label="Data de Emissão" value={formatDate(frete.emissao)} />
                <DetailRow label="Data de Vencimento" value={formatDate(frete.vencimento)} />
                {frete.dataPagamento && (
                  <DetailRow label="Data de Pagamento" value={formatDate(frete.dataPagamento)} />
                )}
              </div>
            </div>

            {/* Valores Financeiros */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores Financeiros
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 space-y-0 divide-y">
                <DetailRow label="Valor do Título" value={formatCurrency(frete.valorTitulo)} />
                {frete.valorPago > 0 && (
                  <DetailRow label="Valor Pago" value={formatCurrency(frete.valorPago)} />
                )}
                {frete.juros > 0 && (
                  <DetailRow label="Juros" value={formatCurrency(frete.juros)} />
                )}
                {frete.saldo > 0 && (
                  <DetailRow label="Saldo em Aberto" value={formatCurrency(frete.saldo)} />
                )}
              </div>
            </div>

            {/* Informações do Boleto */}
            {frete.idBoleto !== 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informações do Boleto
                </h3>
                <div className="bg-muted/50 rounded-lg p-3 space-y-0 divide-y">
                  <DetailRow label="ID do Boleto" value={frete.idBoleto} />
                  {frete.boleto && (
                    <DetailRow label="Status do Boleto" value={frete.boleto} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixo com Ações */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 flex-shrink-0">
          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full"
              onClick={() => onDownloadFatura(frete)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Imprimir Fatura
            </Button>
            {frete.idBoleto !== 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onDownloadBoleto(frete)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Imprimir Boleto
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
