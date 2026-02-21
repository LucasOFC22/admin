import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VariableAutocomplete } from './VariableAutocomplete';
import { FormattedTextarea } from './FormattedTextarea';
import { VariablesHelper } from './VariablesHelper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ANSWER_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'file', label: 'Arquivo' },
  { value: 'audio', label: 'Áudio' },
  { value: 'image', label: 'Imagem' },
  { value: 'website', label: 'Website' },
];

interface QuestionData {
  message: string;
  answerKey: string;
  answerType: string;
  title?: string;
}

interface FlowBuilderQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { typebotIntegration: QuestionData }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderQuestionModal: React.FC<FlowBuilderQuestionModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<QuestionData>({
    message: '',
    answerKey: '',
    answerType: 'text'
  });

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.typebotIntegration) {
      setFormData({
        message: data.data.typebotIntegration.message || '',
        answerKey: data.data.typebotIntegration.answerKey || '',
        answerType: data.data.typebotIntegration.answerType || 'text'
      });
    } else if (mode === 'create') {
      setFormData({
        message: '',
        answerKey: '',
        answerType: 'text'
      });
    }
  }, [mode, data, open]);

  const handleChange = (field: keyof QuestionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInsertVariable = (variable: string) => {
    setFormData(prev => ({ ...prev, message: prev.message + variable }));
  };

  const handleSave = () => {
    if (!formData.message || !formData.answerKey) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    // Gerenciar variáveis no localStorage
    let oldVariables = localStorage.getItem('variables');
    let variablesArray: string[] = oldVariables ? JSON.parse(oldVariables) : [];

    if (mode === 'edit' && data?.data?.typebotIntegration?.answerKey) {
      const oldKey = data.data.typebotIntegration.answerKey;
      variablesArray = variablesArray.filter(item => item !== oldKey);
    }

    if (!variablesArray.includes(formData.answerKey)) {
      variablesArray.push(formData.answerKey);
    }

    localStorage.setItem('variables', JSON.stringify(variablesArray));

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          typebotIntegration: formData 
        }
      });
    } else {
      onSave({ typebotIntegration: formData });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar pergunta ao fluxo' : 'Editar pergunta'}
          </DialogTitle>
          <DialogDescription>
            Configure uma pergunta para capturar resposta do usuário em variável
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <FormattedTextarea
              id="message"
              value={formData.message}
              onChange={(value) => handleChange('message', value)}
              placeholder="Digite a pergunta que será feita ao usuário..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Use *negrito*, _itálico_, ~sublinhado~ para formatar
            </p>
          </div>

          <VariablesHelper onInsert={handleInsertVariable} />

          <div className="space-y-2">
            <Label htmlFor="answerKey">Salvar resposta como *</Label>
            <VariableAutocomplete
              id="answerKey"
              value={formData.answerKey}
              onChange={(value) => handleChange('answerKey', value)}
              placeholder="nome_da_variavel"
              forceShowSuggestions={true}
            />
            <p className="text-xs text-muted-foreground">
              Nome da variável onde a resposta será armazenada (ex: nome_usuario, telefone)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answerType">Tipo de resposta esperada *</Label>
            <Select
              value={formData.answerType}
              onValueChange={(value) => handleChange('answerType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ANSWER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Exemplo:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pergunta: "Qual é o seu nome?"<br />
              Variável: nome_usuario<br />
              A resposta ficará disponível como: {`{{nome_usuario}}`}
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
