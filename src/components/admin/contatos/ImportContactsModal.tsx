import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, ArrowRight, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { contatosService } from '@/services/contatos/contatosService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// XLSX carregado on-demand para reduzir bundle inicial
type XLSXType = typeof import('xlsx');
let xlsxModule: XLSXType | null = null;
const getXLSX = async (): Promise<XLSXType> => {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
};

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  nome: string;
  telefone: string;
  email?: string;
}

const SYSTEM_FIELDS = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'telefone', label: 'Telefone', required: true },
  { key: 'email', label: 'Email', required: false },
];

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    nome: '',
    telefone: '',
    email: ''
  });

  const resetState = useCallback(() => {
    setFile(null);
    setStep('upload');
    setParsedData([]);
    setFileColumns([]);
    setColumnMapping({ nome: '', telefone: '', email: '' });
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseFile = async (selectedFile: File): Promise<{ columns: string[], data: ParsedRow[] }> => {
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    
    // Carrega XLSX antes se necessário (fora da Promise)
    const XLSX = isExcel ? await getXLSX() : null;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          
          if (isExcel && XLSX) {
            // Parse Excel
            const workbook = XLSX.read(content, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              reject(new Error('Arquivo vazio ou sem dados'));
              return;
            }
            
            const firstRow = jsonData[0] as unknown as string[];
            const headers = firstRow.map(h => String(h).trim());
            const rows = jsonData.slice(1).map(row => {
              const obj: ParsedRow = {};
              const rowArray = row as unknown as string[];
              headers.forEach((header, index) => {
                obj[header] = String(rowArray[index] || '').trim();
              });
              return obj;
            }).filter(row => Object.values(row).some(v => v));
            
            resolve({ columns: headers, data: rows });
          } else {
            // Parse CSV
            const text = content as string;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
              reject(new Error('Arquivo vazio ou sem dados'));
              return;
            }
            
            // Detectar separador (vírgula ou ponto-e-vírgula)
            const separator = lines[0].includes(';') ? ';' : ',';
            
            const parseCSVLine = (line: string): string[] => {
              const result: string[] = [];
              let current = '';
              let inQuotes = false;
              
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === separator && !inQuotes) {
                  result.push(current.trim().replace(/^"|"$/g, ''));
                  current = '';
                } else {
                  current += char;
                }
              }
              result.push(current.trim().replace(/^"|"$/g, ''));
              return result;
            };
            
            const headers = parseCSVLine(lines[0]);
            const rows = lines.slice(1).map(line => {
              const values = parseCSVLine(line);
              const obj: ParsedRow = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              return obj;
            }).filter(row => Object.values(row).some(v => v));
            
            resolve({ columns: headers, data: rows });
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      
      if (isExcel) {
        reader.readAsBinaryString(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const { columns, data } = await parseFile(selectedFile);
      setFileColumns(columns);
      setParsedData(data);
      
      // Tentar auto-mapear colunas
      const autoMapping: ColumnMapping = { nome: '', telefone: '', email: '' };
      
      columns.forEach(col => {
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('nome') || lowerCol === 'name') {
          autoMapping.nome = col;
        } else if (lowerCol.includes('telefone') || lowerCol.includes('phone') || lowerCol.includes('celular') || lowerCol.includes('whatsapp')) {
          autoMapping.telefone = col;
        } else if (lowerCol.includes('email') || lowerCol.includes('e-mail')) {
          autoMapping.email = col;
        }
      });
      
      setColumnMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo');
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingComplete = () => {
    if (!columnMapping.nome || !columnMapping.telefone) {
      toast.error('Nome e Telefone são campos obrigatórios');
      return;
    }
    setStep('preview');
  };

  const getMappedData = (): Array<{ nome: string; telefone: string; email?: string }> => {
    return parsedData.map(row => ({
      nome: row[columnMapping.nome] || '',
      telefone: row[columnMapping.telefone] || '',
      ...(columnMapping.email && row[columnMapping.email] ? { email: row[columnMapping.email] } : {})
    })).filter(contact => contact.nome && contact.telefone);
  };

  const handleImport = async () => {
    const contacts = getMappedData();
    
    if (contacts.length === 0) {
      toast.error('Nenhum contato válido para importar');
      return;
    }

    setIsLoading(true);
    try {
      await contatosService.importarContatos(contacts);
      toast.success(`${contacts.length} contato(s) importado(s) com sucesso!`);
      handleClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao importar contatos:', error);
      toast.error(error.message || 'Não foi possível importar os contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const previewData = getMappedData().slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Contatos
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Selecione um arquivo CSV ou Excel para importar'}
            {step === 'mapping' && 'Mapeie as colunas do arquivo para os campos do sistema'}
            {step === 'preview' && 'Revise os dados antes de importar'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Badge variant={step === 'upload' ? 'default' : 'secondary'}>1. Upload</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant={step === 'mapping' ? 'default' : 'secondary'}>2. Mapeamento</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant={step === 'preview' ? 'default' : 'secondary'}>3. Preview</Badge>
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Suporte para arquivos CSV e Excel (.xlsx, .xls). As colunas serão detectadas automaticamente.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isLoading ? (
                    <p className="text-sm font-medium">Processando arquivo...</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Clique para selecionar um arquivo</p>
                      <p className="text-xs text-muted-foreground mt-1">CSV, XLSX ou XLS</p>
                    </>
                  )}
                </label>
              </div>
            </>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {parsedData.length} linhas encontradas • {fileColumns.length} colunas detectadas
                </p>
              </div>

              <div className="space-y-3">
                {SYSTEM_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-32 flex items-center gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && <span className="text-destructive">*</span>}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={columnMapping[field.key as keyof ColumnMapping] || ''}
                      onValueChange={(value) => setColumnMapping(prev => ({
                        ...prev,
                        [field.key]: value === '_none_' ? '' : value
                      }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        {!field.required && (
                          <SelectItem value="_none_">-- Não mapear --</SelectItem>
                        )}
                        {fileColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {columnMapping[field.key as keyof ColumnMapping] && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button onClick={handleMappingComplete}>
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de contatos válidos:</span>
                  <Badge variant="default">{getMappedData().length}</Badge>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 border-b text-xs font-medium">
                  <span>Nome</span>
                  <span>Telefone</span>
                  <span>Email</span>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="divide-y">
                    {previewData.map((contact, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 p-3 text-sm">
                        <span className="truncate">{contact.nome}</span>
                        <span className="truncate">{contact.telefone}</span>
                        <span className="truncate text-muted-foreground">{contact.email || '-'}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {getMappedData().length > 5 && (
                  <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    ... e mais {getMappedData().length - 5} contatos
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep('mapping')} disabled={isLoading}>
                  Voltar
                </Button>
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? 'Importando...' : `Importar ${getMappedData().length} contatos`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportContactsModal;
