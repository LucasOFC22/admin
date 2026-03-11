import { Printer, CircleCheckBig, X, Truck, User, Calendar, FileText, MapPin } from 'lucide-react';
import { formatTimestamp } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Manifesto } from '@/types/manifesto';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { downloadFromApi } from '@/lib/download-utils';
import { motion } from 'framer-motion';

interface ManifestoCardProps {
  manifesto: Manifesto;
  onPrint?: (manifesto: Manifesto) => void;
  onEncerrar?: (manifesto: Manifesto) => void;
  onCancelar?: (manifesto: Manifesto) => void;
}

export const ManifestoCard = ({ 
  manifesto, 
  onPrint, 
  onEncerrar, 
  onCancelar 
}: ManifestoCardProps) => {
  const handleDownloadMdfe = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    downloadFromApi(
      `${baseUrl}/functions/v1/imprimir-mdfe/${manifesto.chaveMdfe}`,
      `MDF-e_${manifesto.chaveMdfe}.pdf`
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num);
  };

  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => formatTimestamp(dateString);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all duration-200">
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <h3 className="font-semibold text-sm sm:text-base">#{manifesto.nroManifesto}</h3>
                  <span className="text-xs sm:text-sm text-muted-foreground">MDFe #{manifesto.nroMdfe}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{manifesto.emitente}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {manifesto.menos24h === 'S' && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                  &lt; 24h
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                {manifesto.tipoAquisicao}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <InfoItem icon={MapPin} label="Rota" value={`${manifesto.ufOrigem} → ${manifesto.ufDestino}`} />
            <InfoItem icon={Truck} label="Veículo" value={manifesto.veictracaoPlaca} />
            <InfoItem icon={User} label="Condutor" value={manifesto.condutor} />
            <InfoItem icon={Calendar} label="Emissão" value={manifesto.emissao} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/40">
            <InfoItem label="Data SEFAZ" value={formatDate(manifesto.dataStatus)} />
            <InfoItem label="Nº Contrato" value={String(manifesto.nroContrato || '-')} />
            <InfoItem label="CIOT" value={String(manifesto.ciot || manifesto.ciotNro || '-')} />
            <InfoItem label="ID Empresa" value={String(manifesto.idEmpresa)} />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/40">
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Peso: </span>
                <span className="font-medium">{formatNumber(manifesto.tPeso)} kg</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor: </span>
                <span className="font-semibold">{formatCurrency(manifesto.tVlrMerc)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownloadMdfe} className="h-8 text-xs sm:text-sm px-2 sm:px-3">
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden xs:inline">Download</span>
                <span className="xs:hidden">PDF</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <CircleCheckBig className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    Encerrar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base sm:text-lg">Confirmar Encerramento</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2 text-sm">
                        <p>Tem certeza que deseja encerrar este manifesto?</p>
                        <p className="text-sm font-medium text-destructive">Esta ação é irreversível e pode ser passível de autuação.</p>
                        {manifesto.menos24h === 'S' && (
                          <p className="text-sm font-medium text-destructive">Se fizer o encerramento perderá o cancelamento (menos de 24h).</p>
                        )}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Não</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onEncerrar?.(manifesto)}
                      className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, Encerrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-8 text-xs sm:text-sm px-2 sm:px-3">
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base sm:text-lg">Confirmar Cancelamento</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      Deseja realmente cancelar o manifesto #{manifesto.nroManifesto}?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Não cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onCancelar?.(manifesto)}
                      className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface InfoItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

const InfoItem = ({ icon: Icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-1.5 sm:gap-2">
    {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <p className="text-xs sm:text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);
