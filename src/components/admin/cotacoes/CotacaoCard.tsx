import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Phone, Mail, Calendar, ArrowRight, Eye, Pencil, Printer, Settings } from 'lucide-react';
import { MappedQuote } from '@/utils/cotacaoMapper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface CotacaoCardProps {
  cotacao: MappedQuote;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (cotacao: MappedQuote) => void;
  onPrint: (id: string) => void;
  onViewDetails: (cotacao: MappedQuote) => void;
  onChangeStatus: (cotacao: MappedQuote) => void;
}

const getStatusConfig = (status: string) => {
  const configs = {
    'Pendente': { label: 'Pendente' },
    'analise': { label: 'Em Análise' },
    'proposta_enviada': { label: 'Proposta Enviada' },
    'aprovada': { label: 'Aprovada' },
    'rejeitada': { label: 'Rejeitada' },
    'cancelada': { label: 'Cancelada' },
  };
  return configs[status as keyof typeof configs] || configs['Pendente'];
};

export default function CotacaoCard({ cotacao, onStatusChange, onEdit, onPrint, onViewDetails, onChangeStatus }: CotacaoCardProps) {
  const statusConfig = getStatusConfig(cotacao.status || 'Pendente');
  const createdDate = cotacao.criadoEm ? new Date(cotacao.criadoEm) : new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="group border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-5 bg-muted/20 border-b border-border/40">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs font-mono px-1.5 sm:px-2">
                  #{cotacao.id?.slice(0, 8) || 'N/A'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{format(createdDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 pt-3">
          {/* Remetente e Destinatário */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-foreground">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                Remetente
              </div>
              <div className="pl-5 sm:pl-6 space-y-0.5 sm:space-y-1">
                <p className="font-medium text-xs sm:text-sm truncate">{cotacao.remetente.nome || 'Não informado'}</p>
                <div className="flex items-start gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {cotacao.remetente.endereco.cidade && cotacao.remetente.endereco.estado ? 
                      `${cotacao.remetente.endereco.cidade}, ${cotacao.remetente.endereco.estado}` : 
                      'Endereço não informado'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-foreground">
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                Destinatário
              </div>
              <div className="pl-5 sm:pl-6 space-y-0.5 sm:space-y-1">
                <p className="font-medium text-xs sm:text-sm truncate">{cotacao.destinatario.nome || 'Não informado'}</p>
                <div className="flex items-start gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {cotacao.destinatario.endereco.cidade && cotacao.destinatario.endereco.estado ? 
                      `${cotacao.destinatario.endereco.cidade}, ${cotacao.destinatario.endereco.estado}` : 
                      'Endereço não informado'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Contato */}
          {(cotacao.contato.nome || cotacao.contato.email || cotacao.contato.telefone) && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="text-xs sm:text-sm font-medium text-foreground">Contato</div>
              <div className="space-y-1 text-xs sm:text-sm">
                {cotacao.contato.nome && cotacao.contato.nome !== 'N/A' && (
                  <p className="font-medium truncate">{cotacao.contato.nome}</p>
                )}
                <div className="flex flex-col gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                  {cotacao.contato.email && cotacao.contato.email !== 'N/A' && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{cotacao.contato.email}</span>
                    </div>
                  )}
                  {cotacao.contato.telefone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{cotacao.contato.telefone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Carga Info */}
          {(cotacao.cargoType || cotacao.carga.peso || cotacao.carga.valorDeclarado) && (
            <>
              <Separator className="bg-border/40" />
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                {cotacao.cargoType && cotacao.cargoType !== 'N/A' && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground text-[10px] sm:text-xs">Tipo:</span>
                    <p className="font-medium capitalize truncate">{cotacao.cargoType}</p>
                  </div>
                )}
                {cotacao.carga.peso && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground text-[10px] sm:text-xs">Peso:</span>
                    <p className="font-medium truncate">{cotacao.carga.peso}kg</p>
                  </div>
                )}
                {cotacao.carga.valorDeclarado && (
                  <div className="col-span-2 min-w-0">
                    <span className="text-muted-foreground text-[10px] sm:text-xs">Valor Declarado:</span>
                    <p className="font-medium truncate">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(cotacao.carga.valorDeclarado)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator className="bg-border/40" />

          {/* Actions */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(cotacao)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPrint(cotacao.id)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Imprimir"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onViewDetails(cotacao)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChangeStatus(cotacao)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Alterar Status"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
