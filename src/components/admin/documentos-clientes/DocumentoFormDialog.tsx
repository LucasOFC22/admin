import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, X, Eye } from 'lucide-react';
import { useDocumentosRepositorio } from '@/hooks/useDocumentosRepositorio';
import { documentoStorageService } from '@/services/documentoStorageService';

interface DocumentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento?: any;
}

const DocumentoFormDialog = ({ open, onOpenChange, documento }: DocumentoFormDialogProps) => {
  const isEditing = !!documento;
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [customFileName, setCustomFileName] = useState('');

  const { createDocumento, updateDocumento, isCreating, isUpdating } = useDocumentosRepositorio();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      titulo: '',
      descricao: '',
      instrucoes: '',
      ativo: true
    }
  });

  // Sincroniza o formulário quando abre o modal com dados do documento
  useEffect(() => {
    if (open && documento) {
      reset({
        titulo: documento.titulo || '',
        descricao: documento.descricao || '',
        instrucoes: documento.instrucoes || '',
        ativo: documento.ativo ?? true
      });
    } else if (open && !documento) {
      reset({
        titulo: '',
        descricao: '',
        instrucoes: '',
        ativo: true
      });
    }
  }, [open, documento, reset]);

  const handleViewFile = async () => {
    if (documento?.storage_path) {
      const result = await documentoStorageService.getSignedUrl(documento.storage_path);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      // Define o nome do arquivo como padrão se não tiver nome customizado
      if (!customFileName) {
        setCustomFileName(selectedFile.name);
      }
    }
  }, [customFileName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Define o nome do arquivo como padrão se não tiver nome customizado
      if (!customFileName) {
        setCustomFileName(selectedFile.name);
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateDocumento({
          id: documento.id,
          data: {
            titulo: data.titulo,
            descricao: data.descricao,
            instrucoes: data.instrucoes,
            ativo: data.ativo
          }
        });
      } else {
        if (!file) {
          return;
        }
        
        // Usa o nome customizado ou o nome original do arquivo
        const fileName = customFileName || file.name;
        
        await createDocumento({
          data: {
            titulo: data.titulo,
            descricao: data.descricao,
            instrucoes: data.instrucoes,
            nome_arquivo: fileName,
            storage_path: '', // Será preenchido após upload
            mime_type: documentoStorageService.getMimeType(file.name),
            tamanho_bytes: file.size,
            ativo: data.ativo
          },
          file
        });
      }
      reset();
      setFile(null);
      setCustomFileName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
    }
  };

  const handleClose = () => {
    reset();
    setFile(null);
    setCustomFileName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Documento' : 'Novo Documento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Arquivo atual - só exibe na edição */}
          {isEditing && documento?.nome_arquivo && (
            <div>
              <Label>Arquivo Atual</Label>
              <div className="mt-2 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{documento.nome_arquivo}</p>
                    <p className="text-sm text-muted-foreground">
                      {documento.tamanho_bytes 
                        ? documentoStorageService.formatFileSize(documento.tamanho_bytes) 
                        : 'Tamanho desconhecido'}
                      {documento.mime_type && ` • ${documento.mime_type}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleViewFile}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O arquivo não pode ser alterado. Para trocar, exclua e crie um novo documento.
              </p>
            </div>
          )}

          {/* Upload de arquivo - só exibe na criação */}
          {!isEditing && (
            <div>
              <Label>Arquivo *</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {documentoStorageService.formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setCustomFileName('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Nome do arquivo (personalizável) */}
          {!isEditing && file && (
            <div>
              <Label htmlFor="nome_arquivo">Nome do arquivo salvo</Label>
              <Input
                id="nome_arquivo"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Nome que será exibido para os clientes"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este é o nome que será exibido para download
              </p>
            </div>
          )}

          {/* Título */}
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo', { required: true })}
              placeholder="Ex: Contrato de Transporte"
              className="mt-1"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição do documento..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Instruções */}
          <div>
            <Label htmlFor="instrucoes">Instruções para o cliente</Label>
            <Textarea
              id="instrucoes"
              {...register('instrucoes')}
              placeholder="Instruções de como utilizar o documento..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Switch Ativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Ativo (disponível para clientes)</Label>
            <Switch
              id="ativo"
              checked={watch('ativo')}
              onCheckedChange={(v) => setValue('ativo', v)}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isCreating || isUpdating || (!isEditing && !file)}
            >
              {isCreating || isUpdating ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Documento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentoFormDialog;
