import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlowBuilderRandomizerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { percent: number; title?: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderRandomizerModal: React.FC<FlowBuilderRandomizerModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [percent, setPercent] = useState([50]);
  const [titleValue, setTitleValue] = useState('');

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
      setPercent([data.data.percent || 50]);
      setTitleValue(data.data.title || '');
    } else if (mode === 'create') {
      setPercent([50]);
      setTitleValue('');
    }
  }, [mode, data, open]);

  const handleSave = () => {
    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          percent: percent[0], 
          title: titleValue.trim() || undefined 
        }
      });
    } else {
      onSave({ percent: percent[0], title: titleValue.trim() || undefined });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar randomizador ao fluxo' : 'Editar randomizador'}
          </DialogTitle>
          <DialogDescription>
            Distribua usuários aleatoriamente entre dois caminhos do fluxo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{percent[0]}%</div>
              <div className="text-sm text-muted-foreground mt-1">Saída A</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{100 - percent[0]}%</div>
              <div className="text-sm text-muted-foreground mt-1">Saída B</div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Distribuição percentual</Label>
            <Slider
              value={percent}
              onValueChange={setPercent}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Ajuste o controle para definir a porcentagem de usuários que seguirão cada caminho
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
