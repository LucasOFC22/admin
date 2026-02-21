import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSearch, Loader2, List, Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/lib/toast';
import { NFeTable } from './NFeTable';
import { NFeCard } from './NFeCard';
import { n8nApi } from '@/services/n8n/apiService';

interface NFeResult {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento?: string;
  valorPago?: number;
  juros?: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  boleto: string;
  idBoleto: number;
  status: string;
  idTitulo: number;
}

const ConsultarNFeContentModern = () => {
  const [chaveNFe, setChaveNFe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NFeResult[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleConsultarNFe = async () => {
    if (!chaveNFe.trim()) {
      toast.error('Por favor, digite a chave de acesso da NF-e');
      return;
    }

    const chaveNumeros = chaveNFe.replace(/\D/g, '');
    if (chaveNumeros.length !== 44) {
      toast.error('A chave de acesso deve ter exatamente 44 dígitos');
      return;
    }

    setIsLoading(true);
    setCurrentPage(1);

    try {
      toast.info('Consultando NF-e, aguarde...', { duration: 5000 });
      
      const response = await n8nApi.consultarNFe(chaveNumeros);
      
      if (response.success && response.data) {
        // Ensure data is an array
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        setResults(dataArray);
        toast.success(`${dataArray.length} registro(s) encontrado(s)!`);
        setChaveNFe('');
      } else {
        toast.error('Nenhum resultado encontrado');
        setResults([]);
      }

    } catch (error: any) {
      console.error('Erro ao consultar NF-e:', error);
      
      if (error.message.includes('Timeout')) {
        toast.error('A consulta demorou muito. Tente novamente.');
      } else if (error.message.includes('N8N não configurado')) {
        toast.error('Sistema não configurado. Contate o administrador.');
      } else {
        toast.error('Erro ao consultar NF-e. Tente novamente.');
      }
      
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 44);
    setChaveNFe(value);
  };

  const formatChave = (chave: string) => {
    return chave.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const getProgressColor = () => {
    const length = chaveNFe.length;
    if (length === 0) return 'bg-gray-200';
    if (length < 22) return 'bg-red-200';
    if (length < 44) return 'bg-yellow-200';
    return 'bg-green-200';
  };

  const getProgressWidth = () => {
    return `${(chaveNFe.length / 44) * 100}%`;
  };

  // Paginação
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex-1 p-4 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Card Principal */}
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="chave-nfe" className="text-sm font-medium mb-2 block">
                Chave de Acesso (44 dígitos)
              </Label>
              <Input
                id="chave-nfe"
                type="text"
                value={formatChave(chaveNFe)}
                onChange={handleChaveChange}
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                className="font-mono text-center"
                maxLength={54}
              />
              
              {/* Barra de Progresso */}
              <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                <span>{chaveNFe.length}/44 dígitos</span>
              </div>
            </div>

            <Button 
              onClick={handleConsultarNFe}
              disabled={isLoading || chaveNFe.length !== 44}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Consultando...
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4 mr-2" />
                  Consultar NF-e
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Resultados da Consulta</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {results.length} registro(s) encontrado(s)
                </p>
              </div>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('card')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <NFeTable results={paginatedResults} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResults.map((result) => (
                  <NFeCard key={result.idTitulo} result={result} />
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • Exibindo {startIndex + 1}-{Math.min(endIndex, results.length)} de {results.length}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultarNFeContentModern;
