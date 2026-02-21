import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  Copy,
  X
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface DREAIResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AIAnalysisResult | null;
  raw?: string;
  isLoading?: boolean;
}

export interface AIAnalysisResult {
  resumo_executivo?: string;
  indicadores?: {
    nome: string;
    valor: string;
    tendencia?: 'alta' | 'baixa' | 'estavel';
    observacao?: string;
  }[];
  pontos_positivos?: string[];
  pontos_atencao?: string[];
  recomendacoes?: {
    acao: string;
    prioridade?: 'alta' | 'media' | 'baixa';
    impacto?: string;
  }[];
  comparativo?: {
    item: string;
    periodo_atual: string;
    periodo_anterior: string;
    variacao: string;
  }[];
  conclusao?: string;
}

export const DREAIResultModal: React.FC<DREAIResultModalProps> = ({
  open,
  onOpenChange,
  data,
  raw,
  isLoading
}) => {
  const handleCopy = () => {
    const text = raw || JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Análise copiada!');
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'alta') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'baixa') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getPriorityColor = (priority?: string) => {
    if (priority === 'alta') return 'bg-red-100 text-red-700 border-red-200';
    if (priority === 'media') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resultado da Análise com IA
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Analisando dados financeiros...</p>
            </div>
          ) : data ? (
            <div className="space-y-6 pt-4">
              {/* Resumo Executivo */}
              {data.resumo_executivo && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Resumo Executivo
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.resumo_executivo}
                  </p>
                </div>
              )}

              {/* Indicadores */}
              {data.indicadores && data.indicadores.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Indicadores Principais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.indicadores.map((ind, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">{ind.nome}</span>
                          {getTrendIcon(ind.tendencia)}
                        </div>
                        <p className="text-lg font-semibold">{ind.valor}</p>
                        {ind.observacao && (
                          <p className="text-xs text-muted-foreground mt-1">{ind.observacao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pontos Positivos */}
              {data.pontos_positivos && data.pontos_positivos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pontos Positivos
                  </h3>
                  <ul className="space-y-2">
                    {data.pontos_positivos.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos de Atenção */}
              {data.pontos_atencao && data.pontos_atencao.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Pontos de Atenção
                  </h3>
                  <ul className="space-y-2">
                    {data.pontos_atencao.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comparativo */}
              {data.comparativo && data.comparativo.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Comparativo de Períodos</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Item</th>
                          <th className="text-right p-2 font-medium">Período Atual</th>
                          <th className="text-right p-2 font-medium">Período Anterior</th>
                          <th className="text-right p-2 font-medium">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.comparativo.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{item.item}</td>
                            <td className="p-2 text-right">{item.periodo_atual}</td>
                            <td className="p-2 text-right">{item.periodo_anterior}</td>
                            <td className="p-2 text-right font-medium">
                              <span className={item.variacao.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
                                {item.variacao}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {data.recomendacoes && data.recomendacoes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Recomendações
                  </h3>
                  <div className="space-y-3">
                    {data.recomendacoes.map((rec, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${getPriorityColor(rec.prioridade)}`}
                          >
                            {rec.prioridade || 'média'}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{rec.acao}</p>
                            {rec.impacto && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Impacto: {rec.impacto}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusão */}
              {data.conclusao && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h3 className="font-semibold mb-2">Conclusão</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.conclusao}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum dado de análise disponível</p>
              {raw && (
                <div className="w-full mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Resposta bruta:</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {raw}
                  </pre>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
