import { useMemo, useState } from 'react';
import { FileText, ChevronDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { availableVariables } from '@/utils/messageVariables';

export interface MetaMessageTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components?: any[];
}

function extractHeaderText(template: MetaMessageTemplate): string {
  const headerComponent = template.components?.find((c: any) => c.type === 'HEADER');
  return headerComponent?.text || '';
}

function extractBodyText(template: MetaMessageTemplate): string {
  const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
  return bodyComponent?.text || '';
}

function extractFooterText(template: MetaMessageTemplate): string {
  const footerComponent = template.components?.find((c: any) => c.type === 'FOOTER');
  return footerComponent?.text || '';
}

function extractVariables(text: string): string[] {
  const vars: string[] = [];
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const name = match[1];
    if (!vars.includes(name)) vars.push(name);
  }
  return vars;
}

function extractAllVariables(template: MetaMessageTemplate): string[] {
  const headerText = extractHeaderText(template);
  const bodyText = extractBodyText(template);
  const footerText = extractFooterText(template);
  const fullText = `${headerText} ${bodyText} ${footerText}`;
  return extractVariables(fullText);
}

// Agrupa variáveis por categoria
const groupedVariables = [
  {
    label: 'Cliente',
    variables: availableVariables.filter(v => 
      ['{{nome_cliente}}', '{{telefone_cliente}}', '{{email_cliente}}'].includes(v.variable)
    ),
  },
  {
    label: 'Atendente',
    variables: availableVariables.filter(v => 
      ['{{nome_atendente}}', '{{email_atendente}}'].includes(v.variable)
    ),
  },
  {
    label: 'Ticket',
    variables: availableVariables.filter(v => 
      ['{{chat_id}}', '{{ticket_id}}', '{{protocolo}}', '{{fila_nome}}', '{{fila_destino}}', '{{tempo_atendimento}}'].includes(v.variable)
    ),
  },
  {
    label: 'Data/Hora',
    variables: availableVariables.filter(v => 
      ['{{data}}', '{{hora}}', '{{data_hora}}', '{{dia_semana}}', '{{mes}}', '{{ano}}', '{{saudacao}}'].includes(v.variable)
    ),
  },
  {
    label: 'Outros',
    variables: availableVariables.filter(v => 
      ['{{empresa_nome}}'].includes(v.variable)
    ),
  },
].filter(g => g.variables.length > 0);

interface VariableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  variableName: string;
}

const VariableCombobox = ({ value, onChange, variableName }: VariableComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Digite ou selecione uma variável..."
            className={cn(
              "pr-8",
              !inputValue && "border-destructive"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
            onClick={() => setOpen(true)}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar variável do sistema..." />
          <CommandList>
            <CommandEmpty>Nenhuma variável encontrada</CommandEmpty>
            {groupedVariables.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.variables.map((variable) => (
                  <CommandItem
                    key={variable.variable}
                    value={`${variable.variable} ${variable.description}`}
                    onSelect={() => handleSelect(variable.variable)}
                    className="flex items-start gap-2 py-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        inputValue === variable.variable ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded w-fit">
                        {variable.variable}
                      </code>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {variable.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const MessageTemplateSelector = ({
  templates,
  onApply,
  disabled,
}: {
  templates: MetaMessageTemplate[];
  onApply: (text: string) => void;
  disabled?: boolean;
}) => {
  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'approved'),
    [templates]
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MetaMessageTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const headerText = selected ? extractHeaderText(selected) : '';
  const bodyText = selected ? extractBodyText(selected) : '';
  const footerText = selected ? extractFooterText(selected) : '';
  const variables = useMemo(() => selected ? extractAllVariables(selected) : [], [selected]);

  // Verifica se todas as variáveis estão preenchidas
  const allFilled = variables.length === 0 || variables.every(v => values[v]?.trim());

  // Gera prévia com variáveis substituídas
  const replaceVariables = (text: string) => {
    let result = text;
    Object.entries(values).forEach(([k, v]) => {
      const safe = v?.trim() || `{{${k}}}`;
      const reg = new RegExp(`\\{\\{\\s*${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      result = result.replace(reg, safe);
    });
    return result;
  };

  const previewHeaderText = useMemo(() => replaceVariables(headerText), [headerText, values]);
  const previewBodyText = useMemo(() => replaceVariables(bodyText), [bodyText, values]);
  const previewFooterText = useMemo(() => replaceVariables(footerText), [footerText, values]);

  const handlePick = (t: MetaMessageTemplate) => {
    setSelected(t);
    const initial: Record<string, string> = {};
    extractAllVariables(t).forEach((v) => (initial[v] = ''));
    setValues(initial);
    setOpen(true);
  };

  const apply = () => {
    if (!selected || !allFilled) return;

    let headerResult = extractHeaderText(selected);
    let bodyResult = extractBodyText(selected);
    let footerResult = extractFooterText(selected);
    
    Object.entries(values).forEach(([k, v]) => {
      const safe = v?.trim() || '';
      const reg = new RegExp(`\\{\\{\\s*${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      headerResult = headerResult.replace(reg, safe);
      bodyResult = bodyResult.replace(reg, safe);
      footerResult = footerResult.replace(reg, safe);
    });

    // Combina header, body e footer na saída final
    const parts: string[] = [];
    if (headerResult) parts.push(headerResult);
    if (bodyResult) parts.push(bodyResult);
    if (footerResult) parts.push(`---\n${footerResult}`);
    
    onApply(parts.join('\n\n'));
    setOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || approvedTemplates.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Usar modelo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto bg-popover" align="start">
          {approvedTemplates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handlePick(template)}
              className="flex flex-col items-start gap-1 py-2"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium text-sm">{template.name}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {template.category}
                </Badge>
              </div>
              {extractBodyText(template) ? (
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {extractBodyText(template).length > 80
                    ? extractBodyText(template).substring(0, 80) + '...'
                    : extractBodyText(template)}
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Preencher variáveis do modelo</DialogTitle>
            <DialogDescription>
              {selected ? (
                <span>
                  Modelo: <span className="font-medium">{selected.name}</span>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              {/* Coluna de texto original e inputs */}
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">Texto original do modelo</p>
                  
                  {headerText && (
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">Header</Badge>
                      <p className="text-sm font-medium whitespace-pre-wrap">{headerText}</p>
                    </div>
                  )}
                  
                  <div>
                    <Badge variant="secondary" className="text-xs mb-1">Body</Badge>
                    <p className="text-sm whitespace-pre-wrap">{bodyText || '-'}</p>
                  </div>
                  
                  {footerText && (
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">Footer</Badge>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{footerText}</p>
                    </div>
                  )}
                </div>

                {variables.length === 0 ? (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      Este modelo não possui variáveis para preencher.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Preencha cada variável com texto ou selecione uma variável do sistema:
                    </p>
                    {variables.map((v) => (
                      <div key={v} className="space-y-1">
                        <Label className="text-sm flex items-center gap-2">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{'{{' + v + '}}'}</code>
                          {!values[v]?.trim() && (
                            <span className="text-xs text-destructive">*obrigatório</span>
                          )}
                        </Label>
                        <VariableCombobox
                          value={values[v] ?? ''}
                          onChange={(newValue) => setValues((prev) => ({ ...prev, [v]: newValue }))}
                          variableName={v}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna de prévia */}
              <div className="space-y-2">
                <div className="rounded-md border bg-primary/5 p-3 h-full">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">📋 Prévia da mensagem</p>
                  
                  {headerText && (
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs mb-1">Header</Badge>
                      <p className="text-sm font-medium whitespace-pre-wrap">
                        {renderPreviewText(previewHeaderText)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Badge variant="outline" className="text-xs mb-1">Body</Badge>
                    <p className="text-sm whitespace-pre-wrap">
                      {renderPreviewText(previewBodyText)}
                    </p>
                  </div>
                  
                  {footerText && (
                    <div className="mt-3 pt-3 border-t border-dashed">
                      <Badge variant="outline" className="text-xs mb-1">Footer</Badge>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {renderPreviewText(previewFooterText)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {variables.length > 0 && !allFilled && (
              <p className="text-xs text-destructive mt-2">
                Preencha todas as variáveis obrigatórias para aplicar o modelo.
              </p>
            )}
          </ScrollArea>

          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={apply} disabled={!selected || (variables.length > 0 && !allFilled)}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Função auxiliar para renderizar texto de prévia com variáveis não preenchidas destacadas
function renderPreviewText(text: string) {
  return text.split(/(\{\{[^}]+\}\})/).map((part, i) => {
    if (/^\{\{[^}]+\}\}$/.test(part)) {
      return (
        <span key={i} className="bg-destructive/20 text-destructive px-1 rounded text-xs">
          {part}
        </span>
      );
    }
    return part;
  });
}
