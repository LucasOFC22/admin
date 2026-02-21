import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Clock, CheckCircle, Lock, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kanbanWhatsAppService, KanbanCategory } from '@/services/kanbanWhatsAppService';
import { supabaseWhatsAppService } from '@/services/whatsapp/supabaseIntegration';
import { useWhatsAppKanban } from '@/hooks/useWhatsAppKanban';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppActivityLogger } from '@/hooks/useWhatsAppActivityLogger';
import { useUserFilas } from '@/hooks/useUserFilas';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggedConversation {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  criadoEm?: Date;
  podeEnviarMensagem?: boolean;
  filas?: string;
  picture?: string;
  lastMessage?: string;
}

const DraggableConversationCard = ({ 
  conversa, 
  fila,
  canMove
}: { 
  conversa: any; 
  fila: KanbanCategory;
  canMove: boolean;
}) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conversa.id, disabled: !canMove });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleOpenChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/whatsapp/${conversa.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canMove ? { ...attributes, ...listeners } : {})}
      className={`
        bg-background border border-border rounded-lg p-3 
        hover:shadow-md transition-all duration-200 ease-in-out 
        ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}
        touch-manipulation
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {conversa.picture ? (
              <img src={conversa.picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{conversa.nome || 'Sem nome'}</p>
            <p className="text-xs text-muted-foreground">{conversa.telefone}</p>
          </div>
        </div>
        <Badge variant={conversa.ativo ? "default" : "secondary"} className="text-xs">
          {conversa.ativo ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      
      {conversa.lastMessage && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {conversa.lastMessage}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {conversa.criadoEm ? new Date(conversa.criadoEm).toLocaleDateString('pt-BR') : 'Data não disponível'}
          </span>
        </div>
        {conversa.podeEnviarMensagem && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>Pode responder</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-border">
        <Button
          size="sm"
          onClick={handleOpenChat}
          className="w-full h-8 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Abrir Atendimento
        </Button>
      </div>
    </div>
  );
};

const WhatsAppKanban = () => {
  const { logWhatsAppActivity } = useWhatsAppActivityLogger();
  const [filas, setFilas] = useState<KanbanCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [aguardandoExists, setAguardandoExists] = useState(true);
  const [draggedConversation, setDraggedConversation] = useState<DraggedConversation | null>(null);
  const { toast } = useToast();
  const { hasPermission } = usePermissionGuard();
  const {
    conversations,
    isLoading: conversationsLoading,
    loadConversations
  } = useWhatsAppKanban();
  const { filasPermitidas, hasFilasRestriction } = useUserFilas();

  const canMoveCards = hasPermission('admin.whatsapp-kanban.mover');

  const filasDisponiveis = useMemo(() => {
    if (!hasFilasRestriction) {
      return filas;
    }
    return filas.filter(fila => filasPermitidas.includes(Number(fila.id)));
  }, [filas, hasFilasRestriction, filasPermitidas]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    document.title = 'Filas WhatsApp - FP Transcargas Admin';
    loadFilas();
    logWhatsAppActivity('whatsapp_kanban_visualizado', {});
  }, []);

  const loadFilas = async () => {
    try {
      const filasData = await kanbanWhatsAppService.getCategories();
      setFilas(filasData.filter(f => f.active));
      setAguardandoExists(true);
    } catch (error) {
      console.error('Erro ao carregar filas:', error);
      setAguardandoExists(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!canMoveCards) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para mover cards",
        variant: "destructive"
      });
      return;
    }

    const { active } = event;
    const conversa = conversations.find(c => c.id === active.id);
    
    if (conversa) {
      setDraggedConversation({
        id: conversa.id,
        nome: conversa.nome || '',
        telefone: conversa.telefone || '',
        ativo: conversa.ativo || false,
        criadoEm: conversa.criadoEm,
        podeEnviarMensagem: conversa.podeEnviarMensagem,
        filas: conversa.filas,
        picture: (conversa as any).picture,
        lastMessage: (conversa as any).lastMessage
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedConversation(null);
    
    if (!over || !canMoveCards) return;
    
    const conversaId = active.id as string;
    const targetFilaId = over.id as string;
    
    const conversa = conversations.find(c => c.id === conversaId);
    if (!conversa) return;

    const currentFila = filas.find(fila => {
      return conversa.filas && conversa.filas.includes(fila.id);
    });

    if (currentFila?.id === targetFilaId) return;

    const targetFila = filas.find(f => f.id === targetFilaId);
    
    // Validar que a fila de destino existe
    if (!targetFila) {
      console.warn('[DnD] Fila de destino não existe:', targetFilaId);
      toast({
        title: "Fila inválida",
        description: "Solte o card em uma fila válida",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`Movendo conversa ${conversaId} para fila ID: "${targetFilaId}"`);
      
      await supabaseWhatsAppService.updateChatQueue(conversaId, targetFilaId);
      await loadConversations();
      
      logWhatsAppActivity('conversa_whatsapp_movida', {
        conversa_id: conversaId,
        conversa_nome: conversa.nome,
        fila_origem_id: currentFila?.id,
        fila_origem_nome: currentFila?.name,
        fila_destino_id: targetFilaId,
        fila_destino_nome: targetFila.name
      });
      
      toast({
        title: "Conversa movida com sucesso!",
        description: `Conversa movida para "${targetFila.name}"`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erro ao mover conversa:', error);
      toast({
        title: "Erro ao mover conversa",
        description: "Não foi possível mover a conversa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const DroppableFilaColumn = ({ fila }: { fila: KanbanCategory }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: fila.id,
    });

    const conversasFila = conversations.filter(conversa => {
      return conversa.filas && conversa.filas.includes(fila.id);
    });

    return (
    <Card 
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] min-w-[280px] lg:min-w-0 transition-colors ${
          isOver && canMoveCards ? 'bg-muted/50 border-primary border-dashed' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="text-sm font-medium uppercase tracking-wide flex items-center gap-2" 
              style={{ color: fila.color }}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: fila.color }} 
              />
              {fila.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {conversasFila.length}
            </Badge>
          </div>
          {fila.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {fila.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 transition-all duration-300 ease-in-out min-h-[300px]">
          <SortableContext 
            items={conversasFila.map(c => c.id)} 
            strategy={verticalListSortingStrategy}
            id={fila.name}
          >
            {conversasFila.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-muted-foreground mb-3">
                  <MessageCircle size={32} className="mx-auto opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa nesta fila
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversasFila.map((conversa) => (
                  <DraggableConversationCard
                    key={conversa.id}
                    conversa={conversa}
                    fila={fila}
                    canMove={canMoveCards}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </CardContent>
      </Card>
    );
  };

  if (loading || conversationsLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader 
          title="Filas WhatsApp" 
          subtitle="Gerenciamento de atendimentos por filas" 
          icon={MessageCircle} 
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "WhatsApp", href: "/whatsapp" },
            { label: "Filas" }
          ]} 
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando filas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permissions="admin.whatsapp-kanban.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full">
          <PageHeader 
            title="Filas WhatsApp" 
            subtitle="Gerenciamento de atendimentos por filas" 
            icon={MessageCircle} 
            breadcrumbs={[
              { label: "Dashboard", href: "/" },
              { label: "WhatsApp", href: "/whatsapp" },
              { label: "Filas" }
            ]} 
          />
          
          {!canMoveCards && (
            <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-600">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Você não tem permissão para mover cards entre colunas</span>
            </div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }} 
            className="flex-1 min-h-0 overflow-hidden p-6"
          >
            {filasDisponiveis.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {hasFilasRestriction ? 'Sem acesso a filas' : 'Nenhuma fila configurada'}
                  </h3>
                  <p className="text-muted-foreground">
                    {hasFilasRestriction 
                      ? 'Seu cargo não tem permissão para acessar nenhuma fila de WhatsApp'
                      : 'Configure as filas na aba de configurações do WhatsApp'}
                  </p>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="h-full overflow-x-auto pb-4">
                  <div className="flex gap-4 h-full min-w-max">
                    {filasDisponiveis.map((fila, index) => (
                      <SortableContext
                        key={fila.id}
                        items={[]}
                        strategy={verticalListSortingStrategy}
                        id={fila.name}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (index + 1) * 0.1 }}
                          className="h-full flex-shrink-0 w-[300px]"
                        >
                          <DroppableFilaColumn fila={fila} />
                        </motion.div>
                      </SortableContext>
                    ))}
                  </div>
                </div>
                
                <DragOverlay>
                  {draggedConversation ? (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg opacity-90 rotate-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                            {(draggedConversation as any).picture ? (
                              <img src={(draggedConversation as any).picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{draggedConversation.nome || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground">{draggedConversation.telefone}</p>
                          </div>
                        </div>
                        <Badge variant={draggedConversation.ativo ? "default" : "secondary"} className="text-xs">
                          {draggedConversation.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {draggedConversation.criadoEm ? new Date(draggedConversation.criadoEm).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </span>
                        </div>
                        {draggedConversation.podeEnviarMensagem && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Pode responder</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
        </motion.div>
      </div>
    </PermissionGuard>
  );
};

export default WhatsAppKanban;
