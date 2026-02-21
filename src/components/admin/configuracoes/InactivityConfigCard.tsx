import { useState } from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TemplateVariableMapping } from '@/services/supabase/whatsappConfigService';
import { TemplateVariablesMapper } from './TemplateVariablesMapper';
import { cn } from '@/lib/utils';
import { MessageCircle, FileText, AlertCircle } from 'lucide-react';

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components?: any[];
}

interface InactivityConfigCardProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  timeoutMinutes: number;
  onTimeoutChange: (minutes: number) => void;
  message: string;
  onMessageChange: (message: string) => void;
  useTemplate: boolean;
  onUseTemplateChange: (useTemplate: boolean) => void;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  templateLanguage: string;
  onTemplateLanguageChange: (language: string) => void;
  templateVariables: TemplateVariableMapping[];
  onTemplateVariablesChange: (variables: TemplateVariableMapping[]) => void;
  templates: MessageTemplate[];
}

const TIMEOUT_PRESETS = [5, 10, 15, 30, 60, 120];

export function InactivityConfigCard({
  enabled,
  onEnabledChange,
  timeoutMinutes,
  onTimeoutChange,
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
  templates
}: InactivityConfigCardProps) {
  const [customTimeout, setCustomTimeout] = useState(
    !TIMEOUT_PRESETS.includes(timeoutMinutes)
  );

  const approvedTemplates = templates.filter(t => t.status === 'approved');
  const selectedTemplate = approvedTemplates.find(t => t.name === templateName);

  const handleTimeoutPresetClick = (minutes: number) => {
    setCustomTimeout(false);
    onTimeoutChange(minutes);
  };

  const handleCustomTimeoutChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes) && minutes > 0 && minutes <= 1440) {
      onTimeoutChange(minutes);
    }
  };

  return (
    <Card className={cn(
      "border-2 transition-colors",
      enabled ? "border-primary/50 bg-primary/5" : "border-border"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Encerramento por Inatividade</CardTitle>
              <CardDescription className="text-sm">
                Fecha automaticamente chats quando o cliente fica inativo
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-6 pt-0">
          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-500">
              <strong>Importante:</strong> A inatividade conta apenas quando o <strong>cliente</strong> não responde. 
              Mensagens do atendente não reiniciam o contador.
            </p>
          </div>

          {/* Tempo de inatividade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tempo de inatividade</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Após esse tempo sem resposta do cliente, o chat será encerrado automaticamente
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-wrap gap-2">
              {TIMEOUT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleTimeoutPresetClick(preset)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    timeoutMinutes === preset && !customTimeout
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {preset < 60 ? `${preset}min` : `${preset / 60}h`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomTimeout(true)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  customTimeout
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                Personalizado
              </button>
            </div>

            {customTimeout && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={timeoutMinutes}
                  onChange={(e) => handleCustomTimeoutChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Valor atual: <strong>{timeoutMinutes} minutos</strong>
              {timeoutMinutes >= 60 && ` (${(timeoutMinutes / 60).toFixed(1)} horas)`}
            </p>
          </div>

          {/* Tipo de Envio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Envio</Label>
            <RadioGroup
              value={useTemplate ? 'template' : 'normal'}
              onValueChange={(value) => onUseTemplateChange(value === 'template')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="inactivity-normal" />
                <Label 
                  htmlFor="inactivity-normal" 
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  Mensagem Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id="inactivity-template" />
                <Label 
                  htmlFor="inactivity-template" 
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
              <Label className="text-sm font-medium">Mensagem de encerramento</Label>
              <Textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Ex: Seu atendimento foi encerrado por inatividade. Se precisar de ajuda, é só enviar uma nova mensagem!"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada ao cliente antes de fechar o chat
              </p>
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
        </CardContent>
      )}
    </Card>
  );
}
