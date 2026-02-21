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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Save, X, Plus, Trash2, Bold, Italic, Underline, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

interface ButtonItem {
  id: string;
  title: string;
}

interface ButtonsData {
  body: string;
  footer?: string;
  buttons: ButtonItem[];
}

interface FlowBuilderButtonsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { buttonsData?: ButtonsData }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderButtonsModal: React.FC<FlowBuilderButtonsModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState<ButtonItem[]>([]);

  // Formatting menu state
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{ 
    x: number; 
    y: number; 
    start: number; 
    end: number; 
    field: 'body' | 'footer' 
  } | null>(null);
  
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLInputElement>(null);

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.buttonsData) {
      const buttonsData = data.data.buttonsData;
      setBody(buttonsData.body || '');
      setFooter(buttonsData.footer || '');
      setButtons(buttonsData.buttons || []);
    } else if (mode === 'create') {
      setBody('');
      setFooter('');
      setButtons([]);
    }
  }, [mode, data, open]);

  // Text selection handlers for formatting
  const handleTextSelect = (field: 'body' | 'footer') => {
    const ref = field === 'body' ? bodyRef : footerRef;
    const element = ref.current;
    if (!element) return;

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;

    if (start !== end) {
      const rect = element.getBoundingClientRect();
      setSelectionInfo({
        x: rect.left,
        y: rect.top - 50,
        start,
        end,
        field
      });
      setShowFormattingMenu(true);
    } else {
      setShowFormattingMenu(false);
    }
  };

  const applyFormatting = (format: string) => {
    if (!selectionInfo) return;

    const { field, start, end } = selectionInfo;
    const text = field === 'body' ? body : footer;
    const selectedText = text.substring(start, end);
    const formattedText = `${format}${selectedText}${format}`;
    const newText = text.substring(0, start) + formattedText + text.substring(end);

    if (field === 'body') setBody(newText);
    else setFooter(newText);

    setShowFormattingMenu(false);
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) {
      toast({
        title: "Limite atingido",
        description: "O WhatsApp permite no máximo 3 botões",
        variant: "destructive"
      });
      return;
    }
    
    setButtons(old => [
      ...old,
      {
        id: nanoid(),
        title: ''
      }
    ]);
  };

  const handleRemoveButton = (buttonId: string) => {
    setButtons(old => old.filter(b => b.id !== buttonId));
  };

  const handleButtonTitleChange = (buttonId: string, title: string) => {
    const truncatedTitle = title.substring(0, 20);
    setButtons(old => old.map(b => 
      b.id === buttonId ? { ...b, title: truncatedTitle } : b
    ));
  };

  const handleSave = () => {
    if (!body.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite a mensagem",
        variant: "destructive"
      });
      return;
    }

    if (buttons.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um botão",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyButton = buttons.some(b => !b.title.trim());
    if (hasEmptyButton) {
      toast({
        title: "Erro",
        description: "Todos os botões devem ter um título",
        variant: "destructive"
      });
      return;
    }

    const buttonsData: ButtonsData = {
      body: body.trim(),
      footer: footer.trim() || undefined,
      buttons
    };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          buttonsData 
        }
      });
    } else {
      onSave({ buttonsData });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Botões ao Fluxo' : 'Editar Botões'}
          </DialogTitle>
          <DialogDescription>
            Configure uma mensagem com botões interativos (máximo 3 botões)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 relative">
          {/* WhatsApp API Limit Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Limite da API WhatsApp</p>
              <p className="text-xs mt-1">
                O WhatsApp permite no máximo 3 botões por mensagem. Cada botão pode ter até 20 caracteres.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="buttons-body">Mensagem *</Label>
            <p className="text-xs text-muted-foreground">
              Selecione o texto para formatar: *negrito*, _itálico_, ~sublinhado~
            </p>
            <Textarea
              id="buttons-body"
              placeholder="Digite a mensagem que será exibida..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onSelect={() => handleTextSelect('body')}
              rows={3}
              className="resize-none"
              ref={bodyRef}
              maxLength={1024}
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/1024</p>
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <Label htmlFor="buttons-footer">Rodapé (opcional)</Label>
            <Input
              id="buttons-footer"
              placeholder="Ex: Selecione uma opção"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              onSelect={() => handleTextSelect('footer')}
              maxLength={60}
              ref={footerRef}
            />
            <p className="text-xs text-muted-foreground text-right">{footer.length}/60</p>
          </div>

          {/* Formatting Menu */}
          {showFormattingMenu && selectionInfo && (
            <div
              className="absolute bg-popover border rounded-md shadow-md p-1 flex gap-1 z-50"
              style={{
                top: '-45px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('*')}
                title="Negrito"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('_')}
                title="Itálico"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('~')}
                title="Sublinhado"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Botões ({buttons.length}/3)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddButton}
                disabled={buttons.length >= 3}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Botão
              </Button>
            </div>

            {buttons.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <p className="text-sm">Nenhum botão adicionado ainda</p>
                <p className="text-xs mt-1">Clique em "Adicionar Botão" para começar</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {buttons.map((button, index) => (
                  <Card key={button.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Título do Botão *</Label>
                          <span className="text-xs text-muted-foreground">
                            {button.title.length}/20
                          </span>
                        </div>
                        <Input
                          placeholder="Ex: Sim"
                          value={button.title}
                          onChange={(e) => handleButtonTitleChange(button.id, e.target.value)}
                          maxLength={20}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveButton(button.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {mode === 'create' ? 'Salvar' : 'Atualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
