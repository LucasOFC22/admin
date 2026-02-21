import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { backendService } from '@/services/api/backendService';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface Cadastro {
  idCliente: number;
  nome: string;
  fantasia?: string;
  cpfcgc: string;
  cidade: string;
  uf: string;
  bairro: string;
  rginsc?: string;
  idCidade?: number;
}

interface SelectRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cadastro: Cadastro) => void;
  title?: string;
}

type SortField = 'nome' | 'cpfcgc' | 'cidade' | 'uf';
type SortDirection = 'asc' | 'desc';

export const SelectRegisterModal = ({ open, onOpenChange, onSelect, title = "Selecionar Cadastro" }: SelectRegisterModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um nome ou CNPJ/CPF para buscar');
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await backendService.buscarCadastro(searchTerm, 'cadastro');

      if (response.success && response.data !== undefined) {
        const raw = response.data as any;
        let dados: Cadastro[] = [];

        if (Array.isArray(raw)) {
          // Estrutura N8N: [{json: {data: [...]}}] ou [{json: {data: {...}}}]
          if (raw.length > 0 && raw[0]?.json?.data) {
            dados = Array.isArray(raw[0].json.data) ? raw[0].json.data : [raw[0].json.data];
          }
          // Array aninhado direto [[...]]
          else if (raw.length > 0 && Array.isArray(raw[0])) {
            dados = raw[0];
          }
          // Array direto de cadastros [{idCliente: ...}, ...]
          else if (raw.length > 0 && raw[0]?.idCliente) {
            dados = raw;
          }
          else {
            dados = [];
          }
        } else if (raw?.json?.data) {
          dados = Array.isArray(raw.json.data) ? raw.json.data : [raw.json.data];
        } else if (raw && typeof raw === 'object') {
          dados = [raw as Cadastro];
        } else {
          dados = [];
        }

        setCadastros(dados);
        setHasSearched(true);

        if (dados.length === 0) {
          toast.info('Nenhum cadastro encontrado');
        } else {
          toast.success(`${dados.length} cadastro(s) encontrado(s)`);
        }
      } else {
        setError(response.error || 'Erro ao buscar cadastros');
        toast.error('Erro ao buscar cadastros');
      }
    } catch (err) {
      console.error('Erro ao buscar cadastros:', err);
      setError('Erro ao buscar cadastros');
      toast.error('Erro ao buscar cadastros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCadastro = (cadastro: Cadastro) => {
    onSelect(cadastro);
    onOpenChange(false);
    // Limpar o estado após selecionar
    setSearchTerm('');
    setCadastros([]);
    setHasSearched(false);
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Limpar o estado ao fechar
    setSearchTerm('');
    setCadastros([]);
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

  const getSortedCadastros = () => {
    return [...cadastros].sort((a, b) => {
      const aValue = String((a as any)[sortField] ?? '').toLowerCase();
      const bValue = String((b as any)[sortField] ?? '').toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const sortedCadastros = getSortedCadastros();

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
      <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Campo de busca */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome ou CNPJ..."
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
            {sortedCadastros.length > 0 && (
              <div className="border rounded-lg h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[200px]",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('nome')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Nome</span>
                            {renderSortIcon('nome')}
                          </div>
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell min-w-[150px]">
                          Fantasia
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[130px]",
                            "text-xs sm:text-sm hidden sm:table-cell"
                          )}
                          onClick={() => handleSort('cpfcgc')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>CPF/CNPJ</span>
                            {renderSortIcon('cpfcgc')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors min-w-[120px]",
                            "text-xs sm:text-sm hidden md:table-cell"
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
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors w-16",
                            "text-xs sm:text-sm hidden md:table-cell"
                          )}
                          onClick={() => handleSort('uf')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>UF</span>
                            {renderSortIcon('uf')}
                          </div>
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm min-w-[120px]">
                          Bairro
                        </TableHead>
                        <TableHead className="w-20 sm:w-24 text-xs sm:text-sm sticky right-0 bg-background">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCadastros.map((cadastro, index) => (
                        <TableRow key={`${cadastro.idCliente}-${index}`} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4 min-w-[200px]">
                            <div className="min-w-0">
                              <div className="font-medium break-words">{cadastro.nome}</div>
                              <div className="text-xs text-muted-foreground sm:hidden break-all">
                                {cadastro.cpfcgc}
                              </div>
                              <div className="text-xs text-muted-foreground md:hidden">
                                {cadastro.cidade} - {cadastro.uf}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell p-2 sm:p-4 min-w-[150px]">
                            <div className="break-words">{cadastro.fantasia || '-'}</div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell p-2 sm:p-4 min-w-[130px]">
                            <div className="break-all">{cadastro.cpfcgc}</div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell p-2 sm:p-4 min-w-[120px]">
                            <div className="break-words">{cadastro.cidade}</div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell p-2 sm:p-4 w-16">
                            {cadastro.uf}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4 min-w-[120px]">
                            <div className="break-words">{cadastro.bairro}</div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-4 w-20 sm:w-24 sticky right-0 bg-background">
                            <Button
                              size="sm"
                              onClick={() => handleSelectCadastro(cadastro)}
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

            {hasSearched && sortedCadastros.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nenhum cadastro encontrado.</p>
                <p className="text-xs sm:text-sm mt-1">Tente ajustar os termos da pesquisa.</p>
              </div>
            )}

            {!hasSearched && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Digite um nome ou CNPJ/CPF para buscar cadastros.</p>
                <p className="text-xs sm:text-sm mt-1">Use o campo de pesquisa acima para começar.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
