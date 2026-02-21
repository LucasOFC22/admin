import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VariableAutocomplete } from './VariableAutocomplete';

interface ConditionData {
  key: string;
  condition: number;
  value: string;
  title?: string;
}

interface FlowBuilderConditionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ConditionData) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

const conditionOptions = [
  { value: '1', label: '== (Igual)', symbol: '==' },
  { value: '2', label: '>= (Maior ou igual)', symbol: '>=' },
  { value: '3', label: '<= (Menor ou igual)', symbol: '<=' },
  { value: '4', label: '< (Menor que)', symbol: '<' },
  { value: '5', label: '> (Maior que)', symbol: '>' }
];

export const FlowBuilderConditionModal: React.FC<FlowBuilderConditionModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ConditionData>({
    key: '',
    condition: 1,
    value: '',
    title: ''
  });

  useEffect(() => {
    if (mode === 'edit' && data?.data) {
      setFormData({
        key: data.data.key || '',
        condition: data.data.condition || 1,
        value: data.data.value || '',
        title: data.data.title || ''
      });
    } else if (mode === 'create') {
      setFormData({
        key: '',
        condition: 1,
        value: '',
        title: ''
      });
    }
  }, [mode, data, open]);

  const handleChange = (field: keyof ConditionData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.key || !formData.value) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: formData
      });
    } else {
      onSave(formData);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar condição ao fluxo' : 'Editar condição'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Node</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Validar idade"
            />
            <p className="text-xs text-muted-foreground">
              Título personalizado que aparecerá no node (opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Campo da condição</Label>
            <VariableAutocomplete
              id="key"
              value={formData.key}
              onChange={(value) => handleChange('key', value)}
              placeholder="nome_da_variavel"
              forceShowSuggestions={true}
            />
            <p className="text-xs text-muted-foreground">
              Digite o nome do campo que será avaliado (ex: idade, status)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Regra de validação</Label>
            <Select 
              value={formData.condition.toString()} 
              onValueChange={(value) => handleChange('condition', Number(value))}
            >
              <SelectTrigger id="condition">
                <SelectValue placeholder="Selecione uma regra" />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor da condição</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              placeholder="Valor a ser comparado"
            />
            <p className="text-xs text-muted-foreground">
              Digite o valor que será comparado com o campo
            </p>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Exemplo da condição:</p>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.key || 'campo'} {conditionOptions.find(o => o.value === formData.condition.toString())?.symbol || '=='} {formData.value || 'valor'}
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
