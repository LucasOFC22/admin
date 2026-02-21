import { useState } from 'react';
import { X, Image, Video, FileText, Plus, Trash2, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (template: TemplateData) => void;
  businessInfo?: {
    name?: string;
    profilePicture?: string;
  };
}

interface TemplateLanguage {
  code: string;
  name: string;
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    content?: string;
  };
  body: string;
  footer?: string;
  buttons?: Array<{
    type: 'url' | 'reply';
    text: string;
    url?: string;
  }>;
  variables?: Array<{
    name: string;
    example: string;
  }>;
}

interface TemplateData {
  name: string;
  category: string;
  languages: TemplateLanguage[];
}

const LANGUAGES = [
  { code: 'pt_BR', name: 'Portuguese (BR)' },
  { code: 'en_US', name: 'English (US)' },
  { code: 'es', name: 'Spanish' },
];

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Autenticação' },
];

const CreateTemplateModal = ({ open, onOpenChange, onSubmit, businessInfo }: CreateTemplateModalProps) => {
  const [step, setStep] = useState<'initial' | 'editor'>('initial');
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('');
  const [languages, setLanguages] = useState<TemplateLanguage[]>([]);
  const [activeLanguageIndex, setActiveLanguageIndex] = useState(0);
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  const activeLanguage = languages[activeLanguageIndex];

  const handleAddLanguage = (code: string) => {
    const langInfo = LANGUAGES.find(l => l.code === code);
    if (langInfo && !languages.find(l => l.code === code)) {
      setLanguages([...languages, {
        code,
        name: langInfo.name,
        body: '',
        buttons: [],
        variables: [],
      }]);
      setActiveLanguageIndex(languages.length);
    }
    setShowAddLanguage(false);
    setStep('editor');
  };

  const updateActiveLanguage = (updates: Partial<TemplateLanguage>) => {
    setLanguages(prev => prev.map((lang, i) => 
      i === activeLanguageIndex ? { ...lang, ...updates } : lang
    ));
  };

  const handleHeaderTypeChange = (type: 'text' | 'image' | 'video' | 'document' | 'none') => {
    if (type === 'none') {
      updateActiveLanguage({ header: undefined });
    } else {
      updateActiveLanguage({ header: { type, content: '' } });
    }
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)];
  };

  const handleBodyChange = (body: string) => {
    const variableNumbers = extractVariables(body);
    const existingVariables = activeLanguage?.variables || [];
    
    const updatedVariables = variableNumbers.map(num => {
      const existing = existingVariables.find(v => v.name === `{{${num}}}`);
      return existing || { name: `{{${num}}}`, example: '' };
    });
    
    updateActiveLanguage({ body, variables: updatedVariables });
  };

  const handleVariableExampleChange = (index: number, example: string) => {
    const newVariables = [...(activeLanguage?.variables || [])];
    newVariables[index] = { ...newVariables[index], example };
    updateActiveLanguage({ variables: newVariables });
  };

  const handleAddButton = (type: 'url' | 'reply') => {
    const buttons = activeLanguage?.buttons || [];
    if (buttons.length >= 3 && type === 'reply') return;
    if (buttons.length >= 1 && type === 'url' && buttons.some(b => b.type === 'url')) return;
    
    updateActiveLanguage({
      buttons: [...buttons, { type, text: '', url: type === 'url' ? '' : undefined }]
    });
  };

  const handleUpdateButton = (index: number, updates: Partial<{ text: string; url: string }>) => {
    const buttons = [...(activeLanguage?.buttons || [])];
    buttons[index] = { ...buttons[index], ...updates };
    updateActiveLanguage({ buttons });
  };

  const handleRemoveButton = (index: number) => {
    updateActiveLanguage({
      buttons: (activeLanguage?.buttons || []).filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        name: templateName,
        category,
        languages,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('initial');
    setTemplateName('');
    setCategory('');
    setLanguages([]);
    setActiveLanguageIndex(0);
    onOpenChange(false);
  };

  const getPreviewMessage = () => {
    if (!activeLanguage) return '';
    let text = activeLanguage.body;
    (activeLanguage.variables || []).forEach(v => {
      text = text.replace(v.name, v.example || v.name);
    });
    return text;
  };

  const renderInitialStep = () => (
    <div className="flex gap-6 h-[600px]">
      {/* Formulário lado esquerdo */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
        <div className="space-y-2">
          <Label>Nome do Modelo</Label>
          <Input 
            placeholder="Nome em inglês" 
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          />
          <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e underscore</p>
        </div>

        <div className="space-y-2">
          <Label>Categoria do modelo</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione Uma Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Idiomas</Label>
          {languages.map((lang, index) => (
            <div 
              key={lang.code}
              className={cn(
                "p-3 border rounded-lg cursor-pointer transition-colors",
                activeLanguageIndex === index ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => {
                setActiveLanguageIndex(index);
                setStep('editor');
              }}
            >
              <span className="text-sm font-medium">{lang.name}</span>
            </div>
          ))}
          
          <button 
            onClick={() => setShowAddLanguage(true)}
            className="flex items-center gap-2 text-primary text-sm hover:underline"
          >
            <Plus className="h-4 w-4" />
            Novo idioma
          </button>

          {showAddLanguage && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <Label className="text-xs">Selecionar idioma</Label>
              <Select onValueChange={handleAddLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um idioma" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(l => !languages.find(lang => lang.code === l.code)).map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Ilustração lado direito */}
      <div className="w-80 flex flex-col items-center justify-center bg-muted/30 rounded-xl p-6">
        <div className="w-24 h-24 mb-4">
          <img 
            src="/placeholder.svg" 
            alt="WhatsApp" 
            className="w-full h-full opacity-50"
          />
        </div>
        <p className="text-center text-muted-foreground text-sm">
          Comece adicionando um idioma ao modelo de mensagem
        </p>
      </div>
    </div>
  );

  const renderEditorStep = () => (
    <div className="flex gap-6 h-[600px]">
      {/* Formulário lado esquerdo */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-semibold">{templateName || 'Novo Modelo'} • {activeLanguage?.name}</h3>
            <p className="text-xs text-muted-foreground">
              A aprovação do Meta é necessária antes de enviar um novo modelo. Esse processo pode levar de alguns minutos até 24 horas.
            </p>
          </div>
          <Button size="sm">Enviar Para Análise</Button>
        </div>

        {/* Cabeçalho */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Cabeçalho</Label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          <div className="flex gap-2">
            {[
              { type: 'text', icon: FileText, label: 'Texto' },
              { type: 'image', icon: Image, label: 'Imagem' },
              { type: 'video', icon: Video, label: 'Vídeo' },
              { type: 'document', icon: FileText, label: 'Arquivo' },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => handleHeaderTypeChange(type as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border rounded-full text-sm transition-colors",
                  activeLanguage?.header?.type === type 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {activeLanguage?.header?.type === 'text' && (
            <Input 
              placeholder="Texto do cabeçalho"
              value={activeLanguage.header.content || ''}
              onChange={(e) => updateActiveLanguage({ 
                header: { ...activeLanguage.header!, content: e.target.value }
              })}
            />
          )}
        </div>

        {/* Mensagem */}
        <div className="space-y-3">
          <Label>Mensagem</Label>
          <Textarea 
            placeholder="Mensagem de texto"
            value={activeLanguage?.body || ''}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            A mensagem deve estar no idioma selecionado acima.
          </p>
        </div>

        {/* Variáveis */}
        {(activeLanguage?.variables?.length || 0) > 0 && (
          <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-500">ⓘ</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Forneça amostras de suas variáveis</p>
                <p className="text-xs text-blue-700">
                  Para as variáveis usadas, você precisa dar exemplos para que o WhatsApp possa verificá-las. Por exemplo, Nome → João.
                </p>
              </div>
            </div>
            
            {activeLanguage?.variables?.map((variable, index) => (
              <div key={variable.name} className="flex items-center gap-3">
                <Input 
                  value={variable.name.replace(/[{}]/g, '')}
                  disabled
                  className="w-32 bg-white"
                />
                <span className="text-muted-foreground">→</span>
                <Input 
                  placeholder="Exemplo"
                  value={variable.example}
                  onChange={(e) => handleVariableExampleChange(index, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Rodapé</Label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          <div className="relative">
            <Input 
              placeholder="Texto do rodapé"
              value={activeLanguage?.footer || ''}
              onChange={(e) => updateActiveLanguage({ footer: e.target.value })}
              maxLength={60}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {60 - (activeLanguage?.footer?.length || 0)}
            </span>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Botões</Label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          
          <Select 
            value=""
            onValueChange={(value) => {
              if (value === 'url') handleAddButton('url');
              if (value === 'reply') handleAddButton('reply');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione O Tipo De Botão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">Botão URL</SelectItem>
              <SelectItem value="reply">Botão de resposta</SelectItem>
            </SelectContent>
          </Select>
          
          <p className="text-xs text-muted-foreground">
            Você pode adicionar até três botões normais ou um botão de URL. Somente um tipo de botão pode ser selecionado, não dois.
          </p>

          {activeLanguage?.buttons?.map((button, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder="Texto do botão"
                  value={button.text}
                  onChange={(e) => handleUpdateButton(index, { text: e.target.value })}
                />
                {button.type === 'url' && (
                  <Input 
                    placeholder="URL"
                    value={button.url || ''}
                    onChange={(e) => handleUpdateButton(index, { url: e.target.value })}
                  />
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleRemoveButton(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview lado direito */}
      <div className="w-80 flex flex-col">
        <div className="flex-1 bg-[#e5ddd5] rounded-xl overflow-hidden flex flex-col">
          {/* Header do celular */}
          <div className="bg-[#075e54] text-white p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {businessInfo?.profilePicture ? (
                <img src={businessInfo.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{businessInfo?.name || 'WhatsApp Business'}</p>
            </div>
          </div>
          
          {/* Mensagens */}
          <div className="flex-1 p-4 space-y-2">
            {activeLanguage?.body && (
              <div className="bg-white rounded-lg p-3 max-w-[85%] shadow-sm">
                {activeLanguage?.header?.type === 'text' && activeLanguage.header.content && (
                  <p className="font-semibold text-sm mb-1">{activeLanguage.header.content}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
                {activeLanguage?.footer && (
                  <p className="text-xs text-muted-foreground mt-2">{activeLanguage.footer}</p>
                )}
                {(activeLanguage?.buttons?.length || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {activeLanguage?.buttons?.map((btn, i) => (
                      <button 
                        key={i}
                        className="w-full py-2 text-primary text-sm font-medium"
                      >
                        {btn.text || 'Botão'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader className="flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-xl">
            {step === 'initial' ? 'Criar Modelo' : 'Editar Modelo'}
          </DialogTitle>
          {step === 'editor' && (
            <Button variant="ghost" size="sm" onClick={() => setStep('initial')}>
              Voltar
            </Button>
          )}
        </DialogHeader>
        
        {step === 'initial' ? renderInitialStep() : renderEditorStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateModal;
