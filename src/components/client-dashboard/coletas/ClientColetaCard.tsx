import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { 
  Truck, MapPin, Calendar, Package, Clock, 
  CheckCircle2, Timer, AlertCircle, Eye, Download,
  ChevronRight, Weight
} from 'lucide-react';
import { ColetaApiData } from '@/types/coleta';
import { getSituacaoLabel } from '@/hooks/useColetasApi';
import { cn } from '@/lib/utils';

interface ClientColetaCardProps {
  coleta: ColetaApiData;
  onView: (coleta: ColetaApiData) => void;
  onDownload?: (coleta: ColetaApiData) => void;
}

export const ClientColetaCard = ({ coleta, onView, onDownload }: ClientColetaCardProps) => {
  const formatDate = (dateString?: string) => formatDateOnly(dateString);

  const getSituacaoConfig = (situacao?: string | number) => {
    const situacaoStr = getSituacaoLabel(situacao);
    const configs: Record<string, { 
      bg: string; 
      text: string;
      icon: any; 
      label: string;
    }> = {
      'REALIZADA': { 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: CheckCircle2,
        label: 'Realizada'
      },
      'PENDENTE': { 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-600 dark:text-amber-400',
        icon: Timer,
        label: 'Pendente'
      },
      'ANDAMENTO': { 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-600 dark:text-blue-400',
        icon: Truck,
        label: 'Em Andamento'
      },
      'CANCELADA': { 
        bg: 'bg-red-500/10', 
        text: 'text-red-600 dark:text-red-400',
        icon: AlertCircle,
        label: 'Cancelada'
      },
    };
    return configs[situacaoStr] || configs['PENDENTE'];
  };

  const situacaoConfig = getSituacaoConfig(coleta.situacao);
  const SituacaoIcon = situacaoConfig.icon;

  const hasHora = coleta.horaColeta && coleta.horaColeta.trim() !== ':';

  return (
    <div 
      onClick={() => onView(coleta)}
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer",
        "border border-border/50 bg-card/80 backdrop-blur-sm",
        "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
        "active:scale-[0.99] transition-all duration-200"
      )}
    >
      {/* Mobile: Top row with status + number + badge */}
      <div className="flex items-center gap-3 sm:hidden">
        <div className={cn(
          "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          situacaoConfig.bg
        )}>
          <SituacaoIcon className={cn("h-4 w-4", situacaoConfig.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm">
              Coleta #{coleta.nroColeta}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
              situacaoConfig.bg, situacaoConfig.text
            )}>
              {situacaoConfig.label}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Mobile: Info row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground sm:hidden pl-12">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {coleta.coletaCidade}/{coleta.coletaUf}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(coleta.diaColeta)}
        </span>
      </div>

      {/* Desktop: Status Icon */}
      <div className={cn(
        "hidden sm:flex shrink-0 w-11 h-11 rounded-xl items-center justify-center",
        situacaoConfig.bg
      )}>
        <SituacaoIcon className={cn("h-5 w-5", situacaoConfig.text)} />
      </div>

      {/* Desktop: Main Content */}
      <div className="hidden sm:grid flex-1 min-w-0 grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4">
        {/* Left: Title + Location */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">
              Coleta #{coleta.nroColeta}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
              situacaoConfig.bg, situacaoConfig.text
            )}>
              {situacaoConfig.label}
            </span>
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {coleta.coletaCidade}/{coleta.coletaUf}
            </span>
            {coleta.remetente && (
              <span className="truncate max-w-[150px]" title={coleta.remetente}>
                {coleta.remetente}
              </span>
            )}
          </div>
        </div>

        {/* Right: Meta info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(coleta.diaColeta)}</span>
          </div>
          
          {hasHora && (
            <div className="hidden md:flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{coleta.horaColeta}</span>
            </div>
          )}
          
          <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
            <Weight className="h-3.5 w-3.5" />
            <span>{coleta.tPeso?.toLocaleString('pt-BR') || '-'} kg</span>
          </div>
        </div>
      </div>

      {/* Desktop: Actions */}
      <div className="hidden sm:flex shrink-0 items-center gap-1">
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(coleta);
            }}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-muted-foreground hover:text-primary hover:bg-primary/10",
              "transition-colors"
            )}
            title="Baixar PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10",
          "transition-colors"
        )}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
