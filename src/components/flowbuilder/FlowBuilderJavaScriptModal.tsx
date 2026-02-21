import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, Plus, X, Variable, Play, AlertCircle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FlowBuilderJavaScriptModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    code?: string;
    outputVariables?: Array<{ name: string; path?: string }>;
    description?: string;
  };
  onSave: (data: {
    code: string;
    outputVariables: Array<{ name: string; path?: string }>;
    description: string;
  }) => void;
}

const defaultCode = `// Variáveis disponíveis:
// - variables: objeto com todas as variáveis do fluxo
// - input: última resposta do usuário
// - sessionId: ID da sessão atual

// Exemplo: transformar dados
const resultado = {
  nome: variables.nome?.toUpperCase() || '',
  dataProcessamento: new Date().toISOString(),
  input: input
};

// Retorne o resultado (será salvo nas variáveis de saída)
return resultado;`;

const codeExamples = [
  {
    name: 'Formatação de CPF',
    code: `// Formatar CPF
const cpf = variables.cpf || '';
const cpfLimpo = cpf.replace(/\\D/g, '');
const cpfFormatado = cpfLimpo.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');

return { cpf_formatado: cpfFormatado };`
  },
  {
    name: 'Cálculo de Valor',
    code: `// Calcular valor com desconto
const valor = parseFloat(variables.valor) || 0;
const desconto = parseFloat(variables.desconto) || 0;
const valorFinal = valor - (valor * desconto / 100);

return { 
  valor_final: valorFinal.toFixed(2),
  economia: (valor * desconto / 100).toFixed(2)
};`
  },
  {
    name: 'Validação de Email',
    code: `// Validar email
const email = variables.email || '';
const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const isValid = emailRegex.test(email);

return { 
  email_valido: isValid,
  mensagem: isValid ? 'Email válido!' : 'Email inválido'
};`
  },
  {
    name: 'Parsing de JSON (API)',
    code: `// Processar resposta de API
const apiResponse = variables.api_response || '{}';
let dados;

try {
  dados = JSON.parse(apiResponse);
} catch (e) {
  return { erro: 'JSON inválido' };
}

return {
  nome: dados.nome || '',
  status: dados.status || 'desconhecido',
  items_count: dados.items?.length || 0
};`
  },
  {
    name: 'Formatação de Data',
    code: `// Formatar data
const dataISO = variables.data || new Date().toISOString();
const data = new Date(dataISO);

const dia = data.getDate().toString().padStart(2, '0');
const mes = (data.getMonth() + 1).toString().padStart(2, '0');
const ano = data.getFullYear();
const hora = data.getHours().toString().padStart(2, '0');
const minuto = data.getMinutes().toString().padStart(2, '0');

return {
  data_formatada: \`\${dia}/\${mes}/\${ano}\`,
  hora_formatada: \`\${hora}:\${minuto}\`,
  data_completa: \`\${dia}/\${mes}/\${ano} às \${hora}:\${minuto}\`
};`
  },
  {
    name: 'Loop em Array',
    code: `// Processar array de itens
const items = variables.items || [];
let total = 0;
const nomes = [];

for (const item of items) {
  total += item.valor || 0;
  if (item.nome) nomes.push(item.nome);
}

return {
  total: total.toFixed(2),
  quantidade: items.length,
  lista_nomes: nomes.join(', ')
};`
  }
];

export const FlowBuilderJavaScriptModal: React.FC<FlowBuilderJavaScriptModalProps> = ({
  open,
  onClose,
  initialData,
  onSave,
}) => {
  const [code, setCode] = useState(initialData?.code || defaultCode);
  const [description, setDescription] = useState(initialData?.description || '');
  const [outputVariables, setOutputVariables] = useState<Array<{ name: string; path?: string }>>(
    initialData?.outputVariables || [{ name: 'resultado', path: '' }]
  );
  const [activeTab, setActiveTab] = useState('code');

  useEffect(() => {
    if (open) {
      setCode(initialData?.code || defaultCode);
      setDescription(initialData?.description || '');
      setOutputVariables(initialData?.outputVariables || [{ name: 'resultado', path: '' }]);
    }
  }, [open, initialData]);

  const handleAddOutputVariable = () => {
    setOutputVariables([...outputVariables, { name: '', path: '' }]);
  };

  const handleRemoveOutputVariable = (index: number) => {
    setOutputVariables(outputVariables.filter((_, i) => i !== index));
  };

  const handleUpdateOutputVariable = (index: number, field: 'name' | 'path', value: string) => {
    const updated = [...outputVariables];
    updated[index] = { ...updated[index], [field]: value };
    setOutputVariables(updated);
  };

  const handleSave = () => {
    onSave({
      code,
      outputVariables: outputVariables.filter(v => v.name.trim()),
      description
    });
    onClose();
  };

  const handleApplyExample = (exampleCode: string) => {
    setCode(exampleCode);
    setActiveTab('code');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-amber-500" />
            Bloco JavaScript
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="code" className="flex items-center gap-1.5">
              <Code2 className="h-4 w-4" />
              Código
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-1.5">
              <Play className="h-4 w-4" />
              Exemplos
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center gap-1.5">
              <Variable className="h-4 w-4" />
              Variáveis de Saída
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex-1 flex flex-col gap-4 min-h-0 mt-4">
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Processar dados do cliente..."
                className="mt-1"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <Label>Código JavaScript</Label>
              <div className="flex-1 min-h-[300px] mt-1 relative">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Seu código aqui..."
                  className="font-mono text-sm h-full resize-none bg-slate-950 text-slate-50 border-slate-700"
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Variáveis disponíveis:</p>
                <ul className="space-y-0.5">
                  <li><code className="bg-blue-100 px-1 rounded">variables</code> - Todas as variáveis do fluxo</li>
                  <li><code className="bg-blue-100 px-1 rounded">input</code> - Última resposta do usuário</li>
                  <li><code className="bg-blue-100 px-1 rounded">sessionId</code> - ID da sessão atual</li>
                </ul>
                <p className="mt-2">Use <code className="bg-blue-100 px-1 rounded">return</code> para retornar dados que serão salvos nas variáveis de saída.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {codeExamples.map((example, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                      <span className="font-medium text-sm">{example.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyExample(example.code)}
                        className="h-7"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Usar
                      </Button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-50 text-xs overflow-x-auto">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 min-h-0 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p>As variáveis de saída armazenam os valores retornados pelo seu código.</p>
                  <p className="mt-1">Se o código retornar um objeto, você pode usar o caminho (path) para acessar propriedades específicas.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Variáveis de Saída</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOutputVariable}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {outputVariables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                        <Variable className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-slate-500">Nome da Variável</Label>
                            <Input
                              value={variable.name}
                              onChange={(e) => handleUpdateOutputVariable(index, 'name', e.target.value)}
                              placeholder="resultado"
                              className="h-8 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Caminho (opcional)</Label>
                            <Input
                              value={variable.path || ''}
                              onChange={(e) => handleUpdateOutputVariable(index, 'path', e.target.value)}
                              placeholder="data.items[0].name"
                              className="h-8 mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOutputVariable(index)}
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
