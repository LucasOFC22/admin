import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, FileOutput } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlowBuilderConvertBase64ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { 
    sourceVariable: string; 
    outputVariable: string;
    filename?: string;
    contentType?: string;
  }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

const contentTypeOptions = [
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/png', label: 'Imagem PNG' },
  { value: 'image/jpeg', label: 'Imagem JPEG' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (XLSX)' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (DOCX)' },
  { value: 'text/plain', label: 'Texto (TXT)' },
  { value: 'text/csv', label: 'CSV' },
  { value: 'application/json', label: 'JSON' },
  { value: 'application/xml', label: 'XML' },
  { value: 'custom', label: 'Personalizado...' },
];

export const FlowBuilderConvertBase64Modal: React.FC<FlowBuilderConvertBase64ModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [sourceVariable, setSourceVariable] = useState('');
  const [outputVariable, setOutputVariable] = useState('');
  const [filename, setFilename] = useState('');
  const [contentType, setContentType] = useState('application/pdf');
  const [customContentType, setCustomContentType] = useState('');

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data) {
      setSourceVariable(data.data.sourceVariable || '');
      setOutputVariable(data.data.outputVariable || '');
      setFilename(data.data.filename || '');
      
      const savedContentType = data.data.contentType || 'application/pdf';
      const isPreset = contentTypeOptions.some(opt => opt.value === savedContentType && opt.value !== 'custom');
      
      if (isPreset) {
        setContentType(savedContentType);
        setCustomContentType('');
      } else {
        setContentType('custom');
        setCustomContentType(savedContentType);
      }
    } else if (mode === 'create') {
      setSourceVariable('');
      setOutputVariable('');
      setFilename('');
      setContentType('application/pdf');
      setCustomContentType('');
    }
  }, [mode, data, open]);

  const handleSave = () => {
    if (!sourceVariable.trim()) {
      toast({
        title: "Erro",
        description: "Informe a variável de origem (com o base64)",
        variant: "destructive"
      });
      return;
    }

    if (!outputVariable.trim()) {
      toast({
        title: "Erro",
        description: "Informe a variável de saída para o arquivo",
        variant: "destructive"
      });
      return;
    }

    const finalContentType = contentType === 'custom' ? customContentType : contentType;

    const saveData = {
      sourceVariable: sourceVariable.trim(),
      outputVariable: outputVariable.trim(),
      filename: filename.trim() || undefined,
      contentType: finalContentType || 'application/pdf',
    };

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          ...saveData
        }
      });
    } else {
      onSave(saveData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            {mode === 'create' ? 'Converter Base64 para Arquivo' : 'Editar Conversão Base64'}
          </DialogTitle>
          <DialogDescription>
            Converte dados base64 de uma variável em um arquivo pronto para envio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sourceVariable">Variável de origem (base64) *</Label>
            <Input
              id="sourceVariable"
              placeholder="Ex: pdfboleto, arquivo_base64"
              value={sourceVariable}
              onChange={(e) => setSourceVariable(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nome da variável que contém o base64 (sem {'{{'} {'}}'})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputVariable">Variável de saída *</Label>
            <Input
              id="outputVariable"
              placeholder="Ex: arquivo_convertido"
              value={outputVariable}
              onChange={(e) => setOutputVariable(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nome da variável onde o arquivo será salvo (para usar no node Documento)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">Nome do arquivo (opcional)</Label>
            <Input
              id="filename"
              placeholder="Ex: boleto.pdf, relatorio.xlsx"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se não informado, será gerado automaticamente. Suporta variáveis: {'{{nome}}'}.pdf
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de arquivo (Content-Type)</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {contentType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customContentType">Content-Type personalizado</Label>
              <Input
                id="customContentType"
                placeholder="Ex: application/octet-stream"
                value={customContentType}
                onChange={(e) => setCustomContentType(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
