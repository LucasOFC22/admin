import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Ocorrencia, CAMPOS_OBRIGATORIOS, LABELS_CAMPOS, TipoOcorrencia } from '@/types/ocorrencias';
import { Save, Loader2 } from 'lucide-react';

interface OcorrenciaEditFormProps {
  ocorrencia: Ocorrencia;
  onSave: (data: Partial<Ocorrencia>) => void;
  isUpdating: boolean;
}

const OcorrenciaEditForm = ({ ocorrencia, onSave, isUpdating }: OcorrenciaEditFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Inicializa o formulário com os dados atuais
    const camposPermitidos = CAMPOS_OBRIGATORIOS[ocorrencia.tipo_ocorrencia as TipoOcorrencia];
    const initialData: Record<string, any> = {};
    
    camposPermitidos.forEach(campo => {
      // Se for nome_recebedor e estiver vazio, usar responsavel
      if (campo === 'nome_recebedor' && !ocorrencia.nome_recebedor && ocorrencia.responsavel) {
        initialData[campo] = ocorrencia.responsavel;
      } else {
        initialData[campo] = ocorrencia[campo as keyof Ocorrencia];
      }
    });
    
    setFormData(initialData);
  }, [ocorrencia]);

  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const camposPermitidos = CAMPOS_OBRIGATORIOS[ocorrencia.tipo_ocorrencia as TipoOcorrencia];

  const renderCampo = (campo: string) => {
    const label = LABELS_CAMPOS[campo] || campo;
    const valor = formData[campo] || '';

    // Campos especiais
    if (campo === 'fotos') {
      return (
        <div key={campo} className="space-y-2">
          <Label>{label}</Label>
          <div className="text-sm text-muted-foreground">
            {Array.isArray(ocorrencia.fotos) && ocorrencia.fotos.length > 0 
              ? `${ocorrencia.fotos.length} foto(s) anexada(s)` 
              : 'Nenhuma foto'}
          </div>
        </div>
      );
    }

    if (campo === 'descricao' || campo === 'resumo' || campo === 'dano_descricao' || campo === 'problema_documento') {
      return (
        <div key={campo} className="space-y-2">
          <Label htmlFor={campo}>{label}</Label>
          <Textarea
            id={campo}
            value={String(valor)}
            onChange={(e) => handleChange(campo, e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      );
    }

    return (
      <div key={campo} className="space-y-2">
        <Label htmlFor={campo}>{label}</Label>
        <Input
          id={campo}
          value={String(valor)}
          onChange={(e) => handleChange(campo, e.target.value)}
          type="text"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camposPermitidos.map(campo => renderCampo(campo))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default OcorrenciaEditForm;
