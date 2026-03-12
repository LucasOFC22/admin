import React, { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Globe, Play, Loader2, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { cn } from '@/lib/utils';
import { JsonPathSelector } from './JsonPathSelector';
import { VariablesHelper } from './VariablesHelper';

// Variáveis pré-definidas do sistema
const PREDEFINED_VARIABLES: FlowVariable[] = [
  { variable_key: 'telefone', variable_name: 'Telefone do contato', variable_type: 'string' },
  { variable_key: 'phone', variable_name: 'Phone (alias)', variable_type: 'string' },
  { variable_key: 'nome', variable_name: 'Nome do contato', variable_type: 'string' },
  { variable_key: 'name', variable_name: 'Name (alias)', variable_type: 'string' },
  { variable_key: 'data', variable_name: 'Data atual (pt-BR)', variable_type: 'string' },
  { variable_key: 'date', variable_name: 'Date (alias)', variable_type: 'string' },
  { variable_key: 'hora', variable_name: 'Hora atual', variable_type: 'string' },
  { variable_key: 'time', variable_name: 'Time (alias)', variable_type: 'string' },
  { variable_key: 'timestamp', variable_name: 'Data/hora ISO', variable_type: 'string' },
];

interface Header {
  id: string;
  key: string;
  value: string;
}

interface OutputMapping {
  id: string;
  path: string;
  variable: string;
}

interface FlowVariable {
  id?: string;
  variable_key: string;
  variable_name: string;
  variable_type: string;
  default_value?: string;
}

interface SelectedTestVariable {
  key: string;
  value: string;
}

interface HTTPRequestData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Header[];
  body: string;
  timeout: number;
  continueOnError: boolean;
  outputMappings: OutputMapping[];
  responseFormat: 'json' | 'file';
  fileVariable?: string;
}

interface FlowBuilderHTTPRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HTTPRequestData) => void;
  onUpdate?: (data: HTTPRequestData) => void;
  data?: { data: HTTPRequestData };
  mode: 'create' | 'edit';
  flowId?: string;
}

const defaultData: HTTPRequestData = {
  url: '',
  method: 'GET',
  headers: [],
  body: '{\n  \n}',
  timeout: 30,
  continueOnError: false,
  outputMappings: [],
  responseFormat: 'json',
  fileVariable: '',
};

// Variable autocomplete input component
const VariableInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  variables: FlowVariable[];
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}> = ({ value, onChange, variables, placeholder, className, multiline }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    onChange(newValue);
    setCursorPosition(pos);

    const textBeforeCursor = newValue.slice(0, pos);
    const braceMatch = textBeforeCursor.match(/\{\{([^}]*?)$/);
    
    if (braceMatch) {
      setSearchTerm(braceMatch[1].toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertVariable = (variableKey: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const braceMatch = textBeforeCursor.match(/\{\{([^}]*?)$/);
    
    if (braceMatch) {
      const newValue = textBeforeCursor.slice(0, -braceMatch[0].length) + `{{${variableKey}}}` + textAfterCursor;
      onChange(newValue);
    }
    setShowSuggestions(false);
  };

  const filteredVariables = variables.filter(v => 
    v.variable_key.toLowerCase().includes(searchTerm) || 
    v.variable_name.toLowerCase().includes(searchTerm)
  );

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={cn("font-mono", className)}
      />
      {showSuggestions && filteredVariables.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredVariables.map((variable) => (
            <button
              key={variable.variable_key}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
              onClick={() => insertVariable(variable.variable_key)}
            >
              <span className="font-mono text-sm text-primary">{`{{${variable.variable_key}}}`}</span>
              <span className="text-xs text-muted-foreground">{variable.variable_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const FlowBuilderHTTPRequestModal: React.FC<FlowBuilderHTTPRequestModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode,
  flowId,
}) => {
  const [formData, setFormData] = useState<HTTPRequestData>(defaultData);
  const [variables, setVariables] = useState<FlowVariable[]>([]);
  const [selectedTestVariables, setSelectedTestVariables] = useState<SelectedTestVariable[]>([]);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    statusCode?: number;
    response?: any;
    error?: string;
    time?: number;
  }>({ status: 'idle' });
  const [pendingMapping, setPendingMapping] = useState<{ path: string; value: any } | null>(null);

  useEffect(() => {
    const loadVariables = async () => {
      if (!flowId) {
        // Mesmo sem flowId, ainda temos variáveis pré-definidas
        setVariables([...PREDEFINED_VARIABLES]);
        return;
      }
      
      try {
        const supabase = requireAuthenticatedClient();
        const { data: vars, error } = await supabase
          .from('flow_variables')
          .select('*')
          .eq('flow_id', flowId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        // Combinar variáveis pré-definidas com as do fluxo
        setVariables([...PREDEFINED_VARIABLES, ...(vars || [])]);
      } catch (error) {
        console.error('Error loading variables:', error);
        setVariables([...PREDEFINED_VARIABLES]);
      }
    };

    if (open) {
      loadVariables();
    }
  }, [open, flowId]);

  const initialDataRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (data?.data) {
      setFormData({
        ...defaultData,
        ...data.data,
        headers: data.data.headers || [],
        outputMappings: data.data.outputMappings || [],
      });
    } else {
      setFormData(defaultData);
    }
    setTestResult({ status: 'idle' });
  }, [open, data]);

  const handleSave = () => {
    if (mode === 'edit' && onUpdate) {
      onUpdate(formData);
    } else {
      onSave(formData);
    }
  };

  const addHeader = () => {
    setFormData(prev => ({
      ...prev,
      headers: [...prev.headers, { id: `header-${Date.now()}`, key: '', value: '' }],
    }));
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      headers: prev.headers.map(h => (h.id === id ? { ...h, [field]: value } : h)),
    }));
  };

  const removeHeader = (id: string) => {
    setFormData(prev => ({
      ...prev,
      headers: prev.headers.filter(h => h.id !== id),
    }));
  };

  const updateOutputMapping = (id: string, field: 'path' | 'variable', value: string) => {
    setFormData(prev => ({
      ...prev,
      outputMappings: prev.outputMappings.map(o => (o.id === id ? { ...o, [field]: value } : o)),
    }));
  };

  const removeOutputMapping = (id: string) => {
    setFormData(prev => ({
      ...prev,
      outputMappings: prev.outputMappings.filter(o => o.id !== id),
    }));
  };

  const addTestVariable = (key: string) => {
    if (selectedTestVariables.find(v => v.key === key)) return;
    const varInfo = variables.find(v => v.variable_key === key);
    setSelectedTestVariables(prev => [
      ...prev,
      { key, value: varInfo?.default_value || '' }
    ]);
  };

  const updateTestVariable = (key: string, value: string) => {
    setSelectedTestVariables(prev => 
      prev.map(v => v.key === key ? { ...v, value } : v)
    );
  };

  const removeTestVariable = (key: string) => {
    setSelectedTestVariables(prev => prev.filter(v => v.key !== key));
  };

  const replaceVariables = (str: string): string => {
    let result = str;
    selectedTestVariables.forEach(v => {
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value);
    });
    return result;
  };

  const handleTest = async () => {
    setTestResult({ status: 'loading' });
    const startTime = Date.now();

    try {
      const url = replaceVariables(formData.url);
      const headers: Record<string, string> = {};
      formData.headers.forEach(h => {
        if (h.key && h.value) {
          headers[replaceVariables(h.key)] = replaceVariables(h.value);
        }
      });

      const options: RequestInit = {
        method: formData.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(formData.method) && formData.body) {
        options.body = replaceVariables(formData.body);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), formData.timeout * 1000);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      const endTime = Date.now();
      let responseData;
      
      if (formData.responseFormat === 'file') {
        // Para respostas binárias (PDF, imagem, etc.), converter para base64
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        responseData = {
          base64,
          contentType,
          size: arrayBuffer.byteLength,
          message: `Arquivo recebido: ${contentType} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`
        };
      } else {
        const responseClone = response.clone();
        try {
          responseData = await response.json();
        } catch {
          responseData = await responseClone.text();
        }
      }

      setTestResult({
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        response: responseData,
        time: endTime - startTime,
      });
    } catch (error: any) {
      setTestResult({
        status: 'error',
        error: error.message || 'Erro desconhecido',
        time: Date.now() - startTime,
      });
    }
  };

  const showBody = ['POST', 'PUT', 'PATCH'].includes(formData.method);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-rose-600" />
            {mode === 'edit' ? 'Editar HTTP Request' : 'Novo HTTP Request'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="test">Testar</TabsTrigger>
          </TabsList>

          {/* TAB: CONFIGURAÇÃO */}
          <TabsContent value="config" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4 pb-4">
                {/* Method and URL */}
                <div className="space-y-2">
                  <Label>Requisição</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.method}
                      onValueChange={(value: HTTPRequestData['method']) =>
                        setFormData(prev => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                    <VariableInput
                      value={formData.url}
                      onChange={(value) => setFormData(prev => ({ ...prev, url: value }))}
                      variables={variables}
                      placeholder="https://api.exemplo.com/endpoint"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 rounded">{`{{variavel}}`}</code> para inserir variáveis do fluxo
                  </p>
                  
                  {/* VariablesHelper para mostrar variáveis disponíveis */}
                  <VariablesHelper 
                    onInsert={(variable) => setFormData(prev => ({ ...prev, url: prev.url + variable }))} 
                  />
                </div>

                {/* Headers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Headers</Label>
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {formData.headers.length > 0 ? (
                    <div className="space-y-2">
                      {formData.headers.map((header) => (
                        <div key={header.id} className="flex gap-2 items-center">
                          <VariableInput
                            value={header.key}
                            onChange={(value) => updateHeader(header.id, 'key', value)}
                            variables={variables}
                            placeholder="Chave (ex: Authorization)"
                            className="flex-1"
                          />
                          <VariableInput
                            value={header.value}
                            onChange={(value) => updateHeader(header.id, 'value', value)}
                            variables={variables}
                            placeholder="Valor"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeader(header.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded-md">
                      Nenhum header adicionado
                    </p>
                  )}
                </div>

                {/* Body */}
                {showBody && (
                  <div className="space-y-2">
                    <Label>Body (JSON)</Label>
                    <VariableInput
                      value={formData.body}
                      onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
                      variables={variables}
                      placeholder='{"chave": "valor"}'
                      className="min-h-[200px]"
                      multiline
                    />
                    <VariablesHelper 
                      onInsert={(variable) => setFormData(prev => ({ ...prev, body: prev.body + variable }))} 
                    />
                  </div>
                )}

                {/* Response Format */}
                <div className="space-y-2">
                  <Label>Formato da Resposta</Label>
                  <Select
                    value={formData.responseFormat}
                    onValueChange={(value: 'json' | 'file') =>
                      setFormData(prev => ({ ...prev, responseFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON (padrão)</SelectItem>
                      <SelectItem value="file">Arquivo / Binary Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use "Arquivo" para baixar PDFs, imagens ou outros arquivos binários
                  </p>
                </div>

                {/* File Variable (only shown when responseFormat is 'file') */}
                {formData.responseFormat === 'file' && (
                  <div className="space-y-2">
                    <Label>Variável para armazenar o arquivo</Label>
                    <Select
                      value={formData.fileVariable || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, fileVariable: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma variável..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {variables.map((v) => (
                          <SelectItem key={v.variable_key} value={v.variable_key}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary">{`{{${v.variable_key}}}`}</span>
                              <span className="text-muted-foreground text-xs">{v.variable_name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O arquivo será salvo como base64 com contentType e URL
                    </p>
                  </div>
                )}

                {/* Timeout and Continue on error */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timeout (segundos)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={120}
                      value={formData.timeout}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-0.5">
                      <Label>Continuar em caso de erro</Label>
                      <p className="text-xs text-muted-foreground">
                        Se desativado, o fluxo será interrompido
                      </p>
                    </div>
                    <Switch
                      checked={formData.continueOnError}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, continueOnError: checked }))}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: OUTPUT */}
          <TabsContent value="output" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4 pb-4">
                {/* Add Mapping Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mapeamentos de Saída</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Arraste um campo do JSON para definir o path
                      </p>
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          outputMappings: [
                            ...prev.outputMappings,
                            { id: `output-${Date.now()}`, path: '', variable: value }
                          ],
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Adicionar variável..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {variables
                          .filter(v => !formData.outputMappings.find(m => m.variable === v.variable_key))
                          .map((v) => (
                            <SelectItem key={v.variable_key} value={v.variable_key}>
                              <span className="flex items-center gap-2">
                                <span className="font-mono text-xs text-primary">{`{{${v.variable_key}}}`}</span>
                                <span className="text-muted-foreground text-xs">{v.variable_name}</span>
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Mappings List */}
                  {formData.outputMappings.length > 0 && (
                    <div className="space-y-2">
                      {formData.outputMappings.map((mapping) => {
                        const varInfo = variables.find(v => v.variable_key === mapping.variable);
                        return (
                          <Card 
                            key={mapping.id} 
                            className={cn(
                              "p-2 transition-colors",
                              pendingMapping && !mapping.path ? "ring-2 ring-primary animate-pulse" : ""
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('ring-2', 'ring-primary');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('ring-2', 'ring-primary');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('ring-2', 'ring-primary');
                              const path = e.dataTransfer.getData('text/plain');
                              if (path) {
                                updateOutputMapping(mapping.id, 'path', path);
                              }
                            }}
                          >
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">
                                {varInfo ? `{{${mapping.variable}}}` : mapping.variable || 'Variável'}
                              </Badge>
                              <span className="text-muted-foreground">←</span>
                              <Input
                                value={mapping.path}
                                onChange={(e) => updateOutputMapping(mapping.id, 'path', e.target.value)}
                                placeholder="Arraste um campo aqui ou digite o path..."
                                className="h-7 font-mono text-xs flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                                onClick={() => removeOutputMapping(mapping.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Test Button */}
                <Button 
                  onClick={handleTest} 
                  disabled={!formData.url || testResult.status === 'loading'}
                  className="w-full"
                  variant="secondary"
                >
                  {testResult.status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Testar Requisição
                    </>
                  )}
                </Button>

                {/* Test Result with Interactive JSON */}
                {testResult.status !== 'idle' && testResult.status !== 'loading' && (
                  <Card className={cn(
                    "overflow-hidden",
                    testResult.status === 'success' ? "border-green-200" : "border-red-200"
                  )}>
                    <div className={cn(
                      "flex items-center justify-between px-4 py-2",
                      testResult.status === 'success' ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                    )}>
                      <div className="flex items-center gap-2">
                        {testResult.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={cn(
                          "font-medium text-sm",
                          testResult.status === 'success' ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                        )}>
                          {testResult.statusCode ? `Status ${testResult.statusCode}` : 'Erro'}
                        </span>
                      </div>
                      {testResult.time && (
                        <Badge variant="outline" className="text-xs">{testResult.time}ms</Badge>
                      )}
                    </div>
                    
                    {testResult.error ? (
                      <div className="p-4">
                        <p className="text-sm text-red-600">{testResult.error}</p>
                      </div>
                    ) : testResult.response && typeof testResult.response === 'object' ? (
                      <div className="border-t">
                        <div className="px-4 py-2 bg-muted/30 border-b">
                          <p className="text-xs text-muted-foreground">
                            Arraste um campo para o mapeamento acima
                          </p>
                        </div>
                        <div className="p-4">
                          <JsonPathSelector
                            data={testResult.response}
                            onSelect={(path, value) => {
                              const emptyMapping = formData.outputMappings.find(m => !m.path);
                              if (emptyMapping) {
                                updateOutputMapping(emptyMapping.id, 'path', path);
                              }
                            }}
                            draggable
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {String(testResult.response)}
                        </pre>
                      </div>
                    )}
                  </Card>
                )}

                {testResult.status === 'idle' && formData.outputMappings.length === 0 && (
                  <Card className="p-6 text-center border-dashed">
                    <div className="space-y-2">
                      <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Adicione variáveis e teste a requisição para mapear campos
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: TESTAR */}
          <TabsContent value="test" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4 pb-4">
                {/* Add Test Variable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Variáveis de Teste</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Defina valores para testar a requisição
                      </p>
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => addTestVariable(value)}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Adicionar variável..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {variables
                          .filter(v => !selectedTestVariables.find(sv => sv.key === v.variable_key))
                          .map((v) => (
                            <SelectItem key={v.variable_key} value={v.variable_key}>
                              <span className="flex items-center gap-2">
                                <span className="font-mono text-xs text-primary">{`{{${v.variable_key}}}`}</span>
                                <span className="text-muted-foreground text-xs">{v.variable_name}</span>
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Test Variables */}
                  {selectedTestVariables.length > 0 && (
                    <div className="space-y-2">
                      {selectedTestVariables.map((testVar) => {
                        const varInfo = variables.find(v => v.variable_key === testVar.key);
                        return (
                          <div key={testVar.key} className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs shrink-0 min-w-[100px]">
                              {`{{${testVar.key}}}`}
                            </Badge>
                            <Input
                              value={testVar.value}
                              onChange={(e) => updateTestVariable(testVar.key, e.target.value)}
                              placeholder={varInfo?.variable_name || 'Valor...'}
                              className="h-8 text-sm flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeTestVariable(testVar.key)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview da Requisição</Label>
                  <Card className="p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="font-mono">{formData.method}</Badge>
                      <code className="text-sm break-all">{replaceVariables(formData.url) || 'URL não definida'}</code>
                    </div>
                    {showBody && formData.body && (
                      <div className="mt-2 pt-2 border-t">
                        <Label className="text-xs text-muted-foreground">Body:</Label>
                        <pre className="text-xs mt-1 bg-muted p-2 rounded whitespace-pre-wrap break-all">
                          {replaceVariables(formData.body)}
                        </pre>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Test Button */}
                <Button 
                  onClick={handleTest} 
                  disabled={!formData.url || testResult.status === 'loading'}
                  className="w-full"
                >
                  {testResult.status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Teste
                    </>
                  )}
                </Button>

                {/* Test Result */}
                {testResult.status !== 'idle' && testResult.status !== 'loading' && (
                  <Card className={cn(
                    "p-4",
                    testResult.status === 'success' ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {testResult.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={cn(
                          "font-semibold",
                          testResult.status === 'success' ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                        )}>
                          {testResult.statusCode ? `Status ${testResult.statusCode}` : 'Erro'}
                        </span>
                      </div>
                      {testResult.time && (
                        <Badge variant="outline">{testResult.time}ms</Badge>
                      )}
                    </div>
                    
                    {testResult.error ? (
                      <p className="text-sm text-red-600">{testResult.error}</p>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Resposta:</Label>
                        <pre className="text-xs bg-background p-3 rounded border overflow-auto whitespace-pre-wrap break-all">
                          {typeof testResult.response === 'object' 
                            ? JSON.stringify(testResult.response, null, 2)
                            : testResult.response
                          }
                        </pre>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {mode === 'edit' ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
