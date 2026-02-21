import { formatDateLongOnly, formatDate as formatDateShortUtil } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { 
  Truck, User, MapPin, Calendar, Package, DollarSign, 
  Clock, FileText, CheckCircle2, AlertCircle, Timer, Printer
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ColetaApiData } from '@/types/coleta';
import { getSituacaoLabel } from '@/hooks/useColetasApi';

interface ClientColetaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coleta: ColetaApiData | null;
}

export const ClientColetaDetailsModal = ({ open, onOpenChange, coleta }: ClientColetaDetailsModalProps) => {
  if (!coleta) return null;

  const formatDate = (dateString?: string) => formatDateLongOnly(dateString);
  const formatDateShort = (dateString?: string) => formatDateShortUtil(dateString);

  // formatCurrency imported from @/lib/formatters

  const getSituacaoInfo = (situacao?: string | number) => {
    const situacaoStr = getSituacaoLabel(situacao);
    const configs: Record<string, { color: string; label: string; description: string; icon: any; progress: number }> = {
      'REALIZADA': { 
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400', 
        label: 'Coleta Realizada',
        description: 'Sua mercadoria foi coletada com sucesso e está em trânsito.',
        icon: CheckCircle2,
        progress: 100
      },
      'PENDENTE': { 
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', 
        label: 'Aguardando Confirmação',
        description: 'Sua solicitação foi recebida e está sendo processada pela nossa equipe.',
        icon: Timer,
        progress: 25
      },
      'ANDAMENTO': { 
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', 
        label: 'Em Andamento',
        description: 'Nosso motorista está a caminho para realizar a coleta.',
        icon: Truck,
        progress: 60
      },
      'CANCELADA': { 
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400', 
        label: 'Cancelada',
        description: 'Esta coleta foi cancelada. Entre em contato para mais informações.',
        icon: AlertCircle,
        progress: 0
      },
    };
    return configs[situacaoStr] || configs['PENDENTE'];
  };

  const situacaoInfo = getSituacaoInfo(coleta.situacao);
  const SituacaoIcon = situacaoInfo.icon;

  const InfoRow = ({ icon: Icon, label, value, highlight = false }: { icon: any; label: string; value: string | number | undefined; highlight?: boolean }) => (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10' : 'bg-muted/50'}`}>
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`font-medium break-words ${highlight ? 'text-primary' : ''}`}>{value || '-'}</p>
      </div>
    </div>
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible mx-2 sm:mx-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl print:hidden shrink-0">
                <Truck className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl">
                  Coleta #{coleta.nroColeta}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{coleta.descTipoRegistro}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden h-8 text-xs">
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Imprimir
              </Button>
              <Badge className={`${situacaoInfo.color} border font-medium text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1`}>
                {situacaoInfo.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Card */}
          <div className={`p-4 rounded-xl ${situacaoInfo.color.split(' ')[0]} border`}>
            <div className="flex items-start gap-3">
              <SituacaoIcon className="h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">{situacaoInfo.label}</p>
                <p className="text-sm opacity-90">{situacaoInfo.description}</p>
                {getSituacaoLabel(coleta.situacao) !== 'CANCELADA' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{situacaoInfo.progress}%</span>
                    </div>
                    <Progress value={situacaoInfo.progress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações Principais */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações da Coleta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-xl p-4">
              <InfoRow icon={Calendar} label="Data Prevista" value={formatDate(coleta.diaColeta)} highlight />
              <InfoRow icon={Clock} label="Horário" value={coleta.horaColeta?.trim() === ':' ? 'A confirmar' : coleta.horaColeta} highlight />
              <InfoRow icon={FileText} label="Emissão" value={formatDateShort(coleta.emissao)} />
              <InfoRow icon={User} label="Solicitante" value={coleta.solicitante} />
            </div>
          </div>

          <Separator />

          {/* Local de Coleta */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Local de Coleta
            </h3>
            <div className="bg-muted/30 rounded-xl p-4 space-y-1">
              <p className="font-medium text-lg">{coleta.coletaCidade}/{coleta.coletaUf}</p>
              {coleta.coletaBairro && <p className="text-muted-foreground">{coleta.coletaBairro}</p>}
              {coleta.coletaEnd && <p className="text-sm text-muted-foreground">{coleta.coletaEnd}</p>}
              {coleta.almoco && coleta.almoco.includes('AS') && !coleta.almoco.startsWith(':') && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Horário de almoço:</strong> {coleta.almoco}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Mercadoria */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Dados da Mercadoria
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Package className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground uppercase">Peso Total</p>
                <p className="text-xl font-bold">{coleta.tPeso?.toLocaleString('pt-BR') || 0} <span className="text-sm font-normal">kg</span></p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-xs text-muted-foreground uppercase">Valor Declarado</p>
                <p className="text-xl font-bold">{formatCurrency(coleta.tVlrMerc)}</p>
              </div>
            </div>
          </div>

          {/* Transporte - Motorista, Placa e Data de Entrega REMOVIDOS conforme solicitado */}

          {/* Observações */}
          {coleta.obs && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Observações
                </h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm whitespace-pre-wrap">{coleta.obs}</p>
                </div>
              </div>
            </>
          )}

          {/* Ajuda */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dúvidas sobre sua coleta?</strong> Entre em contato pelo WhatsApp{' '}
              <a href="https://wa.me/5575983717561" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">(75) 98371-7561</a>
              {' '}ou pelo e-mail{' '}
              <a href="mailto:atendimento@fptranscargas.com.br" className="underline hover:text-blue-600">atendimento@fptranscargas.com.br</a>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
