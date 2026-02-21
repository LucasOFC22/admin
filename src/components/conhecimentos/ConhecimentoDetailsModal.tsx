import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  Printer,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  FileText,
  User,
  Building,
  Weight,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { formatDateLong } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import type { Conhecimento } from '@/pages/Conhecimentos';

interface ConhecimentoDetailsModalProps {
  conhecimento: Conhecimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getStatusInfo: (status: string) => {
    icon: any;
    label: string;
    color: string;
    textColor: string;
  };
}

const ConhecimentoDetailsModal = ({
  conhecimento,
  open,
  onOpenChange,
  getStatusInfo
}: ConhecimentoDetailsModalProps) => {
  if (!conhecimento) return null;

  const statusInfo = getStatusInfo(conhecimento.status);
  const StatusIcon = statusInfo.icon;

  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => formatDateLong(dateString);

  const handleDownload = () => {
    // Implementar lógica de download
    console.log('Download PDF:', conhecimento.numero);
  };

  const handlePrint = () => {
    // Implementar lógica de impressão
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <span>Detalhes do Conhecimento</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="default" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Header com Status */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{conhecimento.numero}</h2>
                  <p className="text-muted-foreground mt-1">
                    Emitido em {formatDate(conhecimento.data_emissao)}
                  </p>
                </div>
                <Badge className={`${statusInfo.color} text-white flex items-center gap-2 px-4 py-2 text-base`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusInfo.label}
                </Badge>
              </div>

              {conhecimento.nfe_numero && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">NF-e:</span>
                  <span className="font-semibold">{conhecimento.nfe_numero}</span>
                </div>
              )}
            </div>

            {/* Rota */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Rota de Transporte
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Origem</p>
                    <p className="text-xl font-bold">{conhecimento.origem}</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-primary mx-4 flex-shrink-0" />
                  <div className="flex-1 text-right">
                    <p className="text-sm text-muted-foreground mb-1">Destino</p>
                    <p className="text-xl font-bold">{conhecimento.destino}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Partes Envolvidas */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Remetente
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-semibold">{conhecimento.remetente}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Destinatário
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-semibold">{conhecimento.destinatario}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações da Carga */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Informações da Carga
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">Volumes</span>
                  </div>
                  <p className="text-2xl font-bold">{conhecimento.volume}</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                    <Weight className="h-4 w-4" />
                    <span className="text-sm font-medium">Peso Total</span>
                  </div>
                  <p className="text-2xl font-bold">{conhecimento.peso} kg</p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 md:col-span-1 col-span-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Valor do Frete</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(conhecimento.valor_frete)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Prazos */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Prazos e Datas
              </h3>
              <div className="space-y-3">
                {conhecimento.previsao_entrega && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                        <p className="font-semibold">{formatDate(conhecimento.previsao_entrega)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {conhecimento.data_entrega && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Entrega</p>
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          {formatDate(conhecimento.data_entrega)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {conhecimento.observacoes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">{conhecimento.observacoes}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ConhecimentoDetailsModal;
