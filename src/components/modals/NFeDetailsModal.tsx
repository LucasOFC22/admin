import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogHeader,
  AdminDialogTitle,
} from '@/components/admin/ui/AdminDialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Building2, MapPin, Calendar, DollarSign, Weight, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';

interface NFeData {
  idConhecimento: number;
  nroConhec: number;
  doc: string;
  nroNf: string;
  destNome: string;
  destCgc: string;
  remeNome: string;
  remeCgc: string;
  cidDestino: string;
  ufOrigem: string;
  ufDestino: string;
  cidOrigem: string;
  emissao: string;
  vlrTotal: number;
  vlrMerc: number;
  peso: number;
  pesoCubado: number;
  descPosicao: string;
  dataUltOcorrencia: string;
  ultimaOcorrencia: string;
  comprovante: string;
  chaveCte: string;
  tipoServico: string;
}

interface NFeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: NFeData | null;
}

export const NFeDetailsModal = ({ open, onOpenChange, data }: NFeDetailsModalProps) => {
  if (!data) return null;

  const getComprovanteDisplay = () => {
    if (data.comprovante && data.comprovante.toUpperCase() === 'S') {
      return {
        text: 'Com Comprovante',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        icon: <CheckCircle2 className="h-4 w-4" />
      };
    }
    return {
      text: 'Sem Comprovante',
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      icon: <XCircle className="h-4 w-4" />
    };
  };

  const comprovanteInfo = getComprovanteDisplay();

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-full sm:max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <AdminDialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <AdminDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes do CT-e #{data.nroConhec}
          </AdminDialogTitle>
        </AdminDialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-6">
            {/* Informações Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Número CT-e
                </p>
                <p className="font-semibold text-lg">{data.nroConhec}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Tipo Documento
                </p>
                <p className="font-semibold text-lg">{data.doc}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Número NF
                </p>
                <p className="font-semibold">{data.nroNf}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Data Emissão
                </p>
                <p className="font-semibold">
                  {data.emissao ? new Date(data.emissao).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Status e Comprovante */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Status da Entrega
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm text-muted-foreground">Status Atual</p>
                  <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    {data.descPosicao}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm text-muted-foreground">Comprovante</p>
                  <Badge className={comprovanteInfo.className}>
                    <span className="flex items-center gap-1.5">
                      {comprovanteInfo.icon}
                      {comprovanteInfo.text}
                    </span>
                  </Badge>
                </div>
              </div>
              {data.ultimaOcorrencia && (
                <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                  <p className="text-sm text-muted-foreground">Última Ocorrência</p>
                  <p className="font-medium">{data.ultimaOcorrencia}</p>
                  {data.dataUltOcorrencia && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(data.dataUltOcorrencia).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Remetente e Destinatário */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Partes Envolvidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Remetente</p>
                  <div className="space-y-1">
                    <p className="font-medium">{data.remeNome}</p>
                    <p className="text-sm text-muted-foreground">{data.remeCgc}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Destinatário</p>
                  <div className="space-y-1">
                    <p className="font-medium">{data.destNome}</p>
                    <p className="text-sm text-muted-foreground">{data.destCgc}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Origem e Destino */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Trajeto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Origem</p>
                  <p className="font-medium">{data.cidOrigem} - {data.ufOrigem}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Destino</p>
                  <p className="font-medium">{data.cidDestino} - {data.ufDestino}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Valores e Pesos */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Valores e Medidas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Valor Total
                  </p>
                  <p className="font-semibold text-lg">
                    R$ {data.vlrTotal != null ? data.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Valor Mercadoria
                  </p>
                  <p className="font-semibold text-lg">
                    R$ {data.vlrMerc != null ? data.vlrMerc.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    Peso
                  </p>
                  <p className="font-semibold text-lg">
                    {data.peso != null ? data.peso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0'} kg
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    Peso Cubado
                  </p>
                  <p className="font-semibold text-lg">
                    {data.pesoCubado != null ? data.pesoCubado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0'} kg
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações Adicionais */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Informações Adicionais
              </h3>
              <div className="space-y-3">
                {data.tipoServico && (
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">Tipo de Serviço</p>
                    <p className="font-medium">{data.tipoServico}</p>
                  </div>
                )}
                {data.chaveCte && (
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">Chave CT-e</p>
                    <p className="font-mono text-xs break-all">{data.chaveCte}</p>
                  </div>
                )}
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">ID Conhecimento</p>
                  <p className="font-medium">{data.idConhecimento}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </AdminDialogContent>
    </AdminDialog>
  );
};
