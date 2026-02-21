import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { backendService } from '@/services/api/backendService';

interface Cidade {
  idCidade: number;
  cidade: string;
  uf: string;
  ibge?: string;
}

interface SelectCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cidade: Cidade) => void;
  title?: string;
}

type SortField = 'cidade' | 'uf';
type SortDirection = 'asc' | 'desc';

const UF_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const SelectCityModal = ({ 
  open, 
  onOpenChange, 
  onSelect, 
  title = "Selecionar Cidade" 
}: SelectCityModalProps) => {
  const [selectedUF, setSelectedUF] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('cidade');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSearch = async () => {
    if (!selectedUF && !searchTerm.trim()) {
      setError('Selecione uma UF ou digite o nome da cidade');
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await backendService.buscarCidades({
        nome: searchTerm.trim() || '',
        uf: selectedUF === 'all' ? '' : (selectedUF || '')
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar cidades');
      }

      let dados: Cidade[] = [];
      const raw = response.data;

      // Novo formato: raw é Array com objeto { success, data }
      if (Array.isArray(raw) && raw.length > 0 && raw[0]?.data) {
        dados = Array.isArray(raw[0].data) ? raw[0].data : [raw[0].data];
      } else if (Array.isArray(raw) && raw.length > 0 && raw[0]?.json?.data) {
        dados = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
      } else if (Array.isArray(raw) && raw.length > 0 && raw[0]?.idCidade) {
        dados = raw;
      } else if (raw?.data) {
        dados = Array.isArray(raw.data) ? raw.data : [raw.data];
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
    setSelectedUF('');
    setCidades([]);
    setHasSearched(false);
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setSelectedUF('');
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Campos de busca */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Select value={selectedUF} onValueChange={setSelectedUF}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {UF_BRASIL.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Input
                  placeholder="Nome da cidade..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={handleSearch}
                  type="button"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={handleSearch} disabled={isLoading}>
                Buscar
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
                          onClick={() => handleSort('cidade')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Cidade</span>
                            {renderSortIcon('cidade')}
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
                        <TableHead className="text-xs sm:text-sm w-32">
                          Código IBGE
                        </TableHead>
                        <TableHead className="w-24 text-xs sm:text-sm sticky right-0 bg-background">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCidades.map((cidade, index) => (
                        <TableRow key={`${cidade.idCidade}-${index}`} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">
                            {cidade.cidade}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                            {cidade.uf}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                            {cidade.ibge || '-'}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4 w-24 sticky right-0 bg-background">
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
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhuma cidade encontrada.</p>
                <p className="text-sm mt-1">Tente ajustar os filtros de pesquisa.</p>
              </div>
            )}

            {!hasSearched && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p>Selecione uma UF ou digite o nome da cidade para começar a pesquisa.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
