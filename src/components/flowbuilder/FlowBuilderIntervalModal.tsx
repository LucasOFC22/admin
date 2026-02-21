import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlowBuilderIntervalModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { sec: number; title?: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderIntervalModal: React.FC<FlowBuilderIntervalModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [seconds, setSeconds] = useState<number>(0);

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data) {
      setSeconds(data.data.sec || 0);
    } else if (mode === 'create') {
      setSeconds(0);
    }
  }, [mode, data, open]);

  const handleSave = () => {
    if (!seconds || parseInt(seconds.toString()) <= 0) {
      toast({
        title: "Erro",
        description: "Adicione um valor de intervalo válido",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(seconds.toString()) > 120) {
      toast({
        title: "Erro",
        description: "Máximo de tempo atingido: 120 segundos",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          sec: seconds 
        }
      });
    } else {
      onSave({ sec: seconds });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {mode === 'create' ? 'Adicionar intervalo ao fluxo' : 'Editar intervalo'}
          </DialogTitle>
          <DialogDescription>
            Defina um intervalo de espera entre as ações do fluxo. Máximo: 120 segundos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="seconds">Tempo em segundos *</Label>
            <Input
              id="seconds"
              type="number"
              min={0}
              max={120}
              placeholder="Ex: 5"
              value={seconds}
              onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              O fluxo aguardará {seconds} segundo{seconds !== 1 ? 's' : ''} antes de continuar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
