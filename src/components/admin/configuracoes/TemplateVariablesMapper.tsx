import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Variable, Info, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { availableVariables } from '@/utils/messageVariables';
import { TemplateVariableMapping } from '@/services/supabase/whatsappConfigService';

interface TemplateVariablesMapperProps {
  templateComponents?: any[];
  variables: TemplateVariableMapping[];
  onVariablesChange: (variables: TemplateVariableMapping[]) => void;
}

interface ExtractedVariable {
  type: 'header' | 'body';
  name: string;           // "1", "2" ou "nome_cliente", "saudacao"
  isNumeric: boolean;     // true se for {{1}}, false se for {{nome_cliente}}
  isSystemVariable: boolean; // true se for uma variável conhecida do sistema
  context?: string;
  position: number;       // Posição da variável no template (ordem de aparição)
}

// Lista de nomes de variáveis do sistema (sem os {{}})
const systemVariableNames = availableVariables.map(v => 
  v.variable.replace(/^\{\{|\}\}$/g, '')
);

// Extrair TODAS as variáveis do template ({{1}}, {{2}}, {{nome_cliente}}, etc.)
// MANTENDO A ORDEM DE APARIÇÃO no template
const extractTemplateVariables = (components: any[]): ExtractedVariable[] => {
  const vars: ExtractedVariable[] = [];
  
  if (!components) return vars;
  
  // Regex que captura QUALQUER coisa entre {{ }}
  const variableRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
  
  // Processar header primeiro, depois body (ordem do template Meta)
  const orderedComponents = [...components].sort((a, b) => {
    const typeOrder = { 'HEADER': 0, 'BODY': 1, 'FOOTER': 2, 'BUTTONS': 3 };
    const aType = a.type?.toUpperCase() || 'BODY';
    const bType = b.type?.toUpperCase() || 'BODY';
    return (typeOrder[aType as keyof typeof typeOrder] ?? 99) - (typeOrder[bType as keyof typeof typeOrder] ?? 99);
  });
  
  // Contadores de posição separados para header e body
  let headerPosition = 1;
  let bodyPosition = 1;
  
  orderedComponents.forEach(component => {
    const componentType = component.type?.toUpperCase();
    
    if ((componentType === 'HEADER' && component.format === 'TEXT' && component.text) ||
        (componentType === 'BODY' && component.text)) {
      
      const type: 'header' | 'body' = componentType === 'HEADER' ? 'header' : 'body';
      let match;
      
      // Reset regex lastIndex para garantir que capturamos todas as ocorrências
      variableRegex.lastIndex = 0;
      
      while ((match = variableRegex.exec(component.text)) !== null) {
        const varName = match[1].trim();
        const isNumeric = /^\d+$/.test(varName);
        const isSystemVariable = systemVariableNames.includes(varName);
        
        // Pegar contexto ao redor da variável
        const idx = match.index;
        const before = component.text.substring(Math.max(0, idx - 20), idx);
        const after = component.text.substring(idx + match[0].length, idx + match[0].length + 20);
        
        // Evitar duplicatas dentro do mesmo tipo
        if (!vars.some(v => v.name === varName && v.type === type)) {
          // Atribuir posição baseada na ordem de aparição no template
          const position = type === 'header' ? headerPosition++ : bodyPosition++;
          
          vars.push({ 
            type, 
            name: varName,
            isNumeric,
            isSystemVariable,
            context: `...${before}${match[0]}${after}...`,
            position // POSIÇÃO BASEADA NA ORDEM DE APARIÇÃO
          });
        }
      }
    }
  });
  
  // NÃO ordenar alfabeticamente! Manter na ordem de aparição
  // Apenas separar por tipo: headers primeiro, depois body
  return vars.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'header' ? -1 : 1;
    }
    // Dentro do mesmo tipo, manter ordem de aparição (position)
    return a.position - b.position;
  });
};

export const TemplateVariablesMapper = ({
  templateComponents,
  variables,
  onVariablesChange
}: TemplateVariablesMapperProps) => {
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  
  const templateVars = useMemo(() => 
    extractTemplateVariables(templateComponents || []),
    [templateComponents]
  );

  // Gera chave única para variável: type-name (ex: "header-1", "body-1")
  const getVarKey = (type: 'header' | 'body', name: string) => `${type}-${name}`;

  // Inicializar variáveis quando o template muda
  useEffect(() => {
    if (templateVars.length > 0) {
      const initialVars = templateVars.map(v => {
        // Verificar se já existe um mapeamento - compara tipo + nome
        const existing = variables.find(
          existing => existing.name === v.name && existing.type === v.type
        );
        
        if (existing) {
          // Atualizar o position se mudou
          return {
            ...existing,
            type: v.type,
            position: v.position
          };
        }
        
        // Auto-mapear variáveis do sistema
        if (v.isSystemVariable) {
          return {
            name: v.name,
            position: v.position,
            value: `{{${v.name}}}`,
            autoMapped: true,
            type: v.type
          };
        }
        
        return {
          name: v.name,
          position: v.position,
          value: '',
          type: v.type
        };
      });
      
      // Só atualizar se houver diferenças - compara tipo + nome
      const hasChanges = initialVars.some((newVar, idx) => {
        const oldVar = variables[idx];
        return !oldVar || 
          newVar.name !== oldVar.name || 
          newVar.value !== oldVar.value ||
          newVar.type !== oldVar.type;
      }) || initialVars.length !== variables.length;
      
      if (hasChanges) {
        onVariablesChange(initialVars);
      }
    }
  }, [templateVars]);

  // handleVariableChange agora recebe type para diferenciar header/body
  const handleVariableChange = (type: 'header' | 'body', name: string, value: string) => {
    const existing = variables.find(v => v.name === name && v.type === type);
    const templateVar = templateVars.find(v => v.name === name && v.type === type);
    
    if (existing) {
      onVariablesChange(
        variables.map(v => (v.name === name && v.type === type) ? { 
          ...v, 
          value,
          autoMapped: false,
          type
        } : v)
      );
    } else {
      onVariablesChange([...variables, { 
        name,
        position: templateVar?.position,
        value,
        type
      }]);
    }
  };

  // getVariableValue agora busca por tipo + nome
  const getVariableValue = (type: 'header' | 'body', name: string): string => {
    return variables.find(v => v.name === name && v.type === type)?.value || '';
  };

  const isAutoMapped = (type: 'header' | 'body', name: string): boolean => {
    return variables.find(v => v.name === name && v.type === type)?.autoMapped || false;
  };

  if (templateVars.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <Check className="h-4 w-4 text-green-600" />
        <p className="text-sm text-green-600">
          Este template não possui variáveis para configurar.
        </p>
      </div>
    );
  }

  const unmappedCount = templateVars.filter(v => !getVariableValue(v.type, v.name)).length;
  const autoMappedCount = templateVars.filter(v => v.isSystemVariable).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Mapeamento de Variáveis</Label>
        </div>
        <div className="flex gap-2">
          {autoMappedCount > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-500/50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {autoMappedCount} auto
            </Badge>
          )}
          {unmappedCount > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-500/50">
              <AlertCircle className="h-3 w-3 mr-1" />
              {unmappedCount} não mapeada{unmappedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>
          Mapeie cada variável do template para uma variável do sistema ou digite um valor fixo.
          Variáveis do sistema como <code className="bg-muted px-1 rounded">{'{{nome_cliente}}'}</code> são auto-configuradas.
        </p>
      </div>

      {/* Variables List */}
      <div className="space-y-3">
        {templateVars.map((templateVar) => {
          const varKey = getVarKey(templateVar.type, templateVar.name);
          const currentValue = getVariableValue(templateVar.type, templateVar.name);
          
          return (
            <div 
              key={varKey}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                templateVar.isSystemVariable 
                  ? "bg-green-500/5 border-green-500/30" 
                  : "bg-muted/20 border-border/50"
              )}
            >
              {/* Variable badge */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <Badge 
                  variant={templateVar.isSystemVariable ? "default" : "secondary"} 
                  className={cn(
                    "font-mono text-xs",
                    templateVar.isSystemVariable && "bg-green-600"
                  )}
                >
                  {`{{${templateVar.name}}}`}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] uppercase px-1.5 py-0",
                    templateVar.type === 'header' 
                      ? "border-blue-500/50 text-blue-600" 
                      : "border-orange-500/50 text-orange-600"
                  )}
                >
                  {templateVar.type}
                </Badge>
              </div>

              {/* Variable input */}
              <div className="flex-1 space-y-1">
                {templateVar.context && (
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {templateVar.context.replace(/^\.\.\./, '').replace(/\.\.\.$/, '')}
                  </p>
                )}
                
                {/* Se for variável do sistema, mostrar como auto-configurada */}
                {templateVar.isSystemVariable ? (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-green-700">Auto-configurada</p>
                      <p className="text-xs text-muted-foreground">
                        Esta é uma variável do sistema e será substituída automaticamente.
                      </p>
                    </div>
                    <Popover 
                      open={openPopovers[varKey]} 
                      onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [varKey]: open }))}
                      modal={true}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                        >
                          Sobrescrever
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start" sideOffset={8}>
                        <Command>
                          <CommandInput placeholder="Buscar variável..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
                            <CommandGroup heading="Variáveis do Sistema">
                              {availableVariables.map((v) => (
                                <CommandItem
                                  key={v.variable}
                                  value={v.variable}
                                onSelect={() => {
                                  handleVariableChange(templateVar.type, templateVar.name, v.variable);
                                  setOpenPopovers(prev => ({ ...prev, [varKey]: false }));
                                }}
                                >
                                  <div className="flex flex-col">
                                    <code className="text-xs text-primary">{v.variable}</code>
                                    <span className="text-xs text-muted-foreground">{v.description}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <Popover 
                    open={openPopovers[varKey]} 
                    onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [varKey]: open }))}
                    modal={true}
                  >
                    <PopoverTrigger asChild>
                      <div 
                        className="relative cursor-text"
                        onClick={() => setOpenPopovers(prev => ({ ...prev, [varKey]: false }))}
                      >
                        <Input
                          placeholder="Digite um valor ou selecione uma variável..."
                          value={currentValue}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleVariableChange(templateVar.type, templateVar.name, e.target.value);
                          }}
                          onFocus={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "pr-8 text-sm",
                            !currentValue && "border-yellow-500/50"
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setOpenPopovers(prev => ({ ...prev, [varKey]: true }));
                          }}
                        >
                          <Variable className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start" sideOffset={8}>
                      <Command>
                        <CommandInput placeholder="Buscar variável..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
                          <CommandGroup heading="Variáveis do Sistema">
                            {availableVariables.map((v) => (
                              <CommandItem
                                key={v.variable}
                                value={v.variable}
                              onSelect={() => {
                                handleVariableChange(templateVar.type, templateVar.name, v.variable);
                                setOpenPopovers(prev => ({ ...prev, [varKey]: false }));
                              }}
                              >
                                <div className="flex flex-col">
                                  <code className="text-xs text-primary">{v.variable}</code>
                                  <span className="text-xs text-muted-foreground">{v.description}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Show mapped value preview for non-system variables */}
                {!templateVar.isSystemVariable && currentValue && (
                  <p className="text-xs text-green-600">
                    ✓ Mapeado para: <code className="bg-green-500/10 px-1 rounded">{currentValue}</code>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
