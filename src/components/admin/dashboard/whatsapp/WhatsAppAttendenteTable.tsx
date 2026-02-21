import { motion } from 'framer-motion';
import { User, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AtendenteStat } from '@/hooks/useWhatsAppDashboardStats';

interface WhatsAppAttendenteTableProps {
  atendentes: AtendenteStat[];
  isLoading: boolean;
}

const statusConfig = {
  online: { label: 'Online', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  offline: { label: 'Offline', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
  ocupado: { label: 'Ocupado', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
};

const WhatsAppAttendenteTable = ({ atendentes, isLoading }: WhatsAppAttendenteTableProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile card view for attendants
  const MobileAttendantCard = ({ atendente, index }: { atendente: AtendenteStat; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={atendente.avatar} alt={atendente.nome} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(atendente.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm text-foreground">{atendente.nome}</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`${statusConfig[atendente.status].className} text-[10px] px-1.5 py-0.5`}
        >
          <span className={`h-1.5 w-1.5 rounded-full mr-1 ${
            atendente.status === 'online' ? 'bg-green-500' :
            atendente.status === 'ocupado' ? 'bg-amber-500' : 'bg-gray-500'
          }`} />
          {statusConfig[atendente.status].label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center mt-3">
        <div className="bg-muted/50 rounded-md p-1.5">
          <p className={`text-sm font-semibold ${
            atendente.atendimentosAtivos > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
          }`}>
            {atendente.atendimentosAtivos}
          </p>
          <p className="text-[9px] text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-muted/50 rounded-md p-1.5">
          <p className="text-sm font-medium text-foreground">{atendente.totalAtendimentos}</p>
          <p className="text-[9px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-muted/50 rounded-md p-1.5">
          <p className="text-sm text-muted-foreground">{atendente.tempoMedioEspera}</p>
          <p className="text-[9px] text-muted-foreground">Espera</p>
        </div>
        <div className="bg-muted/50 rounded-md p-1.5">
          <p className="text-sm text-muted-foreground">{atendente.tempoMedioAtendimento}</p>
          <p className="text-[9px] text-muted-foreground">Atend.</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Tabela de Atendentes
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">
              Desempenho individual
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : atendentes.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm">Nenhum atendente com atendimentos</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="sm:hidden space-y-2">
                {atendentes.map((atendente, index) => (
                  <MobileAttendantCard key={atendente.id} atendente={atendente} index={index} />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto -mx-3 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Atendente</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Ativos
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Total
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Espera
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Atend.
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendentes.map((atendente, index) => (
                      <motion.tr
                        key={atendente.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-background">
                              <AvatarImage src={atendente.avatar} alt={atendente.nome} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                {getInitials(atendente.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{atendente.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {atendente.atendimentosAtivos > 0 
                                  ? `${atendente.atendimentosAtivos} atendimento${atendente.atendimentosAtivos > 1 ? 's' : ''} ativo${atendente.atendimentosAtivos > 1 ? 's' : ''}`
                                  : 'Sem atendimentos ativos'
                                }
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`${statusConfig[atendente.status].className} text-xs`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              atendente.status === 'online' ? 'bg-green-500' :
                              atendente.status === 'ocupado' ? 'bg-amber-500' : 'bg-gray-500'
                            }`} />
                            {statusConfig[atendente.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            atendente.atendimentosAtivos > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          }`}>
                            {atendente.atendimentosAtivos}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-foreground">
                            {atendente.totalAtendimentos}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm text-muted-foreground">
                            {atendente.tempoMedioEspera} min
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm text-muted-foreground">
                            {atendente.tempoMedioAtendimento} min
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhatsAppAttendenteTable;
