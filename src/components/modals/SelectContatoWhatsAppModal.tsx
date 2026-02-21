import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
}

interface SelectContatoWhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (contato: ContatoWhatsApp) => void;
  contatos: ContatoWhatsApp[];
  title?: string;
}

type SortField = 'nome' | 'telefone';
type SortDirection = 'asc' | 'desc';

export const SelectContatoWhatsAppModal = ({ 
  open, 
  onOpenChange, 
  onSelect, 
  contatos,
  title = "Selecionar Contato" 
}: SelectContatoWhatsAppModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSelectContato = (contato: ContatoWhatsApp) => {
    onSelect(contato);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredContatos = contatos.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(term) ||
      c.telefone?.toLowerCase().includes(term)
    );
  });

  const sortedContatos = [...filteredContatos].sort((a, b) => {
    const aValue = String((a as any)[sortField] ?? '').toLowerCase();
    const bValue = String((b as any)[sortField] ?? '').toLowerCase();
    return sortDirection === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[95vh] sm:h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Campo de busca */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => setSearchTerm('')} disabled={!searchTerm}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Resultados */}
          <div className="flex-1 min-h-0">
            {sortedContatos.length > 0 ? (
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
                            <span>Nome</span>
                            {renderSortIcon('nome')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className={cn(
                            "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                            "text-xs sm:text-sm"
                          )}
                          onClick={() => handleSort('telefone')}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Telefone</span>
                            {renderSortIcon('telefone')}
                          </div>
                        </TableHead>
                        <TableHead className="w-24 text-xs sm:text-sm sticky right-0 bg-background">
                          Ação
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedContatos.map((contato) => (
                        <TableRow key={contato.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">
                            {contato.nome || '-'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                            {contato.telefone}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4 w-24 sticky right-0 bg-background">
                            <Button
                              size="sm"
                              onClick={() => handleSelectContato(contato)}
                              className="text-xs px-2 py-1 w-full"
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Nenhum contato encontrado.</p>
                <p className="text-xs sm:text-sm mt-1">Tente ajustar os termos da pesquisa.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
