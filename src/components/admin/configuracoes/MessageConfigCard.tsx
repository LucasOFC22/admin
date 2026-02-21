import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageTemplateSelector } from './WhatsAppTemplateSelector';
import { MessagePreview } from './MessagePreview';
import { TemplateVariablesMapper } from './TemplateVariablesMapper';
import { TemplateVariableMapping } from '@/services/supabase/whatsappConfigService';

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components?: any[];
}

interface MessageConfigCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
  useTemplate: boolean;
  onUseTemplateChange: (useTemplate: boolean) => void;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  templateLanguage: string;
  onTemplateLanguageChange: (lang: string) => void;
  templateVariables: TemplateVariableMapping[];
  onTemplateVariablesChange: (variables: TemplateVariableMapping[]) => void;
  templates: MessageTemplate[];
  placeholder?: string;
  variableHint?: string;
  inverted?: boolean; // Para casos como "Rejeição de Ligação" onde enabled é invertido
}

export const MessageConfigCard = ({
  title,
  description,
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
  useTemplate,
  onUseTemplateChange,
  templateName,
  onTemplateNameChange,
  templateLanguage,
  onTemplateLanguageChange,
  templateVariables,
  onTemplateVariablesChange,
  templates,
  placeholder,
  variableHint,
  inverted = false
}: MessageConfigCardProps) => {
  const approvedTemplates = templates.filter(t => t.status === 'approved');
  const selectedTemplate = approvedTemplates.find(t => t.name === templateName);

  const isEnabled = inverted ? !enabled : enabled;

  return (
    <div className="space-y-1">
      {/* Header Row */}
      <div className={cn(
        "flex items-center justify-between py-4 border-b border-border/50"
      )}>
        <div className="flex-1 min-w-0 pr-4">
          <Label className="text-sm font-medium text-foreground">{title}</Label>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0">
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => onEnabledChange(inverted ? !checked : checked)}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isEnabled && (
        <div className="py-3 pl-4 border-l-2 border-primary/20 ml-2 mb-4 space-y-4">
          {/* Tipo de Envio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Envio</Label>
            <RadioGroup
              value={useTemplate ? 'template' : 'normal'}
              onValueChange={(value) => onUseTemplateChange(value === 'template')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id={`${title}-normal`} />
                <Label 
                  htmlFor={`${title}-normal`} 
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  Mensagem Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id={`${title}-template`} />
                <Label 
                  htmlFor={`${title}-template`} 
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Modelo (Template)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mensagem Normal */}
          {!useTemplate && (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <MessageTemplateSelector 
                  templates={templates}
                  onApply={(text) => onMessageChange(text)}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <Textarea
                    placeholder={placeholder}
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                  {variableHint && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Variável: <code className="bg-muted px-1 rounded">{variableHint}</code>
                    </p>
                  )}
                </div>
                <MessagePreview message={message} />
              </div>
            </div>
          )}

          {/* Template Config */}
          {useTemplate && (
            <div className="space-y-4">
              {approvedTemplates.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-600">
                    Nenhum template aprovado disponível. Crie um template na aba "Modelos".
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Template Select */}
                    <div className="space-y-2">
                      <Label className="text-sm">Template</Label>
                      <Select 
                        value={templateName} 
                        onValueChange={(value) => {
                          onTemplateNameChange(value);
                          // Reset variables when template changes
                          onTemplateVariablesChange([]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.name}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language Select */}
                    <div className="space-y-2">
                      <Label className="text-sm">Idioma</Label>
                      <Select value={templateLanguage} onValueChange={onTemplateLanguageChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt_BR">Português (BR)</SelectItem>
                          <SelectItem value="en_US">English (US)</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Template Preview */}
                  {selectedTemplate && (
                    <div className="bg-muted/30 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-2">Preview do Template:</p>
                      <div className="text-sm">
                        {selectedTemplate.components?.map((component: any, idx: number) => {
                          if (component.type === 'BODY') {
                            return (
                              <p key={idx} className="text-foreground">
                                {component.text}
                              </p>
                            );
                          }
                          if (component.type === 'HEADER' && component.format === 'TEXT') {
                            return (
                              <p key={idx} className="font-medium mb-1">
                                {component.text}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Template Variables Mapper */}
                  {selectedTemplate && (
                    <TemplateVariablesMapper
                      templateComponents={selectedTemplate.components}
                      variables={templateVariables}
                      onVariablesChange={onTemplateVariablesChange}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
