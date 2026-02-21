import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, AlertCircle, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { n8nApi } from '@/services/n8n/apiService';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Cidade {
  idCidade?: number;
  id?: number;
  nome: string;
  uf: string;
  estado?: string;
}

interface SelectCidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cidade: Cidade) => void;
  title?: string;
}

type SortField = 'nome' | 'uf';
type SortDirection = 'asc' | 'desc';

export const SelectCidadeModal = ({ open, onOpenChange, onSelect, title = "Selecionar Cidade" }: SelectCidadeModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um nome de cidade para buscar');
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await n8nApi.makeN8nRequest({
        eventType: 'buscar-cidade',
        acao: 'buscar',
        termo: searchTerm
      });

      if (response.success && (response as any).data !== undefined) {
        const raw = (response as any).data as any;
        let dados: Cidade[] = [];

        if (Array.isArray(raw)) {
          if (raw.length > 0 && raw[0]?.json?.data) {
            dados = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
          }
          else if (raw.length > 0 && Array.isArray(raw[0])) {
            dados = raw[0];
          }
          else if (raw.length > 0 && (raw[0]?.idCidade || raw[0]?.nome)) {
            dados = raw;
          }
          else {
            dados = [];
          }
        } else if (raw?.json?.data) {
          dados = Array.isArray(raw.json.data) ? raw.json.data : [raw.json.data];
        } else if (raw && typeof raw === 'object') {
          dados = [raw as Cidade];
        } else {
          dados = [];
        }

        setCidades(dados);
        setHasSearched(true);

        if (dados.length === 0) {
          toast.info('Nenhuma cidade encontrada');
        } else {
          toast.success(`${dados.length} cidade(s) encontrada(s)`);
        }
      } else {
        setError(response.error || 'Erro ao buscar cidades');
        toast.error('Erro ao buscar cidades');
      }
    } catch (err) {
      console.error('Erro ao buscar cidades:', err);
      setError('Erro ao buscar cidades');
      toast.error('Erro ao buscar cidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCidade = (cidade: Cidade) => {
    onSelect(cidade);
    onOpenChange(false);
    setSearchTerm('');
    setCidades([]);
    setHasSearched(false);
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setCidades([]);
    setHasSearched(false);
    setError('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedCidades = () => {
    return [...cidades].sort((a, b) => {
      const aValue = String((a as any)[sortField] ?? '').toLowerCase();
      const bValue = String((b as any)[sortField] ?? '').toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const sortedCidades = getSortedCidades();

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[95vh] sm:h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {title}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Campo de busca */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome da cidade..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (error) setError('');
                }}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()}>
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="flex-1 min-h-0">
            {sortedCidades.length > 0 && (
              <div className="border rounded-lg h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('nome')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Cidade</span>
                            {renderSortIcon('nome')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors w-20",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('uf')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>UF</span>
                            {renderSortIcon('uf')}
                          </div>
                        </TableHead>
                        <TableHead className="w-24 text-xs sm:text-sm">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCidades.map((cidade, index) => (
                        <TableRow key={`${cidade.idCidade || cidade.id}-${index}`} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">
                            {cidade.nome}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4 w-20">
                            {cidade.uf || cidade.estado}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4 w-24">
                            <Button
                              size="sm"
                              onClick={() => handleSelectCidade(cidade)}
                              className="text-xs px-2 py-1 sm:px-3 sm:py-2 w-full"
                            >
                              Selecionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {hasSearched && sortedCidades.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <MapPin className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nenhuma cidade encontrada.</p>
                <p className="text-xs sm:text-sm mt-1">Tente ajustar os termos da pesquisa.</p>
              </div>
            )}

            {!hasSearched && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <MapPin className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Digite o nome de uma cidade para buscar.</p>
                <p className="text-xs sm:text-sm mt-1">Use o campo de pesquisa acima para começar.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
