import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2, FileCode } from 'lucide-react';
import { toast } from '@/lib/toast';
import { downloadXml } from '@/lib/download-utils';

const ConsultarNFeContent = () => {
  const [idConhecimento, setIdConhecimento] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBaixarXml = async () => {
    if (!idConhecimento.trim()) {
      toast.error('Por favor, digite o ID do conhecimento');
      return;
    }

    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    const xmlUrl = `${baseUrl}/functions/v1/xml-cte/${idConhecimento}`;
    
    await downloadXml({
      url: xmlUrl,
      fileName: `CTE_${idConhecimento}.xml`,
      onStart: () => setIsLoading(true),
      onEnd: () => setIsLoading(false),
    });
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setIdConhecimento(value);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FileCode className="w-5 h-5 text-blue-600" />
            </div>
            Baixar XML do CT-e
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md">
            <Label htmlFor="id-conhecimento" className="text-sm font-medium">
              ID do Conhecimento
            </Label>
            <div className="mt-2">
              <Input
                id="id-conhecimento"
                type="text"
                value={idConhecimento}
                onChange={handleIdChange}
                placeholder="Ex: 72052"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <Button 
              onClick={handleBaixarXml}
              disabled={isLoading || !idConhecimento.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isLoading ? 'Baixando...' : 'Baixar XML'}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Digite o ID do conhecimento (CT-e)</li>
              <li>• Clique em "Baixar XML" para fazer o download</li>
              <li>• O arquivo será salvo no formato XML</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultarNFeContent;
