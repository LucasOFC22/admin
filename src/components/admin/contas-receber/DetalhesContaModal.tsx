import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogHeader,
  AdminDialogTitle,
} from '@/components/admin/ui/AdminDialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText, CreditCard } from 'lucide-react';
import { formatDateOnly, formatDate } from '@/utils/dateFormatters';
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

interface DetalhesContaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaReceber | null;
}

export const DetalhesContaModal = ({ open, onOpenChange, conta }: DetalhesContaModalProps) => {
  if (!conta) return null;

  // formatCurrency imported from @/lib/formatters

  // formatDate = formatDateOnly, imported from @/utils/dateFormatters

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

  const DetailRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) => (
    <div className="flex items-start justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-right ml-4">{value}</span>
    </div>
  );

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <AdminDialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <AdminDialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <span>Detalhes da Conta</span>
            {getStatusBadge(conta.status)}
          </AdminDialogTitle>
        </AdminDialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-6">
          {/* Informações da Fatura */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações da Fatura
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-0">
              <DetailRow label="Número da Fatura" value={conta.doc} />
              <DetailRow label="ID do Título" value={conta.idTitulo} />
              <DetailRow label="Status do Pagamento" value={conta.pago === 'S' ? 'Sim' : 'Não'} />
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">Cliente</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-0">
              <DetailRow label="Nome" value={conta.cliente} />
              <DetailRow label="Documento" value={conta.docCliente} />
            </div>
          </div>

          {/* CTEs Vinculados */}
          {conta.ctes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary">CTEs Vinculados</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm break-words">{formatCTEs(conta.ctes)}</p>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">Datas</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-0">
              <DetailRow label="Data de Emissão" value={formatDate(conta.emissao)} />
              <DetailRow label="Data de Vencimento" value={formatDate(conta.vencimento)} />
              {conta.dataPagamento && (
                <DetailRow label="Data de Pagamento" value={formatDate(conta.dataPagamento)} />
              )}
            </div>
          </div>

          {/* Valores Financeiros */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">Valores Financeiros</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-0">
              <DetailRow label="Valor do Título" value={formatCurrency(conta.valorTitulo)} />
              {conta.valorPago !== undefined && conta.valorPago > 0 && (
                <DetailRow label="Valor Pago" value={formatCurrency(conta.valorPago)} />
              )}
              {conta.juros !== undefined && conta.juros > 0 && (
                <DetailRow label="Juros" value={formatCurrency(conta.juros)} />
              )}
              {conta.saldo > 0 && (
                <DetailRow label="Saldo em Aberto" value={formatCurrency(conta.saldo)} />
              )}
            </div>
          </div>

          {/* Informações do Boleto */}
          {(conta.idBoleto !== undefined && conta.idBoleto !== null && conta.idBoleto !== 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Informações do Boleto
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-0">
                <DetailRow label="ID do Boleto" value={conta.idBoleto} />
                <DetailRow label="Status do Boleto" value={conta.boleto || '-'} />
                {conta.nossonumero && (
                  <DetailRow label="Nosso Número" value={conta.nossonumero} />
                )}
                {conta.linhadigitavel && (
                  <div className="py-3 border-b last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">Linha Digitável</span>
                    <span className="text-xs font-mono break-all block bg-background p-2 rounded border">
                      {conta.linhadigitavel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conta de Recebimento */}
          {conta.contaRecebimento && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary">Conta de Recebimento</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">{conta.contaRecebimento}</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
};
