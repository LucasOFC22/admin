import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, X, Plus, Trash2, Settings, Braces, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VariableAutocomplete } from './VariableAutocomplete';
import { cn } from '@/lib/utils';

interface Comparison {
  variable: string;
  operator: string;
  value: string;
}

interface Rule {
  comparisons: Comparison[];
}

interface ConditionData {
  rules: Rule[];
  title?: string;
}

interface FlowBuilderConditionModalV2Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { conditions: ConditionData }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

const operatorOptions = [
  { value: '==', label: 'Igual (==)' },
  { value: '!=', label: 'Diferente (!=)' },
  { value: '>', label: 'Maior que (>)' },
  { value: '<', label: 'Menor que (<)' },
  { value: '>=', label: 'Maior ou igual (>=)' },
  { value: '<=', label: 'Menor ou igual (<=)' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'exists', label: 'Existe' },
  { value: 'not_exists', label: 'Não existe' },
  { value: 'not_found', label: 'Não encontrado' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' }
];

const operatorsWithoutValue = ['exists', 'not_exists', 'not_found', 'is_empty', 'is_not_empty'];

const defaultComparison: Comparison = { variable: '', operator: '==', value: '' };
const defaultRule: Rule = { comparisons: [{ ...defaultComparison }] };

export const FlowBuilderConditionModalV2: React.FC<FlowBuilderConditionModalV2Props> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create',
  onCancel
}) => {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([{ ...defaultRule, comparisons: [{ ...defaultComparison }] }]);
  const [title, setTitle] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set([0]));

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify({ data: data?.data });
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.conditions) {
      const conditions = data.data.conditions;
      if (conditions.rules && conditions.rules.length > 0) {
        setRules(conditions.rules);
        setExpandedRules(new Set([0]));
      } else if (conditions.comparisons) {
        // Legacy support
        setRules([{ comparisons: conditions.comparisons }]);
        setExpandedRules(new Set([0]));
      } else {
        setRules([{ ...defaultRule, comparisons: [{ ...defaultComparison }] }]);
        setExpandedRules(new Set([0]));
      }
      setTitle(conditions.title || '');
    } else if (mode === 'create') {
      setRules([{ ...defaultRule, comparisons: [{ ...defaultComparison }] }]);
      setTitle('');
      setExpandedRules(new Set([0]));
    }
  }, [mode, data, open]);

  const toggleRuleExpanded = (index: number) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const addRule = () => {
    setRules([...rules, { comparisons: [{ ...defaultComparison }] }]);
    setExpandedRules(prev => new Set([...prev, rules.length]));
  };

  const removeRule = (ruleIndex: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== ruleIndex));
      setExpandedRules(prev => {
        const next = new Set<number>();
        prev.forEach(i => {
          if (i < ruleIndex) next.add(i);
          else if (i > ruleIndex) next.add(i - 1);
        });
        return next;
      });
    }
  };

  const addComparison = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      comparisons: [...newRules[ruleIndex].comparisons, { ...defaultComparison }]
    };
    setRules(newRules);
  };

  const removeComparison = (ruleIndex: number, compIndex: number) => {
    const newRules = [...rules];
    if (newRules[ruleIndex].comparisons.length > 1) {
      newRules[ruleIndex] = {
        ...newRules[ruleIndex],
        comparisons: newRules[ruleIndex].comparisons.filter((_, i) => i !== compIndex)
      };
      setRules(newRules);
    }
  };

  const updateComparison = (ruleIndex: number, compIndex: number, field: keyof Comparison, value: string) => {
    const newRules = [...rules];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      comparisons: newRules[ruleIndex].comparisons.map((comp, i) =>
        i === compIndex ? { ...comp, [field]: value } : comp
      )
    };
    setRules(newRules);
  };

  const getRulePreview = (rule: Rule): string => {
    const firstComp = rule.comparisons[0];
    if (!firstComp?.variable) return 'Condição vazia';
    const preview = `${firstComp.variable} ${firstComp.operator} ${firstComp.value || ''}`;
    if (rule.comparisons.length > 1) {
      return `${preview} (+${rule.comparisons.length - 1})`;
    }
    return preview;
  };

  const handleSave = () => {
    const validRules = rules.filter(rule =>
      rule.comparisons.some(c => 
        c.variable && (operatorsWithoutValue.includes(c.operator) || c.value)
      )
    ).map(rule => ({
      comparisons: rule.comparisons.filter(c =>
        c.variable && (operatorsWithoutValue.includes(c.operator) || c.value)
      )
    }));
    
    if (validRules.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma condição válida",
        variant: "destructive"
      });
      return;
    }

    const conditionData: ConditionData = {
      rules: validRules,
      title
    };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          conditions: conditionData 
        }
      });
    } else {
      onSave({ conditions: conditionData });
    }
    // Don't call onClose here - onSave/onUpdate will close the modal
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-violet-700">
            {mode === 'create' ? 'Adicionar Condições' : 'Editar Condições'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Cada condição terá uma saída independente no fluxo
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3">
          {rules.map((rule, ruleIndex) => (
            <div 
              key={ruleIndex} 
              className="border border-violet-200 rounded-lg overflow-hidden bg-violet-50/30"
            >
              {/* Rule Header */}
              <div 
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer",
                  "bg-gradient-to-r from-violet-100 to-violet-50 hover:from-violet-200 hover:to-violet-100"
                )}
                onClick={() => toggleRuleExpanded(ruleIndex)}
              >
                <div className="flex items-center gap-2">
                  {expandedRules.has(ruleIndex) ? (
                    <ChevronUp className="h-4 w-4 text-violet-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-violet-600" />
                  )}
                  <span className="font-medium text-violet-700 text-sm">
                    Saída {ruleIndex + 1}
                  </span>
                  {!expandedRules.has(ruleIndex) && (
                    <span className="text-xs text-violet-500 truncate max-w-[200px]">
                      — {getRulePreview(rule)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRule(ruleIndex);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Rule Content */}
              {expandedRules.has(ruleIndex) && (
                <div className="p-3 space-y-3 bg-white">
                  {rule.comparisons.map((comparison, compIndex) => (
                    <div key={compIndex} className="flex flex-col gap-2">
                      {compIndex > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-violet-400 uppercase">E também</span>
                          {rule.comparisons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeComparison(ruleIndex, compIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Variable Input */}
                      <div className="relative">
                        <VariableAutocomplete
                          value={comparison.variable}
                          onChange={(value) => updateComparison(ruleIndex, compIndex, 'variable', value)}
                          placeholder="Selecione uma variável"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7 p-0"
                        >
                          <Settings className="h-4 w-4 opacity-50" />
                        </Button>
                      </div>

                      {/* Operator Select */}
                      <Select 
                        value={comparison.operator} 
                        onValueChange={(value) => updateComparison(ruleIndex, compIndex, 'operator', value)}
                      >
                        <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-violet-300">
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value Input */}
                      {!operatorsWithoutValue.includes(comparison.operator) && (
                        <div className="relative">
                          <VariableAutocomplete
                            value={comparison.value}
                            onChange={(value) => updateComparison(ruleIndex, compIndex, 'value', value)}
                            placeholder="Digite um valor..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7 p-0"
                          >
                            <Braces className="h-4 w-4 opacity-60" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Comparison Button */}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="w-full h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 border border-dashed border-violet-200"
                    onClick={() => addComparison(ruleIndex)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar comparação (E)
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Rule Button */}
          <Button 
            type="button" 
            variant="outline" 
            className="h-10 border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
            onClick={addRule}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Nova Condição (Saída {rules.length + 1})
          </Button>

          {/* Else Info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">
              <strong>Else (Padrão)</strong> — Acionado quando nenhuma condição é atendida
            </span>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleCancel} className="border-gray-200">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
