import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Printer, Package2, MapPin, ArrowRight, Weight, Box, Clock, Truck, Info, Calendar, FileText } from "lucide-react";

interface CotacaoTableViewProps {
  cotacoes: any[];
  onPrint: (cotacao: any) => void;
}

export const CotacaoTableView = ({ cotacoes, onPrint }: CotacaoTableViewProps) => {
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
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Cotação
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Rota
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Carga
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Prazo
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Valor
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4 px-5 text-right">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/30">
            {cotacoes.map((cotacao) => (
              <TableRow 
                key={cotacao.idOrcamento} 
                className="group hover:bg-muted/30 transition-colors duration-200"
              >
                {/* Cotação */}
                <TableCell className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-foreground">
                      #{cotacao.nroOrcamento}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(cotacao.emissao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Rota */}
                <TableCell className="px-5 py-4">
                  <div className="flex flex-col gap-1 max-w-[250px]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cotacao.remetenteNome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {cotacao.cidadeOrigem}/{cotacao.ufOrigem}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1.5">
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cotacao.destinatarioNome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {cotacao.cidadeDestino}/{cotacao.ufDestino}
                        </p>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Carga */}
                <TableCell className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Weight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{cotacao.peso} kg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{cotacao.volumes || 1} vol.</span>
                    </div>
                  </div>
                </TableCell>

                {/* Prazo */}
                <TableCell className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    {cotacao.prazoEntrega && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{cotacao.prazoEntrega} dias</span>
                      </div>
                    )}
                    {cotacao.tipoServico && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {cotacao.tipoServico}
                        </span>
                      </div>
                    )}
                    {!cotacao.prazoEntrega && !cotacao.tipoServico && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Valor */}
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${cotacao.vlrTotal > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {cotacao.vlrTotal > 0 
                        ? `R$ ${cotacao.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'Aguardando'}
                    </span>
                    {cotacao.observacao && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center cursor-help">
                              <Info className="h-3 w-3 text-amber-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover border border-border shadow-lg">
                            <p className="text-xs">{cotacao.observacao}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="px-5 py-4">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusStyles(cotacao)} font-medium text-xs px-2.5 py-0.5 rounded-full border`}
                  >
                    {getCotacaoStatus(cotacao)}
                  </Badge>
                </TableCell>

                {/* Ação */}
                <TableCell className="px-5 py-4 text-right">
                  <Button
                    onClick={() => onPrint(cotacao)}
                    size="sm"
                    variant={isPendente(cotacao) ? "ghost" : "default"}
                    disabled={isPendente(cotacao)}
                    className="rounded-xl h-8 px-3 text-xs font-medium transition-all duration-200 gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">
                      {isPendente(cotacao) ? 'Aguardando' : 'Imprimir'}
                    </span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border/30">
        {cotacoes.map((cotacao) => (
          <div key={cotacao.idOrcamento} className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  #{cotacao.nroOrcamento}
                </span>
                <Badge 
                  variant="outline" 
                  className={`${getStatusStyles(cotacao)} font-medium text-[10px] px-2 py-0 rounded-full border`}
                >
                  {getCotacaoStatus(cotacao)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(cotacao.emissao).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-foreground truncate flex-1">{cotacao.cidadeOrigem}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="text-foreground truncate flex-1">{cotacao.cidadeDestino}</span>
            </div>

            {/* Details Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Valor</span>
                <span className={`text-base font-bold ${cotacao.vlrTotal > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {cotacao.vlrTotal > 0 
                    ? `R$ ${cotacao.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : 'Aguardando'}
                </span>
              </div>
              <Button
                onClick={() => onPrint(cotacao)}
                size="sm"
                variant={isPendente(cotacao) ? "outline" : "default"}
                disabled={isPendente(cotacao)}
                className="rounded-xl px-4 h-8 text-xs font-medium gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                {isPendente(cotacao) ? 'Aguardando' : 'Imprimir'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
