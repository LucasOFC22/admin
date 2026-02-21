import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TypebotData {
  name: string;
  projectName: string;
  urlN8N: string;
  typebotSlug: string;
  typebotExpires: number;
  typebotDelayMessage: number;
  typebotKeywordFinish: string;
  typebotKeywordRestart: string;
  typebotRestartMessage: string;
  typebotUnknownMessage: string;
}

interface FlowBuilderTypebotModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { typebotIntegration: TypebotData; title?: string }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderTypebotModal: React.FC<FlowBuilderTypebotModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [titleValue, setTitleValue] = useState('');
  const [formData, setFormData] = useState<TypebotData>({
    name: '',
    projectName: '',
    urlN8N: '',
    typebotSlug: '',
    typebotExpires: 1,
    typebotDelayMessage: 1000,
    typebotKeywordFinish: '',
    typebotKeywordRestart: '',
    typebotRestartMessage: '',
    typebotUnknownMessage: ''
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
        projectName: '',
        urlN8N: '',
        typebotSlug: '',
        typebotExpires: 1,
        typebotDelayMessage: 1000,
        typebotKeywordFinish: '',
        typebotKeywordRestart: '',
        typebotRestartMessage: '',
        typebotUnknownMessage: ''
      });
      setTitleValue(data.data.title || '');
    } else if (mode === 'create') {
      setFormData({
        name: '',
        projectName: '',
        urlN8N: '',
        typebotSlug: '',
        typebotExpires: 1,
        typebotDelayMessage: 1000,
        typebotKeywordFinish: '',
        typebotKeywordRestart: '',
        typebotRestartMessage: '',
        typebotUnknownMessage: ''
      });
      setTitleValue('');
    }
  }, [mode, data, open]);

  const handleChange = (field: keyof TypebotData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.urlN8N || !formData.typebotSlug) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Typebot ao fluxo' : 'Editar Typebot'}
          </DialogTitle>
          <DialogDescription>
            Configure a integração com Typebot para chatbot avançado
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome do Typebot"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typebotSlug">Typebot Slug *</Label>
              <Input
                id="typebotSlug"
                value={formData.typebotSlug}
                onChange={(e) => handleChange('typebotSlug', e.target.value)}
                placeholder="bot-slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlN8N">URL N8N *</Label>
            <Input
              id="urlN8N"
              value={formData.urlN8N}
              onChange={(e) => handleChange('urlN8N', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typebotExpires">Expira em (minutos)</Label>
              <Input
                id="typebotExpires"
                type="number"
                value={formData.typebotExpires}
                onChange={(e) => handleChange('typebotExpires', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typebotDelayMessage">Delay (ms)</Label>
              <Input
                id="typebotDelayMessage"
                type="number"
                value={formData.typebotDelayMessage}
                onChange={(e) => handleChange('typebotDelayMessage', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typebotKeywordFinish">Palavra-chave Finalizar</Label>
              <Input
                id="typebotKeywordFinish"
                value={formData.typebotKeywordFinish}
                onChange={(e) => handleChange('typebotKeywordFinish', e.target.value)}
                placeholder="#sair"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typebotKeywordRestart">Palavra-chave Reiniciar</Label>
              <Input
                id="typebotKeywordRestart"
                value={formData.typebotKeywordRestart}
                onChange={(e) => handleChange('typebotKeywordRestart', e.target.value)}
                placeholder="#reiniciar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typebotUnknownMessage">Mensagem Desconhecida</Label>
            <Input
              id="typebotUnknownMessage"
              value={formData.typebotUnknownMessage}
              onChange={(e) => handleChange('typebotUnknownMessage', e.target.value)}
              placeholder="Não entendi sua mensagem"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="typebotRestartMessage">Mensagem de Reinício</Label>
            <Input
              id="typebotRestartMessage"
              value={formData.typebotRestartMessage}
              onChange={(e) => handleChange('typebotRestartMessage', e.target.value)}
              placeholder="Bot reiniciado"
            />
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
