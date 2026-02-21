import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, AlertCircle, ChevronUp, ChevronDown, TableIcon, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { backendService } from '@/services/api/backendService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isAfter, parseISO } from 'date-fns';
import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { Badge } from '@/components/ui/badge';

export interface TabelaPreco {
  idTabela: number;
  descricao: string;
  validade: string;
  somaIcm: 'S' | 'N';
}

interface SelectTabelaPrecoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tabela: TabelaPreco) => void;
  title?: string;
}

type SortField = 'idTabela' | 'descricao' | 'validade';
type SortDirection = 'asc' | 'desc';

const formatDate = (dateString: string) => formatDateOnly(dateString);

const isExpired = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return !isAfter(date, new Date());
  } catch {
    return false;
  }
};

export const SelectTabelaPrecoModal = ({ 
  open, 
  onOpenChange, 
  onSelect, 
  title = "Selecionar Tabela de Preço" 
}: SelectTabelaPrecoModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('descricao');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await backendService.buscarTabelas({ nome: searchTerm.trim() || undefined });

      if (response.success && response.data !== undefined) {
        let dados: TabelaPreco[] = [];

        // Normalizar resposta
        if (Array.isArray(response.data)) {
          dados = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          dados = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          dados = [response.data as TabelaPreco];
        }

        setTabelas(dados);
        setHasSearched(true);

        if (dados.length === 0) {
          toast.info('Nenhuma tabela encontrada');
        } else {
          toast.success(`${dados.length} tabela(s) encontrada(s)`);
        }
      } else {
        setError(response.error || 'Erro ao buscar tabelas');
        toast.error('Erro ao buscar tabelas');
      }
    } catch (err) {
      console.error('Erro ao buscar tabelas:', err);
      setError('Erro ao buscar tabelas');
      toast.error('Erro ao buscar tabelas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectTabela = (tabela: TabelaPreco) => {
    onSelect(tabela);
    onOpenChange(false);
    setSearchTerm('');
    setTabelas([]);
    setHasSearched(false);
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchTerm('');
    setTabelas([]);
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

  const getSortedTabelas = () => {
    return [...tabelas].sort((a, b) => {
      if (sortField === 'idTabela') {
        const aVal = a.idTabela || 0;
        const bVal = b.idTabela || 0;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (sortField === 'validade') {
        const aDate = new Date(a.validade).getTime();
        const bDate = new Date(b.validade).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const aValue = String((a as any)[sortField] ?? '').toLowerCase();
      const bValue = String((b as any)[sortField] ?? '').toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const sortedTabelas = getSortedTabelas();

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
              <TableIcon className="h-5 w-5" />
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
                placeholder="Buscar por nome da tabela... (deixe vazio para listar todas)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (error) setError('');
                }}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
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
            {sortedTabelas.length > 0 && (
              <div className="border rounded-lg h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors w-20",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('idTabela')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Código</span>
                            {renderSortIcon('idTabela')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('descricao')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Descrição</span>
                            {renderSortIcon('descricao')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors w-28 hidden sm:table-cell",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('validade')}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Validade</span>
                            {renderSortIcon('validade')}
                          </div>
                        </TableHead>
                        <TableHead className="w-16 text-xs sm:text-sm hidden sm:table-cell text-center">
                          ICMS
                        </TableHead>
                        <TableHead className="w-24 text-xs sm:text-sm">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTabelas.map((tabela, index) => {
                        const expired = isExpired(tabela.validade);
                        return (
                          <TableRow 
                            key={`${tabela.idTabela}-${index}`} 
                            className={cn(
                              "hover:bg-muted/50",
                              expired && "bg-red-50/50"
                            )}
                          >
                            <TableCell className="font-mono text-xs sm:text-sm p-2 sm:p-4 w-20">
                              {tabela.idTabela}
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">
                              <div className="flex flex-col gap-1">
                                <span className={cn(expired && "text-muted-foreground")}>
                                  {tabela.descricao}
                                </span>
                                {/* Mobile: show validade and ICMS inline */}
                                <div className="flex items-center gap-2 sm:hidden">
                                  <span className={cn(
                                    "text-[10px]",
                                    expired ? "text-destructive" : "text-muted-foreground"
                                  )}>
                                    {formatDate(tabela.validade)}
                                    {expired && " (Expirada)"}
                                  </span>
                                  <Badge variant={tabela.somaIcm === 'S' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                    {tabela.somaIcm === 'S' ? 'c/ ICMS' : 's/ ICMS'}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 w-28 hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <span className={cn(
                                  "text-xs",
                                  expired ? "text-destructive font-medium" : "text-muted-foreground"
                                )}>
                                  {formatDate(tabela.validade)}
                                </span>
                                {expired && (
                                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                    Expirada
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 w-16 hidden sm:table-cell text-center">
                              {tabela.somaIcm === 'S' ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="p-2 sm:p-4 w-24">
                              <Button
                                size="sm"
                                onClick={() => handleSelectTabela(tabela)}
                                className="text-xs px-2 py-1 sm:px-3 sm:py-2 w-full"
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {hasSearched && sortedTabelas.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <TableIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nenhuma tabela encontrada.</p>
                <p className="text-xs sm:text-sm mt-1">Tente ajustar os termos da pesquisa ou clique em Buscar sem filtro.</p>
              </div>
            )}

            {!hasSearched && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <TableIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Busque tabelas de preço</p>
                <p className="text-xs sm:text-sm mt-1">Digite um nome para filtrar ou clique em Buscar para listar todas.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
