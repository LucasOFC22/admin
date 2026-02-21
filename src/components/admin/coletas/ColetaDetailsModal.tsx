import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { X, Truck, User, MapPin, Calendar, Package, DollarSign, Clock, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ColetaApiData } from '@/types/coleta';
import { getSituacaoLabel } from '@/hooks/useColetasApi';

interface ColetaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coleta: ColetaApiData | null;
}

export const ColetaDetailsModal = ({ open, onOpenChange, coleta }: ColetaDetailsModalProps) => {
  if (!coleta) return null;

  const formatDate = (dateString?: string) => formatDateOnly(dateString);

  // formatCurrency imported from @/lib/formatters

  const getSituacaoBadge = (situacao?: string | number) => {
    const situacaoStr = getSituacaoLabel(situacao);
    const configs: Record<string, { color: string; label: string }> = {
      'REALIZADA': { color: 'bg-green-50 text-green-700 border-green-200', label: 'Realizada' },
      'PENDENTE': { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendente' },
      'ANDAMENTO': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Em Andamento' },
      'CANCELADA': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelada' },
    };
    const config = configs[situacaoStr] || configs['PENDENTE'];
    return (
      <Badge className={`${config.color} border font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Coleta #{coleta.nroColeta}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{coleta.descTipoRegistro}</p>
              </div>
            </div>
            {getSituacaoBadge(coleta.situacao)}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações Gerais */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Informações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-4">
              <InfoRow icon={FileText} label="ID da Coleta" value={coleta.idColeta} />
              <InfoRow icon={FileText} label="Empresa" value={coleta.idEmpresa === 1 ? 'Matriz' : coleta.idEmpresa === 2 ? 'Filial' : String(coleta.idEmpresa)} />
              <InfoRow icon={Calendar} label="Data de Emissão" value={formatDate(coleta.emissao)} />
              <InfoRow icon={Clock} label="Dias" value={`${coleta.dias || 0} dias`} />
            </div>
          </div>

          <Separator />

          {/* Remetente */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Remetente
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <InfoRow icon={User} label="Nome" value={coleta.remetente} />
              <InfoRow icon={User} label="Solicitante" value={coleta.solicitante} />
            </div>
          </div>

          <Separator />

          {/* Local de Coleta */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Local de Coleta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-4">
              <InfoRow icon={MapPin} label="Cidade/UF" value={`${coleta.coletaCidade || '-'}/${coleta.coletaUf || '-'}`} />
              <InfoRow icon={MapPin} label="Bairro" value={coleta.coletaBairro} />
              <div className="md:col-span-2">
                <InfoRow icon={MapPin} label="Endereço" value={coleta.coletaEnd} />
              </div>
              <InfoRow icon={Calendar} label="Data da Coleta" value={formatDate(coleta.diaColeta)} />
              <InfoRow icon={Clock} label="Horário" value={coleta.horaColeta?.trim() === ':' ? '-' : coleta.horaColeta} />
              <div className="md:col-span-2">
                <InfoRow icon={Clock} label="Horário de Almoço" value={coleta.almoco?.includes('AS') && !coleta.almoco.startsWith(':') ? coleta.almoco : '-'} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Mercadoria */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Mercadoria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-4">
              <InfoRow icon={Package} label="Peso Total" value={`${coleta.tPeso?.toLocaleString('pt-BR') || 0} kg`} />
              <InfoRow icon={DollarSign} label="Valor da Mercadoria" value={formatCurrency(coleta.tVlrMerc)} />
            </div>
          </div>

          <Separator />

          {/* Transporte */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Transporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-4">
              <InfoRow icon={User} label="Condutor" value={coleta.condutor || coleta.condutor1} />
              <InfoRow icon={Truck} label="Placa" value={coleta.placa || coleta.placa1} />
              <InfoRow icon={Calendar} label="Data de Entrega" value={formatDate(coleta.dataEntrega)} />
            </div>
          </div>

          {/* Observações */}
          {coleta.obs && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Observações
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm">{coleta.obs}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
