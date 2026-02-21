import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Copy, Variable } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VariableItem {
  key: string;
  label: string;
  description: string;
}

const PREDEFINED_VARIABLES: VariableItem[] = [
  { key: '{{telefone}}', label: 'telefone / phone', description: 'Número do contato' },
  { key: '{{nome}}', label: 'nome / name', description: 'Nome do contato' },
  { key: '{{data}}', label: 'data / date', description: 'Data atual (pt-BR)' },
  { key: '{{hora}}', label: 'hora / time', description: 'Hora atual' },
  { key: '{{timestamp}}', label: 'timestamp', description: 'Data/hora ISO' },
];

interface VariablesHelperProps {
  onInsert?: (variable: string) => void;
  className?: string;
}

export const VariablesHelper: React.FC<VariablesHelperProps> = ({
  onInsert,
  className
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [customVariables, setCustomVariables] = useState<string[]>([]);

  useEffect(() => {
    const loadVariables = () => {
      const storedVariables = localStorage.getItem('variables');
      if (storedVariables) {
        try {
          const parsed = JSON.parse(storedVariables);
          setCustomVariables(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCustomVariables([]);
        }
      }
    };

    loadVariables();
    window.addEventListener('storage', loadVariables);
    return () => window.removeEventListener('storage', loadVariables);
  }, []);

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Copiado!",
      description: `${variable} copiado para área de transferência`,
    });
  };

  const handleClick = (variable: string) => {
    if (onInsert) {
      onInsert(variable);
    } else {
      handleCopy(variable);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("border rounded-lg bg-muted/50", className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/80 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-muted-foreground" />
          <span>Variáveis disponíveis</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-3 pb-3">
        <div className="space-y-3">
          {/* Predefined Variables */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Pré-definidas</p>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_VARIABLES.map((variable) => (
                <Badge
                  key={variable.key}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs font-mono"
                  onClick={() => handleClick(variable.key)}
                  title={variable.description}
                >
                  {variable.key}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
            <p><code className="bg-muted px-1 rounded">{'{{telefone}}'}</code> / <code className="bg-muted px-1 rounded">{'{{phone}}'}</code> - número do contato</p>
            <p><code className="bg-muted px-1 rounded">{'{{nome}}'}</code> / <code className="bg-muted px-1 rounded">{'{{name}}'}</code> - nome do contato</p>
            <p><code className="bg-muted px-1 rounded">{'{{data}}'}</code> / <code className="bg-muted px-1 rounded">{'{{date}}'}</code> - data atual</p>
            <p><code className="bg-muted px-1 rounded">{'{{hora}}'}</code> / <code className="bg-muted px-1 rounded">{'{{time}}'}</code> - hora atual</p>
            <p><code className="bg-muted px-1 rounded">{'{{timestamp}}'}</code> - data/hora ISO</p>
          </div>

          {/* Custom Variables */}
          {customVariables.length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Customizadas (do fluxo)</p>
              <div className="flex flex-wrap gap-1.5">
                {customVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors text-xs font-mono"
                    onClick={() => handleClick(`{{${variable}}}`)}
                  >
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground italic pt-1">
            Clique para {onInsert ? 'inserir' : 'copiar'} a variável
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
