import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportFlowButtonProps {
  onImport: (flowData: any) => Promise<void>;
}

export const ImportFlowButton: React.FC<ImportFlowButtonProps> = ({ onImport }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const flowData = JSON.parse(text);

      // Validação básica
      if (!flowData.name || !flowData.flow_data) {
        throw new Error('Arquivo de fluxo inválido');
      }

      await onImport(flowData);
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erro ao importar fluxo:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível importar o fluxo",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Importar
      </Button>
    </>
  );
};
