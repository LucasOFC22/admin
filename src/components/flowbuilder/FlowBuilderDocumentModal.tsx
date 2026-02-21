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
import { Switch } from '@/components/ui/switch';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentData {
  documentUrl: string;
  filename: string;
  caption?: string;
  sendAllFiles?: boolean;
}

interface FlowBuilderDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DocumentData) => void;
  onUpdate?: (data: DocumentData) => void;
  data?: { data: DocumentData };
  mode: 'create' | 'edit';
}

const defaultData: DocumentData = {
  documentUrl: '',
  filename: '',
  caption: '',
};

// Variable autocomplete input component
const VariableInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("font-mono", className)}
    />
  );
};

export const FlowBuilderDocumentModal: React.FC<FlowBuilderDocumentModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode,
}) => {
  const [formData, setFormData] = useState<DocumentData>(defaultData);

  const initialDataRef = useRef<string | null>(null);

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
      });
    } else {
      setFormData(defaultData);
    }
  }, [open, data]);

  const handleSave = () => {
    if (!formData.documentUrl || !formData.filename) {
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate(formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {mode === 'edit' ? 'Editar Documento' : 'Enviar Documento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document URL */}
          <div className="space-y-2">
            <Label>URL do Documento *</Label>
            <VariableInput
              value={formData.documentUrl}
              onChange={(value) => setFormData(prev => ({ ...prev, documentUrl: value }))}
              placeholder="https://exemplo.com/arquivo.pdf ou {{variavel}}"
            />
            <p className="text-xs text-muted-foreground">
              URL pública do documento. Use <code className="bg-muted px-1 rounded">{`{{variavel}}`}</code> para inserir variáveis
            </p>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label>Nome do Arquivo *</Label>
            <VariableInput
              value={formData.filename}
              onChange={(value) => setFormData(prev => ({ ...prev, filename: value }))}
              placeholder="documento.pdf ou {{nome_arquivo}}"
            />
            <p className="text-xs text-muted-foreground">
              Nome que será exibido para o usuário (inclua a extensão)
            </p>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label>Legenda (opcional)</Label>
            <VariableInput
              value={formData.caption || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, caption: value }))}
              placeholder="Descrição do documento..."
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece junto com o documento
            </p>
          </div>

          {/* Send All Files */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Enviar todos os arquivos</Label>
              <p className="text-xs text-muted-foreground">
                Quando a variável contém múltiplos arquivos (ex: boletos), envia todos em sequência
              </p>
            </div>
            <Switch
              checked={formData.sendAllFiles || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendAllFiles: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.documentUrl || !formData.filename}
          >
            {mode === 'edit' ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
