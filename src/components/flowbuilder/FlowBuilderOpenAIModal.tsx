import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpenAIData {
  name: string;
  prompt: string;
  voice: string;
  voiceKey: string;
  voiceRegion: string;
  maxTokens: number;
  temperature: number;
  apiKey: string;
  queueId: number | null;
  maxMessages: number;
}

interface FlowBuilderOpenAIModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { typebotIntegration: OpenAIData; title?: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderOpenAIModal: React.FC<FlowBuilderOpenAIModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [formData, setFormData] = useState<OpenAIData>({
    name: '',
    prompt: '',
    voice: 'texto',
    voiceKey: '',
    voiceRegion: '',
    maxTokens: 100,
    temperature: 1,
    apiKey: '',
    queueId: null,
    maxMessages: 10
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
    
    if (mode === 'edit' && data?.data) {
      setFormData(data.data.typebotIntegration || {
        name: '',
        prompt: '',
        voice: 'texto',
        voiceKey: '',
        voiceRegion: '',
        maxTokens: 100,
        temperature: 1,
        apiKey: '',
        queueId: null,
        maxMessages: 10
      });
      setTitleValue(data.data.title || '');
    } else if (mode === 'create') {
      setFormData({
        name: '',
        prompt: '',
        voice: 'texto',
        voiceKey: '',
        voiceRegion: '',
        maxTokens: 100,
        temperature: 1,
        apiKey: '',
        queueId: null,
        maxMessages: 10
      });
      setTitleValue('');
    }
  }, [mode, data, open]);

  const handleChange = (field: keyof OpenAIData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.prompt) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = { ...formData, projectName: formData.name };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          typebotIntegration: dataToSave, 
          title: titleValue.trim() || undefined 
        }
      });
    } else {
      onSave({ typebotIntegration: dataToSave, title: titleValue.trim() || undefined });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar OpenAI ao fluxo' : 'Editar OpenAI'}
          </DialogTitle>
          <DialogDescription>
            Configure a integração com OpenAI para respostas inteligentes
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome da integração"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt do Sistema *</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="Você é um assistente útil que..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voice">Tipo de Voz</Label>
              <Select value={formData.voice} onValueChange={(value) => handleChange('voice', value)}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="voz">Voz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMessages">Máximo de Mensagens</Label>
              <Input
                id="maxMessages"
                type="number"
                value={formData.maxMessages}
                onChange={(e) => handleChange('maxMessages', Number(e.target.value))}
              />
            </div>
          </div>

          {formData.voice === 'voz' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voiceKey">Chave de Voz</Label>
                <Input
                  id="voiceKey"
                  value={formData.voiceKey}
                  onChange={(e) => handleChange('voiceKey', e.target.value)}
                  placeholder="Chave da API de voz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceRegion">Região da Voz</Label>
                <Input
                  id="voiceRegion"
                  value={formData.voiceRegion}
                  onChange={(e) => handleChange('voiceRegion', e.target.value)}
                  placeholder="ex: eastus"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Máximo de Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={formData.maxTokens}
                onChange={(e) => handleChange('maxTokens', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Limite de tokens na resposta (padrão: 100)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Criatividade (0 = preciso, 2 = criativo)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave API OpenAI</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="sk-..."
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
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
