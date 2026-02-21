import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  GitCompare
} from 'lucide-react';
import { format, subDays, subYears, differenceInDays } from 'date-fns';

interface DREAIAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataInicial: string;
  dataFinal: string;
  onGenerate: (config: AIAnalysisConfig) => void;
}

export interface AIAnalysisConfig {
  nivel: 'simples' | 'medio' | 'completo';
  compararPeriodo: boolean;
  periodo2Inicio?: string;
  periodo2Fim?: string;
}

export const DREAIAnalysisModal: React.FC<DREAIAnalysisModalProps> = ({
  open,
  onOpenChange,
  dataInicial,
  dataFinal,
  onGenerate
}) => {
  const [nivel, setNivel] = useState<'simples' | 'medio' | 'completo'>('simples');
  const [compararPeriodo, setCompararPeriodo] = useState(false);
  const [periodo2Inicio, setPeriodo2Inicio] = useState('');
  const [periodo2Fim, setPeriodo2Fim] = useState('');

  const handleCompareShortcut = (type: 'mesmo-2024' | 'mesmo-2023' | 'anterior') => {
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    const dias = differenceInDays(fim, inicio);

    let newInicio: Date;
    let newFim: Date;

    switch (type) {
      case 'mesmo-2024':
        newInicio = new Date(inicio);
        newInicio.setFullYear(2024);
        newFim = new Date(fim);
        newFim.setFullYear(2024);
        break;
      case 'mesmo-2023':
        newInicio = new Date(inicio);
        newInicio.setFullYear(2023);
        newFim = new Date(fim);
        newFim.setFullYear(2023);
        break;
      case 'anterior':
        newFim = subDays(inicio, 1);
        newInicio = subDays(newFim, dias);
        break;
      default:
        return;
    }

    setPeriodo2Inicio(format(newInicio, 'yyyy-MM-dd'));
    setPeriodo2Fim(format(newFim, 'yyyy-MM-dd'));
    setCompararPeriodo(true);
  };

  const handleGenerate = () => {
    onGenerate({
      nivel,
      compararPeriodo,
      periodo2Inicio: compararPeriodo ? periodo2Inicio : undefined,
      periodo2Fim: compararPeriodo ? periodo2Fim : undefined
    });
  };

  const dias = differenceInDays(new Date(dataFinal), new Date(dataInicial));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise Inteligente com IA
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Obtenha insights profundos sobre seus indicadores com análise automatizada
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Nível de Análise */}
          <div className="space-y-3">
            <Label>Nível de Análise</Label>
            <RadioGroup value={nivel} onValueChange={(v) => setNivel(v as typeof nivel)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="simples" id="simples" className="mt-1" />
                <label htmlFor="simples" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Simples</span>
                    <span className="text-muted-foreground">- Visão rápida (3-5 insights e ações)</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">Modelo: Flash Lite (econômico)</span>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="medio" id="medio" className="mt-1" />
                <label htmlFor="medio" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Médio</span>
                    <span className="text-muted-foreground">- Análise detalhada por tema com comparações</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">Modelo: Flash (balanceado)</span>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="completo" id="completo" className="mt-1" />
                <label htmlFor="completo" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Completo</span>
                    <span className="text-muted-foreground">- Análise estratégica profunda (consultor sênior)</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">Modelo: Pro (premium)</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Comparar Período */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="comparar" 
                checked={compararPeriodo}
                onCheckedChange={(checked) => setCompararPeriodo(checked === true)}
              />
              <label htmlFor="comparar" className="text-sm font-medium cursor-pointer">
                Comparar com outro período
              </label>
            </div>

            {compararPeriodo && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodo2Inicio">Data Inicial (Período 2)</Label>
                    <Input
                      type="date"
                      id="periodo2Inicio"
                      value={periodo2Inicio}
                      onChange={(e) => setPeriodo2Inicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodo2Fim">Data Final (Período 2)</Label>
                    <Input
                      type="date"
                      id="periodo2Fim"
                      value={periodo2Fim}
                      onChange={(e) => setPeriodo2Fim(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Atalho para Comparação */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitCompare className="h-4 w-4" />
                <span className="font-medium">Comparar com:</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs border-primary/50 hover:bg-primary/10"
                onClick={() => handleCompareShortcut('mesmo-2024')}
              >
                Mesmo período 2024
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => handleCompareShortcut('mesmo-2023')}
              >
                Mesmo período 2023
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => handleCompareShortcut('anterior')}
              >
                Período anterior ({dias} dias antes)
              </Button>
            </div>
          </div>

          {/* Botão Gerar */}
          <Button className="w-full" size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Análise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
