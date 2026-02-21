import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Queue {
  id: number;
  name: string;
  color?: string;
}

interface FlowBuilderTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { queueIds: number[]; modoDeAtendimento: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderTicketModal: React.FC<FlowBuilderTicketModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchQueues();
    }
  }, [open]);

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.queueIds) {
      setSelectedQueueIds(data.data.queueIds || []);
    } else if (mode === 'create') {
      setSelectedQueueIds([]);
    }
  }, [mode, data, open]);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data: queuesData, error } = await supabase
        .from('filas_whatsapp')
        .select('*')
        .eq('active', true)
        .order('order_position');

      if (error) throw error;
      
      const mappedQueues: Queue[] = (queuesData || []).map(q => ({
        id: q.id,
        name: q.name,
        color: q.color
      }));
      
      setQueues(mappedQueues);
    } catch (error) {
      console.error('Erro ao buscar filas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as filas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQueue = (queueId: number) => {
    setSelectedQueueIds(prev => {
      if (prev.includes(queueId)) {
        return prev.filter(id => id !== queueId);
      }
      return [...prev, queueId];
    });
  };

  const handleSave = () => {
    if (selectedQueueIds.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma fila",
        variant: "destructive"
      });
      return;
    }

    // Obter nomes das filas selecionadas
    const selectedQueueNames = queues
      .filter(q => selectedQueueIds.includes(q.id))
      .map(q => q.name);

    const ticketData = {
      queueIds: selectedQueueIds,
      queueNames: selectedQueueNames,
      modoDeAtendimento: "Atendimento Humano"
    };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          ...ticketData
        }
      });
    } else {
      onSave(ticketData);
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  const selectedQueues = queues.filter(q => selectedQueueIds.includes(q.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar fila ao fluxo' : 'Editar fila'}
          </DialogTitle>
          <DialogDescription>
            Selecione as filas para encaminhar o atendimento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Selected queues preview */}
          {selectedQueues.length > 0 && (
            <div className="space-y-2">
              <Label>Filas selecionadas ({selectedQueues.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                {selectedQueues.map((queue) => (
                  <div
                    key={queue.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm"
                    style={{ 
                      backgroundColor: queue.color ? `${queue.color}20` : undefined,
                      borderColor: queue.color,
                      border: '1px solid'
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: queue.color || '#888' }}
                    />
                    <span>{queue.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleQueue(queue.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available queues */}
          <div className="space-y-2">
            <Label>Filas disponíveis</Label>
            <ScrollArea className="h-[250px] border rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : queues.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">Nenhuma fila encontrada</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {queues.map((queue) => {
                    const isSelected = selectedQueueIds.includes(queue.id);
                    return (
                      <div
                        key={queue.id}
                        onClick={() => toggleQueue(queue.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleQueue(queue.id)}
                        />
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: queue.color || '#888' }}
                        />
                        <span className="flex-1 text-sm font-medium">{queue.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Info about mode */}
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Modo de Atendimento:</strong> Atendimento Humano
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              O ticket será automaticamente configurado para atendimento humano
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
