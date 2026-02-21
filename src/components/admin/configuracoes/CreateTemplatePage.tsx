import { useState, useEffect } from 'react';
import { ArrowLeft, Image, Video, FileText, Plus, Trash2, MessageCircle, Send, Type, ExternalLink, Phone, Copy, Check, ChevronDown, Globe, PhoneCall, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { backendService } from '@/services/api/backendService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos de botões
type ButtonType = 'custom' | 'visit_website' | 'call_whatsapp' | 'call' | 'complete_flow' | 'copy_offer_code';
type ButtonCategory = 'quick_reply' | 'call_to_action';

interface TemplateButton {
  id: string;
  type: ButtonType;
  category: ButtonCategory;
  text: string;
  // Campos específicos por tipo
  url?: string;
  urlType?: 'static' | 'dynamic';
  sampleUrl?: string;
  trackConversions?: boolean;
  phone?: string;
  country?: string;
  activeDays?: number;
  buttonIcon?: string;
  offerCode?: string;
}

interface TemplateLanguage {
  code: string;
  name: string;
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    content?: string;
    variableType?: 'name' | 'phone';
  };
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  variables?: Array<{
    name: string;
    example: string;
  }>;
}

interface MessageTemplateEdit {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components?: any[];
}

interface CreateTemplatePageProps {
  businessInfo?: {
    name?: string;
    profilePicture?: string;
  };
  onBack?: () => void;
  editMode?: boolean;
  templateToEdit?: MessageTemplateEdit | null;
  conexaoId?: string;
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

const COUNTRIES = [
  { code: '+55', name: 'Brasil' },
  { code: '+1', name: 'Estados Unidos' },
  { code: '+351', name: 'Portugal' },
  { code: '+34', name: 'Espanha' },
  { code: '+44', name: 'Reino Unido' },
];

const ACTIVE_DAYS_OPTIONS = [
  { value: 1, label: '1 dia' },
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
];

const BUTTON_ICONS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'calendar', label: 'Calendário' },
  { value: 'check', label: 'Check' },
  { value: 'star', label: 'Estrela' },
];

const generateButtonId = () => Math.random().toString(36).substring(2, 9);

// Regex para detectar caracteres não permitidos no header (emojis, asteriscos, formatação)
const HEADER_INVALID_CHARS_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}*_~]/gu;

// Valida se o texto do header contém caracteres não permitidos
const validateHeaderText = (text: string): { valid: boolean; message?: string } => {
  if (!text) return { valid: true };
  
  // Verifica emojis e formatação
  if (HEADER_INVALID_CHARS_REGEX.test(text)) {
    return { 
      valid: false, 
      message: 'O cabeçalho não pode conter emojis, asteriscos (*), underline (_) ou til (~)' 
    };
  }
  
  // Verifica quebras de linha
  if (/[\n\r]/.test(text)) {
    return { 
      valid: false, 
      message: 'O cabeçalho não pode conter quebras de linha' 
    };
  }
  
  return { valid: true };
};

const CreateTemplatePage = ({ businessInfo, onBack, editMode = false, templateToEdit, conexaoId }: CreateTemplatePageProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'initial' | 'editor'>(editMode ? 'editor' : 'initial');
  const [templateName, setTemplateName] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [languages, setLanguages] = useState<TemplateLanguage[]>([]);
  const [activeLanguageIndex, setActiveLanguageIndex] = useState(0);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);

  // Carregar dados do template para edição
  useEffect(() => {
    if (editMode && templateToEdit) {
      setTemplateName(templateToEdit.name);
      setTemplateId(templateToEdit.id);
      setCategory(templateToEdit.category);
      
      // Converter components para o formato interno
      if (templateToEdit.components && templateToEdit.components.length > 0) {
        const langCode = templateToEdit.language || 'pt_BR';
        const langInfo = LANGUAGES.find(l => l.code === langCode) || { code: langCode, name: langCode };
        
        const parsedLanguage: TemplateLanguage = {
          code: langInfo.code,
          name: langInfo.name,
          body: '',
          buttons: [],
          variables: [],
        };

        // Extrair componentes
        templateToEdit.components.forEach((component: any) => {
          if (component.type === 'HEADER' && component.format === 'TEXT') {
            parsedLanguage.header = {
              type: 'text',
              content: component.text || '',
            };
          } else if (component.type === 'BODY') {
            parsedLanguage.body = component.text || '';
          } else if (component.type === 'FOOTER') {
            parsedLanguage.footer = component.text || '';
          }
        });

        // Extrair variáveis do body e header
        const extractVars = (text: string): string[] => {
          const regex = /\{\{(\d+)\}\}/g;
          const matches = [];
          let match;
          while ((match = regex.exec(text)) !== null) {
            matches.push(match[1]);
          }
          return [...new Set(matches)];
        };

        const allVarNumbers = [
          ...extractVars(parsedLanguage.header?.content || ''),
          ...extractVars(parsedLanguage.body)
        ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseInt(a) - parseInt(b));

        parsedLanguage.variables = allVarNumbers.map(num => ({
          name: `{{${num}}}`,
          example: ''
        }));

        setLanguages([parsedLanguage]);
        setActiveLanguageIndex(0);
      }
    }
  }, [editMode, templateToEdit]);

  const activeLanguage = languages[activeLanguageIndex];

  const handleBack = () => {
    if (step === 'editor' && languages.length > 0 && !editMode) {
      setStep('initial');
    } else if (onBack) {
      onBack();
    } else {
      navigate('#whatsapp-modelos', { replace: true });
    }
  };

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
      updateActiveLanguage({ header: { type, content: '', variableType: undefined } });
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

  // Extrai e unifica variáveis do cabeçalho e corpo
  const getAllVariables = (headerContent: string | undefined, body: string) => {
    const headerVars = headerContent ? extractVariables(headerContent) : [];
    const bodyVars = extractVariables(body);
    const allVarNumbers = [...new Set([...headerVars, ...bodyVars])].sort((a, b) => parseInt(a) - parseInt(b));
    return allVarNumbers;
  };

  const updateVariablesFromContent = (headerContent: string | undefined, body: string) => {
    const variableNumbers = getAllVariables(headerContent, body);
    const existingVariables = activeLanguage?.variables || [];
    
    const updatedVariables = variableNumbers.map(num => {
      const existing = existingVariables.find(v => v.name === `{{${num}}}`);
      return existing || { name: `{{${num}}}`, example: '' };
    });
    
    return updatedVariables;
  };

  const handleBodyChange = (body: string) => {
    const headerContent = activeLanguage?.header?.type === 'text' ? activeLanguage.header.content : undefined;
    const updatedVariables = updateVariablesFromContent(headerContent, body);
    updateActiveLanguage({ body, variables: updatedVariables });
  };

  const handleHeaderContentChange = (content: string) => {
    // Validar o conteúdo do header
    const validation = validateHeaderText(content);
    setHeaderError(validation.valid ? null : validation.message || null);
    
    const updatedVariables = updateVariablesFromContent(content, activeLanguage?.body || '');
    updateActiveLanguage({ 
      header: { ...activeLanguage?.header!, content },
      variables: updatedVariables
    });
  };

  const handleVariableExampleChange = (index: number, example: string) => {
    const newVariables = [...(activeLanguage?.variables || [])];
    newVariables[index] = { ...newVariables[index], example };
    updateActiveLanguage({ variables: newVariables });
  };

  // Funções para gerenciar botões
  const getButtonCount = (type: ButtonType) => {
    return (activeLanguage?.buttons || []).filter(b => b.type === type).length;
  };

  const canAddButton = (type: ButtonType) => {
    const buttons = activeLanguage?.buttons || [];
    if (buttons.length >= 10) return false;
    
    // Limites específicos por tipo
    const limits: Record<ButtonType, number> = {
      custom: 10,
      visit_website: 2,
      call_whatsapp: 1,
      call: 1,
      complete_flow: 1,
      copy_offer_code: 1,
    };
    
    return getButtonCount(type) < limits[type];
  };

  const handleAddButton = (type: ButtonType, category: ButtonCategory) => {
    if (!canAddButton(type)) return;
    
    const newButton: TemplateButton = {
      id: generateButtonId(),
      type,
      category,
      text: '',
    };

    // Valores padrão por tipo
    if (type === 'visit_website') {
      newButton.urlType = 'static';
      newButton.url = '';
      newButton.trackConversions = false;
    } else if (type === 'call_whatsapp') {
      newButton.activeDays = 7;
    } else if (type === 'call') {
      newButton.country = '+55';
      newButton.phone = '';
    } else if (type === 'complete_flow') {
      newButton.buttonIcon = 'none';
    } else if (type === 'copy_offer_code') {
      newButton.offerCode = '';
    }

    updateActiveLanguage({
      buttons: [...(activeLanguage?.buttons || []), newButton]
    });
  };

  const handleUpdateButton = (id: string, updates: Partial<TemplateButton>) => {
    const buttons = (activeLanguage?.buttons || []).map(btn =>
      btn.id === id ? { ...btn, ...updates } : btn
    );
    updateActiveLanguage({ buttons });
  };

  const handleRemoveButton = (id: string) => {
    updateActiveLanguage({
      buttons: (activeLanguage?.buttons || []).filter(btn => btn.id !== id)
    });
  };

  const getPreviewHeader = () => {
    if (!activeLanguage?.header?.content) return '';
    let text = activeLanguage.header.content;
    (activeLanguage.variables || []).forEach(v => {
      text = text.replace(v.name, v.example || v.name);
    });
    return text;
  };

  const getPreviewMessage = () => {
    if (!activeLanguage) return '';
    let text = activeLanguage.body;
    (activeLanguage.variables || []).forEach(v => {
      text = text.replace(v.name, v.example || v.name);
    });
    return text;
  };

  const handleSubmit = async () => {
    if (!templateName || !category || languages.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const activeLanguage = languages[activeLanguageIndex];
    if (!activeLanguage?.body) {
      toast.error('O corpo da mensagem é obrigatório');
      return;
    }

    // Validar header antes de enviar
    if (activeLanguage?.header?.type === 'text' && activeLanguage.header.content) {
      const headerValidation = validateHeaderText(activeLanguage.header.content);
      if (!headerValidation.valid) {
        toast.error(headerValidation.message || 'Cabeçalho inválido');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Buscar conexão para obter o conexaoId
      const supabase = requireAuthenticatedClient();
      const { data: conexao, error: conexaoError } = await supabase
        .from('conexoes')
        .select('id')
        .limit(1)
        .single();

      if (conexaoError || !conexao) {
        toast.error('Nenhuma conexão WhatsApp configurada');
        setIsSubmitting(false);
        return;
      }

      // Formatar componentes no formato da API Meta
      const components: any[] = [];

      // Função para renumerar variáveis de um texto começando do 1
      const renumberVariables = (text: string): string => {
        const vars = extractVariables(text);
        let newText = text;
        vars.forEach((varNum, index) => {
          const newVarNum = index + 1;
          if (parseInt(varNum) !== newVarNum) {
            newText = newText.replace(new RegExp(`\\{\\{${varNum}\\}\\}`, 'g'), `{{${newVarNum}}}`);
          }
        });
        return newText;
      };

      // Header
      if (activeLanguage.header) {
        const headerComponent: any = {
          type: 'HEADER',
          format: activeLanguage.header.type.toUpperCase(),
        };
        
        if (activeLanguage.header.type === 'text' && activeLanguage.header.content) {
          // Renumerar variáveis do header começando do 1
          const headerVars = extractVariables(activeLanguage.header.content);
          headerComponent.text = renumberVariables(activeLanguage.header.content);
          
          // Adicionar exemplos para variáveis no header (obrigatório pela API Meta)
          if (headerVars.length > 0) {
            const headerExamples = headerVars.map(varNum => {
              const variable = activeLanguage.variables?.find(v => v.name === `{{${varNum}}}`);
              return variable?.example || 'exemplo';
            });
            headerComponent.example = {
              header_text: headerExamples
            };
          }
        }
        
        components.push(headerComponent);
      }

      // Body (obrigatório) - renumerar variáveis começando do 1
      const bodyVars = extractVariables(activeLanguage.body);
      const bodyComponent: any = {
        type: 'BODY',
        text: renumberVariables(activeLanguage.body),
      };

      // Adicionar exemplos APENAS para variáveis do body (não do header)
      if (bodyVars.length > 0) {
        const bodyExamples = bodyVars.map(varNum => {
          const variable = activeLanguage.variables?.find(v => v.name === `{{${varNum}}}`);
          return variable?.example || 'exemplo';
        });
        bodyComponent.example = {
          body_text: [bodyExamples]
        };
      }

      components.push(bodyComponent);

      // Footer
      if (activeLanguage.footer) {
        components.push({
          type: 'FOOTER',
          text: activeLanguage.footer,
        });
      }

      // Buttons
      if (activeLanguage.buttons && activeLanguage.buttons.length > 0) {
        const buttons = activeLanguage.buttons.map(btn => {
          if (btn.category === 'quick_reply') {
            return {
              type: 'QUICK_REPLY',
              text: btn.text,
            };
          }
          
          // Call to action buttons
          if (btn.type === 'visit_website') {
            const urlButton: any = {
              type: 'URL',
              text: btn.text,
              url: btn.url || '',
            };
            if (btn.urlType === 'dynamic') {
              urlButton.example = [btn.sampleUrl || btn.url];
            }
            return urlButton;
          }
          
          if (btn.type === 'call') {
            return {
              type: 'PHONE_NUMBER',
              text: btn.text,
              phone_number: `${btn.country || '+55'}${btn.phone || ''}`.replace(/\D/g, ''),
            };
          }

          if (btn.type === 'copy_offer_code') {
            return {
              type: 'COPY_CODE',
              example: btn.offerCode || '',
            };
          }

          return {
            type: 'QUICK_REPLY',
            text: btn.text,
          };
        });

        components.push({
          type: 'BUTTONS',
          buttons,
        });
      }

      console.log('📤 Enviando template:', { name: templateName, category, language: activeLanguage.code, components });

      let response;
      
      if (editMode && templateToEdit?.id) {
        // Modo de edição - usar a função de editar
        response = await backendService.editarModeloWhatsApp({
          conexaoId: conexao.id,
          templateId: templateToEdit.id,
          components,
        });
      } else {
        // Modo de criação - usar a função de criar
        response = await backendService.criarModeloWhatsApp({
          conexaoId: conexao.id,
          name: templateName,
          category,
          language: activeLanguage.code,
          components,
        });
      }

      if (response.success) {
        toast.success(response.message || 'Template criado com sucesso!');
        // Voltar para a lista de modelos
        if (onBack) {
          onBack();
        } else {
          navigate('#whatsapp-modelos', { replace: true });
        }
      } else {
        toast.error(response.error || 'Erro ao criar template');
        console.error('Erro detalhado:', response.data);
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro inesperado ao criar template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonTypeLabel = (type: ButtonType) => {
    const labels: Record<ButtonType, string> = {
      custom: 'Personalizado',
      visit_website: 'Acessar o site',
      call_whatsapp: 'Ligar no WhatsApp',
      call: 'Ligar',
      complete_flow: 'Concluir flow',
      copy_offer_code: 'Copiar código da oferta',
    };
    return labels[type];
  };

  const getButtonIcon = (type: ButtonType) => {
    switch (type) {
      case 'visit_website': return <ExternalLink className="h-4 w-4" />;
      case 'call_whatsapp': return <Phone className="h-4 w-4" />;
      case 'call': return <PhoneCall className="h-4 w-4" />;
      case 'copy_offer_code': return <Copy className="h-4 w-4" />;
      case 'complete_flow': return <Check className="h-4 w-4" />;
      default: return null;
    }
  };

  // Renderiza campos específicos por tipo de botão
  const renderButtonFields = (button: TemplateButton) => {
    switch (button.type) {
      case 'custom':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Input value="Resposta Rápida" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
        );

      case 'visit_website':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
              <Input value="Acessar o site" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de URL</Label>
              <Select 
                value={button.urlType} 
                onValueChange={(v) => handleUpdateButton(button.id, { urlType: v as 'static' | 'dynamic' })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Estática</SelectItem>
                  <SelectItem value="dynamic">Dinâmica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL do site</Label>
              <Input 
                placeholder={button.urlType === 'dynamic' ? "https://exemplo.com/{{1}}" : "https://exemplo.com"}
                value={button.url || ''}
                onChange={(e) => handleUpdateButton(button.id, { url: e.target.value })}
                className="bg-background"
              />
            </div>
            {button.urlType === 'dynamic' && (
              <div className="space-y-1 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <Label className="text-xs text-muted-foreground">Adicionar URL da amostra</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Para criar um modelo de mensagem com um URL dinâmico, você precisa inserir uma amostra de URL. Insira um URL completo incluindo "https://".
                </p>
                <Input 
                  placeholder="https://exemplo.com/pagina-exemplo"
                  value={button.sampleUrl || ''}
                  onChange={(e) => handleUpdateButton(button.id, { sampleUrl: e.target.value })}
                  className="bg-background"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`track-${button.id}`}
                checked={button.trackConversions}
                onCheckedChange={(checked) => handleUpdateButton(button.id, { trackConversions: !!checked })}
              />
              <label htmlFor={`track-${button.id}`} className="text-sm cursor-pointer">
                Rastrear conversões
              </label>
            </div>
          </div>
        );

      case 'call_whatsapp':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
              <Input value="Ligar no WhatsApp" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ativo por</Label>
              <Select 
                value={button.activeDays?.toString()} 
                onValueChange={(v) => handleUpdateButton(button.id, { activeDays: parseInt(v) })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_DAYS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'call':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
              <Input value="Ligar" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">País</Label>
                <Select 
                  value={button.country} 
                  onValueChange={(v) => handleUpdateButton(button.id, { country: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input 
                  placeholder="11999999999"
                  value={button.phone || ''}
                  onChange={(e) => handleUpdateButton(button.id, { phone: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        );

      case 'complete_flow':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
              <Input value="Concluir flow" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ícone de botão</Label>
              <Select 
                value={button.buttonIcon} 
                onValueChange={(v) => handleUpdateButton(button.id, { buttonIcon: v })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_ICONS.map(icon => (
                    <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-1" />
                Criar novo
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Usar existente
              </Button>
            </div>
          </div>
        );

      case 'copy_offer_code':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de ação</Label>
              <Input value="Copiar código da oferta" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                <span className="text-xs text-muted-foreground">{button.text.length}/25</span>
              </div>
              <Input 
                placeholder="Texto do botão"
                value={button.text}
                maxLength={25}
                onChange={(e) => handleUpdateButton(button.id, { text: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Código da oferta</Label>
                <span className="text-xs text-muted-foreground">{(button.offerCode || '').length}/20</span>
              </div>
              <Input 
                placeholder="CODIGO123"
                value={button.offerCode || ''}
                maxLength={20}
                onChange={(e) => handleUpdateButton(button.id, { offerCode: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Tela inicial
  if (step === 'initial') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Criar Modelo de Mensagem</h2>
            <p className="text-sm text-muted-foreground">Configure seu modelo de mensagem do WhatsApp</p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Formulário lado esquerdo */}
          <div className="flex-1 max-w-md space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome do Modelo</Label>
              <Input 
                placeholder="Nome em inglês" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e underscore</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria do modelo</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background">
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
              <Label className="text-sm font-medium">Idiomas</Label>
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

          {/* Ilustração central/direita */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 rounded-2xl p-12 min-h-[400px]">
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl opacity-20" />
              <div className="absolute inset-4 flex items-center justify-center">
                <MessageCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <p className="text-center text-muted-foreground text-sm max-w-xs">
              Comece adicionando um idioma ao modelo de mensagem
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela do editor
  return (
    <div className="space-y-6">
      {/* Header do editor */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-lg">{templateName || 'Novo Modelo'} • {activeLanguage?.name}</h3>
            <p className="text-xs text-muted-foreground">
              A aprovação do Meta é necessária antes de enviar um novo modelo.
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Para Análise
            </>
          )}
        </Button>
      </div>

      {/* Aviso amarelo */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 text-xs font-bold flex-shrink-0">!</div>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          A aprovação do Meta é necessária antes de enviar um novo modelo. Esse processo pode levar de alguns minutos até 24 horas.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Formulário lado esquerdo */}
        <div className="flex-1 space-y-6 max-w-2xl">
          {/* Cabeçalho */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Cabeçalho</Label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { type: 'text', icon: Type, label: 'Texto' },
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
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "hover:bg-muted/50 border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            {activeLanguage?.header?.type === 'text' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Texto do cabeçalho</Label>
                  <p className="text-xs text-muted-foreground">
                    Adicione uma pequena linha de texto ao cabeçalho da sua mensagem em Português
                  </p>
                  <div className="relative">
                    <Input 
                      placeholder="Texto do cabeçalho. Use {{1}} para variáveis"
                      value={activeLanguage.header.content || ''}
                      onChange={(e) => handleHeaderContentChange(e.target.value.slice(0, 60))}
                      maxLength={60}
                      className={cn("bg-background", headerError && "border-destructive")}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {(activeLanguage.header.content || '').length}/60
                    </span>
                  </div>
                  {headerError && (
                    <p className="text-xs text-destructive mt-1">{headerError}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo de variável</Label>
                  <Select 
                    value={activeLanguage.header.variableType || ''} 
                    onValueChange={(v) => updateActiveLanguage({
                      header: { ...activeLanguage.header!, variableType: v as 'name' | 'phone' }
                    })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o tipo de variável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Mensagem */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mensagem</Label>
            <div className="relative">
              <Textarea 
                placeholder="Escreva sua mensagem aqui... Use {{1}}, {{2}} para variáveis"
                value={activeLanguage?.body || ''}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={5}
                className="resize-none bg-background pr-12"
              />
              <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {activeLanguage?.body?.length || 0}/1024
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              A mensagem deve estar no idioma selecionado acima.
            </p>
          </div>

          {/* Variáveis - calculadas do cabeçalho e corpo */}
          {(() => {
            const headerContent = activeLanguage?.header?.type === 'text' ? activeLanguage.header.content : undefined;
            const bodyContent = activeLanguage?.body || '';
            const allVarNumbers = getAllVariables(headerContent, bodyContent);
            
            if (allVarNumbers.length === 0) return null;
            
            return (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-lg">ⓘ</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Forneça amostras de suas variáveis</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Para as variáveis usadas, você precisa dar exemplos para que o WhatsApp possa verificá-las. Por exemplo, Nome → João.
                    </p>
                  </div>
                </div>
                
                {allVarNumbers.map((num, index) => {
                  const variable = activeLanguage?.variables?.find(v => v.name === `{{${num}}}`);
                  return (
                    <div key={num} className="flex items-center gap-3">
                      <Input 
                        value={num}
                        disabled
                        className="w-24 bg-white dark:bg-background text-center font-mono text-sm"
                      />
                      <span className="text-muted-foreground">→</span>
                      <Input 
                        placeholder="Exemplo"
                        value={variable?.example || ''}
                        onChange={(e) => {
                          const newVariables = [...(activeLanguage?.variables || [])];
                          const existingIndex = newVariables.findIndex(v => v.name === `{{${num}}}`);
                          if (existingIndex >= 0) {
                            newVariables[existingIndex] = { ...newVariables[existingIndex], example: e.target.value };
                          } else {
                            newVariables.push({ name: `{{${num}}}`, example: e.target.value });
                          }
                          updateActiveLanguage({ variables: newVariables });
                        }}
                        className="flex-1 bg-white dark:bg-background"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Rodapé */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Rodapé</Label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            <div className="relative">
              <Input 
                placeholder="Texto do rodapé"
                value={activeLanguage?.footer || ''}
                onChange={(e) => updateActiveLanguage({ footer: e.target.value })}
                maxLength={60}
                className="bg-background pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {60 - (activeLanguage?.footer?.length || 0)}
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Botões</Label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Crie botões que permitam que os clientes respondam à sua mensagem ou realizem uma ação. 
              É possível adicionar até 10 botões. Se você adicionar mais de 3 botões, eles aparecerão em uma lista.
            </p>

            {/* Dropdown para adicionar botão */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar botão
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-popover" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Resposta Rápida</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('custom', 'quick_reply')}
                    disabled={!canAddButton('custom')}
                  >
                    Personalizado
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Chamada para Ação</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('visit_website', 'call_to_action')}
                    disabled={!canAddButton('visit_website')}
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Acessar o site
                    {getButtonCount('visit_website') > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {getButtonCount('visit_website')}/2
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('call_whatsapp', 'call_to_action')}
                    disabled={!canAddButton('call_whatsapp')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Ligar no WhatsApp
                    {getButtonCount('call_whatsapp') > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">1/1</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('call', 'call_to_action')}
                    disabled={!canAddButton('call')}
                    className="flex items-center gap-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Ligar
                    {getButtonCount('call') > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">1/1</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('complete_flow', 'call_to_action')}
                    disabled={!canAddButton('complete_flow')}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Concluir flow
                    {getButtonCount('complete_flow') > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">1/1</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddButton('copy_offer_code', 'call_to_action')}
                    disabled={!canAddButton('copy_offer_code')}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar código da oferta
                    {getButtonCount('copy_offer_code') > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">1/1</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Lista de botões adicionados */}
            {activeLanguage?.buttons?.map((button) => (
              <div key={button.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getButtonIcon(button.type)}
                    <span className="text-sm font-medium">{getButtonTypeLabel(button.type)}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {button.category === 'quick_reply' ? 'Resposta Rápida' : 'Chamada para Ação'}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveButton(button.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {renderButtonFields(button)}
              </div>
            ))}
          </div>
        </div>

        {/* Preview lado direito */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            <Label className="text-sm font-medium mb-3 block">Prévia</Label>
            <div className="bg-[#e5ddd5] dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-lg">
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
                  <p className="text-xs text-white/70">online</p>
                </div>
              </div>
              
              {/* Mensagens */}
              <div className="p-4 min-h-[300px]">
                {activeLanguage?.body ? (
                  <div className="bg-white dark:bg-[#262626] rounded-lg p-3 max-w-[90%] shadow-sm">
                    {activeLanguage?.header?.type === 'text' && activeLanguage.header.content && (
                      <p className="font-semibold text-sm mb-1 text-foreground">{getPreviewHeader()}</p>
                    )}
                    {activeLanguage?.header?.type === 'image' && (
                      <div className="w-full h-32 bg-muted rounded mb-2 flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap text-foreground">{getPreviewMessage()}</p>
                    {activeLanguage?.footer && (
                      <p className="text-xs text-muted-foreground mt-2">{activeLanguage.footer}</p>
                    )}
                    {(activeLanguage?.buttons?.length || 0) > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {activeLanguage?.buttons?.map((btn) => (
                          <button 
                            key={btn.id}
                            className="w-full py-2 text-primary text-sm font-medium hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-2"
                          >
                            {getButtonIcon(btn.type)}
                            {btn.text || 'Botão'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    A prévia aparecerá aqui
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplatePage;
