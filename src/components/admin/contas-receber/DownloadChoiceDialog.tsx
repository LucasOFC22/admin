import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogHeader,
  AdminDialogTitle,
} from '@/components/admin/ui/AdminDialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

interface DownloadChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaReceber | null;
  contasMesmoCliente: ContaReceber[];
  tipo: 'fatura' | 'boleto';
  onDownloadSingle: (conta: ContaReceber) => void;
  onDownloadAll: (contas: ContaReceber[]) => void;
}

export const DownloadChoiceDialog = ({
  open,
  onOpenChange,
  conta,
  contasMesmoCliente,
  tipo,
  onDownloadSingle,
  onDownloadAll,
}: DownloadChoiceDialogProps) => {
  if (!conta) return null;

  const contasComBoleto = contasMesmoCliente.filter(c => c.idBoleto && c.idBoleto !== 0);
  const contasParaDownloadAll = tipo === 'boleto' ? contasComBoleto : contasMesmoCliente;
  const isFatura = tipo === 'fatura';
  const Icon = isFatura ? FileText : CreditCard;
  const label = isFatura ? 'Fatura' : 'Boleto';

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle className="text-lg">
            Baixar {label}
          </AdminDialogTitle>
        </AdminDialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Este cliente possui <span className="font-semibold text-foreground">{contasParaDownloadAll.length} {label.toLowerCase()}(s)</span> disponíveis. 
            O que deseja fazer?
          </p>

          <div className="space-y-3">
            {/* Download apenas desta */}
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => {
                onDownloadSingle(conta);
                onOpenChange(false);
              }}
            >
              <Icon className="h-5 w-5 mr-3 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Baixar apenas esta</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {label} nº {conta.doc}
                </p>
              </div>
            </Button>

            <Separator />

            {/* Download todas */}
            <Button
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => {
                onDownloadAll(contasParaDownloadAll);
                onOpenChange(false);
              }}
            >
              <Download className="h-5 w-5 mr-3 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Baixar todas ({contasParaDownloadAll.length})</p>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  Todas as {label.toLowerCase()}s de {conta.cliente?.substring(0, 30)}
                </p>
              </div>
            </Button>
          </div>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
};
