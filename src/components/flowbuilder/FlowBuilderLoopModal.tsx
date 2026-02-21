import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoopData {
  arrayVariable: string;
  itemVariable: string;
  indexVariable?: string;
}

interface FlowBuilderLoopModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: LoopData) => void;
  onUpdate?: (data: LoopData) => void;
  data?: { data: LoopData };
  mode: 'create' | 'edit';
}

const defaultData: LoopData = {
  arrayVariable: '',
  itemVariable: 'item',
  indexVariable: '',
};

// Variable autocomplete input component
const VariableInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("font-mono", className)}
    />
  );
};

export const FlowBuilderLoopModal: React.FC<FlowBuilderLoopModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode,
}) => {
  const [formData, setFormData] = useState<LoopData>(defaultData);

  const initialDataRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }

    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;

    initialDataRef.current = dataKey;

    if (data?.data) {
      setFormData({
        ...defaultData,
        ...data.data,
      });
    } else {
      setFormData(defaultData);
    }
  }, [open, data]);

  const handleSave = () => {
    if (!formData.arrayVariable || !formData.itemVariable) {
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate(formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-indigo-600" />
            {mode === 'edit' ? 'Editar Loop' : 'Configurar Loop'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Array Variable */}
          <div className="space-y-2">
            <Label>Variável do Array *</Label>
            <VariableInput
              value={formData.arrayVariable}
              onChange={(value) => setFormData(prev => ({ ...prev, arrayVariable: value }))}
              placeholder="{{boletos}} ou {{lista_itens}}"
            />
            <p className="text-xs text-muted-foreground">
              Variável que contém o array a ser iterado
            </p>
          </div>

          {/* Item Variable */}
          <div className="space-y-2">
            <Label>Nome da Variável do Item *</Label>
            <Input
              value={formData.itemVariable}
              onChange={(e) => setFormData(prev => ({ ...prev, itemVariable: e.target.value }))}
              placeholder="item"
            />
            <p className="text-xs text-muted-foreground">
              Nome da variável que receberá cada item do array (ex: <code className="bg-muted px-1 rounded">item</code>)
            </p>
          </div>

          {/* Index Variable */}
          <div className="space-y-2">
            <Label>Nome da Variável do Índice (opcional)</Label>
            <Input
              value={formData.indexVariable || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, indexVariable: e.target.value }))}
              placeholder="index"
            />
            <p className="text-xs text-muted-foreground">
              Nome da variável que receberá o índice atual (0, 1, 2...)
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-700">
              <strong>Como funciona:</strong> Para cada item do array, as variáveis serão definidas e os blocos conectados serão executados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.arrayVariable || !formData.itemVariable}
          >
            {mode === 'edit' ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
