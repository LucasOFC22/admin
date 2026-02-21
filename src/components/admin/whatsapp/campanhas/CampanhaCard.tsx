import { motion } from 'framer-motion';
import { Play, Pause, StopCircle, Copy, Trash2, Eye, MoreHorizontal, Clock, CheckCircle, XCircle, Loader2, Pencil, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Campanha } from '@/hooks/useCampanhas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

interface CampanhaCardProps {
  campanha: Campanha;
  onDetalhes: () => void;
  onEditar?: () => void;
  onAcao: (acao: 'iniciar' | 'pausar' | 'retomar' | 'cancelar' | 'duplicar' | 'excluir') => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-500', icon: <Clock className="h-3 w-3" /> },
  agendada: { label: 'Agendada', color: 'bg-blue-500', icon: <Calendar className="h-3 w-3" /> },
  em_andamento: { label: 'Em Andamento', color: 'bg-green-500', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  pausada: { label: 'Pausada', color: 'bg-yellow-500', icon: <Pause className="h-3 w-3" /> },
  concluida: { label: 'Concluída', color: 'bg-emerald-600', icon: <CheckCircle className="h-3 w-3" /> },
  cancelada: { label: 'Cancelada', color: 'bg-red-500', icon: <XCircle className="h-3 w-3" /> },
};

const CampanhaCard = ({ campanha, onDetalhes, onEditar, onAcao }: CampanhaCardProps) => {
  const { canAccess } = usePermissionGuard();
  
  const canExecute = canAccess('admin.campanhas.executar');
  const canDelete = canAccess('admin.campanhas.excluir');
  const canDuplicate = canAccess('admin.campanhas.criar');
  const canEdit = canAccess('admin.campanhas.editar');

  const status = statusConfig[campanha.status] || statusConfig.rascunho;
  const progress = campanha.total_contatos > 0 
    ? Math.round((campanha.enviados / campanha.total_contatos) * 100) 
    : 0;

  const temAgendamento = campanha.agendado_para && campanha.status === 'rascunho';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onDetalhes}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{campanha.nome}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {campanha.template_name}
              </p>
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <Badge className={`${status.color} text-white gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDetalhes}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  
                  {/* Editar - apenas rascunho, requer admin.campanhas.editar */}
                  {campanha.status === 'rascunho' && canEdit && onEditar && (
                    <DropdownMenuItem onClick={onEditar}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Iniciar - requer admin.campanhas.executar */}
                  {campanha.status === 'rascunho' && canExecute && (
                    <DropdownMenuItem onClick={() => onAcao('iniciar')}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Pausar - requer admin.campanhas.executar */}
                  {campanha.status === 'em_andamento' && canExecute && (
                    <DropdownMenuItem onClick={() => onAcao('pausar')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Retomar - requer admin.campanhas.executar */}
                  {campanha.status === 'pausada' && canExecute && (
                    <DropdownMenuItem onClick={() => onAcao('retomar')}>
                      <Play className="h-4 w-4 mr-2" />
                      Retomar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Cancelar - requer admin.campanhas.executar */}
                  {!['concluida', 'cancelada'].includes(campanha.status) && canExecute && (
                    <DropdownMenuItem onClick={() => onAcao('cancelar')} className="text-destructive">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Duplicar - requer admin.campanhas.criar */}
                  {canDuplicate && (
                    <DropdownMenuItem onClick={() => onAcao('duplicar')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                  
                  {/* Excluir - requer admin.campanhas.excluir */}
                  {campanha.status === 'rascunho' && canDelete && (
                    <DropdownMenuItem onClick={() => onAcao('excluir')} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Agendamento */}
          {temAgendamento && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-500/10 px-2 py-1.5 rounded">
              <Calendar className="h-3 w-3" />
              <span>Agendada: {format(new Date(campanha.agendado_para!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold">{campanha.total_contatos}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{campanha.enviados}</div>
              <div className="text-muted-foreground">Enviados</div>
            </div>
            <div>
              <div className="font-semibold text-blue-600">{campanha.entregues}</div>
              <div className="text-muted-foreground">Entregues</div>
            </div>
            <div>
              <div className="font-semibold text-red-600">{campanha.erros}</div>
              <div className="text-muted-foreground">Erros</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
            <span>{campanha.conexao?.nome || 'Sem conexão'}</span>
            <span>
              {format(new Date(campanha.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CampanhaCard;
