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
import { Save, X, Plus, Trash2, FolderPlus, Bold, Italic, Underline } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

interface MenuRow {
  id: string;
  title: string;
  description: string;
}

interface MenuSection {
  id: string;
  title: string;
  rows: MenuRow[];
}

interface MenuData {
  header?: string;
  body: string;
  footer?: string;
  buttonText: string;
  sections: MenuSection[];
  title?: string;
}

interface FlowBuilderMenuModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { message: string; arrayOption?: any[]; menuData?: MenuData }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderMenuModal: React.FC<FlowBuilderMenuModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [buttonText, setButtonText] = useState('Ver opções');
  const [sections, setSections] = useState<MenuSection[]>([]);

  // Formatting menu state
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{ 
    x: number; 
    y: number; 
    start: number; 
    end: number; 
    field: 'header' | 'body' | 'footer' 
  } | null>(null);
  
  const headerRef = useRef<HTMLInputElement>(null);
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
    
    if (mode === 'edit' && data?.data) {
      // Novo formato
      if (data.data.menuData) {
        const menuData = data.data.menuData;
        setHeader(menuData.header || '');
        setBody(menuData.body || '');
        setFooter(menuData.footer || '');
        setButtonText(menuData.buttonText || 'Ver opções');
        setSections(menuData.sections || []);
      }
      // Formato antigo (compatibilidade)
      else if (data.data.arrayOption) {
        setHeader('');
        setBody(data.data.message || '');
        setFooter('');
        setButtonText('Ver opções');
        setSections([{
          id: nanoid(),
          title: 'Opções',
          rows: data.data.arrayOption.map((opt: any) => ({
            id: `option-${opt.number}`,
            title: opt.value || '',
            description: ''
          }))
        }]);
      }
    } else if (mode === 'create') {
      setHeader('');
      setBody('');
      setFooter('');
      setButtonText('Ver opções');
      setSections([]);
    }
  }, [mode, data, open]);

  // Text selection handlers for formatting
  const handleTextSelect = (field: 'header' | 'body' | 'footer') => {
    const ref = field === 'header' ? headerRef : field === 'body' ? bodyRef : footerRef;
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
    const text = field === 'header' ? header : field === 'body' ? body : footer;
    const selectedText = text.substring(start, end);
    const formattedText = `${format}${selectedText}${format}`;
    const newText = text.substring(0, start) + formattedText + text.substring(end);

    if (field === 'header') setHeader(newText);
    else if (field === 'body') setBody(newText);
    else setFooter(newText);

    setShowFormattingMenu(false);
  };

  const handleAddSection = () => {
    setSections(old => [
      ...old,
      {
        id: nanoid(),
        title: `Seção ${old.length + 1}`,
        rows: []
      }
    ]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(old => old.filter(s => s.id !== sectionId));
  };

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    setSections(old => old.map(s => 
      s.id === sectionId ? { ...s, title } : s
    ));
  };

  const handleAddRow = (sectionId: string) => {
    setSections(old => old.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          rows: [...s.rows, {
            id: nanoid(),
            title: '',
            description: ''
          }]
        };
      }
      return s;
    }));
  };

  const handleRemoveRow = (sectionId: string, rowId: string) => {
    setSections(old => old.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          rows: s.rows.filter(r => r.id !== rowId)
        };
      }
      return s;
    }));
  };

  const handleRowChange = (sectionId: string, rowId: string, field: 'title' | 'description', value: string) => {
    const maxLength = field === 'title' ? 24 : 72;
    const truncatedValue = value.substring(0, maxLength);
    
    setSections(old => old.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          rows: s.rows.map(r => 
            r.id === rowId ? { ...r, [field]: truncatedValue } : r
          )
        };
      }
      return s;
    }));
  };

  const handleSave = () => {
    if (!body.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite a mensagem do menu",
        variant: "destructive"
      });
      return;
    }

    if (!buttonText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o texto do botão",
        variant: "destructive"
      });
      return;
    }

    if (buttonText.length > 20) {
      toast({
        title: "Erro",
        description: "O texto do botão deve ter no máximo 20 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (sections.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma seção ao menu",
        variant: "destructive"
      });
      return;
    }

    const hasEmptySection = sections.some(s => s.rows.length === 0);
    if (hasEmptySection) {
      toast({
        title: "Erro",
        description: "Todas as seções devem ter pelo menos uma opção",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyRow = sections.some(s => 
      s.rows.some(r => !r.title.trim())
    );
    if (hasEmptyRow) {
      toast({
        title: "Erro",
        description: "Todas as opções devem ter um título",
        variant: "destructive"
      });
      return;
    }

    const menuData: MenuData = {
      header: header.trim() || undefined,
      body: body.trim(),
      footer: footer.trim() || undefined,
      buttonText: buttonText.trim(),
      sections
    };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          menuData 
        }
      });
    } else {
      onSave({ message: body, menuData });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Menu ao Fluxo' : 'Editar Menu'}
          </DialogTitle>
          <DialogDescription>
            Configure um menu interativo com múltiplas opções para o usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 relative">
          {/* Header */}
          <div className="space-y-2">
            <Label htmlFor="menu-header">Cabeçalho da Mensagem (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Selecione o texto para formatar: *negrito*, _itálico_, ~sublinhado~
            </p>
            <Input
              id="menu-header"
              placeholder="Ex: Menu Principal"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              onSelect={() => handleTextSelect('header')}
              maxLength={60}
              ref={headerRef}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="menu-body">Mensagem *</Label>
            <p className="text-xs text-muted-foreground">
              Selecione o texto para formatar: *negrito*, _itálico_, ~sublinhado~
            </p>
            <Textarea
              id="menu-body"
              placeholder="Digite a mensagem que será exibida no menu..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onSelect={() => handleTextSelect('body')}
              rows={3}
              className="resize-none"
              ref={bodyRef}
            />
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <Label htmlFor="menu-footer">Rodapé (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Selecione o texto para formatar: *negrito*, _itálico_, ~sublinhado~
            </p>
            <Input
              id="menu-footer"
              placeholder="Ex: Escolha uma opção"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              onSelect={() => handleTextSelect('footer')}
              maxLength={60}
              ref={footerRef}
            />
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

          {/* Button Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="menu-button">Texto do Botão *</Label>
              <span className="text-xs text-muted-foreground">
                {buttonText.length}/20
              </span>
            </div>
            <Input
              id="menu-button"
              placeholder="Ex: Ver opções"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value.substring(0, 20))}
              maxLength={20}
            />
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seções do Menu</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSection}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Adicionar Seção
              </Button>
            </div>

            {sections.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <p className="text-sm">Nenhuma seção adicionada ainda</p>
                <p className="text-xs mt-1">Clique em "Adicionar Seção" para começar</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <Card key={section.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Título da seção"
                        value={section.title}
                        onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(section.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {section.rows.map((row) => (
                        <Card key={row.id} className="p-3 bg-muted/30">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs">Título *</Label>
                                    <span className="text-xs text-muted-foreground">
                                      {row.title.length}/24
                                    </span>
                                  </div>
                                  <Input
                                    placeholder="Ex: Falar com vendas"
                                    value={row.title}
                                    onChange={(e) => handleRowChange(section.id, row.id, 'title', e.target.value)}
                                    maxLength={24}
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs">Descrição</Label>
                                    <span className="text-xs text-muted-foreground">
                                      {row.description.length}/72
                                    </span>
                                  </div>
                                  <Input
                                    placeholder="Ex: Tire suas dúvidas sobre nossos produtos"
                                    value={row.description}
                                    onChange={(e) => handleRowChange(section.id, row.id, 'description', e.target.value)}
                                    maxLength={72}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveRow(section.id, row.id)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddRow(section.id)}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Opção
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
