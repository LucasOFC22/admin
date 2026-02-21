import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Weight, 
  Package2, 
  DollarSign, 
  Printer,
  ArrowRight,
  Clock,
  Truck,
  Box,
  FileText
} from "lucide-react";

interface CotacaoCardViewProps {
  cotacoes: any[];
  onPrint: (cotacao: any) => void;
}

export const CotacaoCardView = ({ cotacoes, onPrint }: CotacaoCardViewProps) => {
  const getCotacaoStatus = (cotacao: any) => {
    return cotacao.vlrTotal === 0 ? 'Pendente' : 'Concluído';
  };

  const getStatusStyles = (cotacao: any) => {
    const status = getCotacaoStatus(cotacao);
    if (status === 'Pendente') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const isPendente = (cotacao: any) => cotacao.vlrTotal === 0;

  if (cotacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma cotação encontrada
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Suas cotações aparecerão aqui quando você solicitar uma.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
      {cotacoes.map((cotacao) => (
        <div 
          key={cotacao.idOrcamento} 
          className="group bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cotação
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    #{cotacao.nroOrcamento}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(cotacao.emissao).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusStyles(cotacao)} font-medium text-xs px-2.5 py-0.5 rounded-full border`}
              >
                {getCotacaoStatus(cotacao)}
              </Badge>
            </div>
          </div>

          {/* Route Section */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Origem</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {cotacao.remetenteNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cotacao.cidadeOrigem}/{cotacao.ufOrigem}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Destino</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {cotacao.destinatarioNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cotacao.cidadeDestino}/{cotacao.ufDestino}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Details */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peso</p>
                  <p className="text-xs font-semibold text-foreground">
                    {cotacao.peso} kg
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Box className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Volumes</p>
                  <p className="text-xs font-semibold text-foreground">
                    {cotacao.volumes || 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prazo</p>
                  <p className="text-xs font-semibold text-foreground">
                    {cotacao.prazoEntrega ? `${cotacao.prazoEntrega} dias` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value & Action */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor Total</p>
                  <p className={`text-lg font-bold ${cotacao.vlrTotal > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {cotacao.vlrTotal > 0 
                      ? `R$ ${cotacao.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : 'Aguardando'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onPrint(cotacao)}
                size="sm"
                variant={isPendente(cotacao) ? "outline" : "default"}
                disabled={isPendente(cotacao)}
                className="rounded-xl px-4 h-9 text-xs font-medium transition-all duration-200 group-hover:shadow-md gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                {isPendente(cotacao) ? 'Aguardando' : 'Imprimir'}
              </Button>
            </div>

            {/* Observation */}
            {cotacao.observacao && (
              <div className="mt-3 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-semibold">Obs:</span> {cotacao.observacao}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
