import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormattedTextarea } from './FormattedTextarea';
import { VariablesHelper } from './VariablesHelper';

interface FlowBuilderTextModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { description: string; title?: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderTextModal: React.FC<FlowBuilderTextModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [textValue, setTextValue] = useState('');

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
      setTextValue(data.data.description || data.data.text || data.data.label || '');
    } else if (mode === 'create') {
      setTextValue('');
    }
  }, [mode, data, open]);

  const handleInsertVariable = (variable: string) => {
    setTextValue(prev => prev + variable);
  };

  const handleSave = () => {
    if (!textValue.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          description: textValue
        }
      });
    } else {
      onSave({ 
        description: textValue
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === 'create' ? 'Adicionar mensagem ao fluxo' : 'Editar mensagem do fluxo'}
          </DialogTitle>
          <DialogDescription>
            Configure a mensagem de texto que será enviada ao usuário
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <FormattedTextarea
                id="message"
                value={textValue}
                onChange={setTextValue}
                placeholder="Digite sua mensagem aqui..."
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Use *negrito*, _itálico_, ~sublinhado~ para formatar
              </p>
            </div>

            <VariablesHelper onInsert={handleInsertVariable} />
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0">
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
