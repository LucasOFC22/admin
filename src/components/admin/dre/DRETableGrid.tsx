import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { formatDate as formatDateOnly } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';

export interface DRELancamento {
  id: string;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
  conta: string;
  nome: string;
  cpfCnpj: string;
  documento: string;
  banco: string;
  valor: number;
  classe: string;
}

interface DRETableGridProps {
  lancamentos: DRELancamento[];
  onFix?: (id: string) => void;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (value: number) => void;
}

export const DRETableGrid: React.FC<DRETableGridProps> = ({
  lancamentos,
  onFix,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 20,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange
}) => {
  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateStr: string) => formatDateOnly(dateStr);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              Lançamentos Detalhados
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalItems > 0 ? `${startItem}-${endItem} de ${totalItems} registros` : '0 registros'}
            </p>
          </div>
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Por página:</span>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(v) => onItemsPerPageChange(Number(v))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {/* Mobile View */}
        <div className="sm:hidden space-y-2 p-4">
          {lancamentos.map((lancamento, index) => (
            <Card key={`${lancamento.id}-${index}`} className="p-3">
              <div className="flex justify-between items-start mb-2">
                <Badge 
                  variant="outline"
                  className={lancamento.tipo === 'RECEITA' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }
                >
                  {lancamento.tipo}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(lancamento.data)}
                </span>
              </div>
              <p className="font-medium text-sm truncate">{lancamento.nome}</p>
              <p className="text-xs text-muted-foreground">{lancamento.cpfCnpj}</p>
              <div className="flex justify-between items-center mt-2">
                <span className={`font-bold ${lancamento.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(lancamento.valor)}
                </span>
                {onFix && (
                  <Button size="sm" variant="ghost" onClick={() => onFix(lancamento.id)}>
                    <Wrench className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Doc</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((lancamento, index) => (
                <TableRow key={`${lancamento.id}-${index}`}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(lancamento.data)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={lancamento.tipo === 'RECEITA' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }
                    >
                      {lancamento.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {lancamento.conta}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {lancamento.nome}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {lancamento.cpfCnpj}
                  </TableCell>
                  <TableCell>{lancamento.documento}</TableCell>
                  <TableCell>{lancamento.banco}</TableCell>
                  <TableCell className={`text-right font-medium ${lancamento.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(lancamento.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lancamento.classe}</Badge>
                  </TableCell>
                  <TableCell>
                    {onFix && (
                      <Button size="sm" variant="ghost" onClick={() => onFix(lancamento.id)}>
                        <Wrench className="h-4 w-4" />
                        <span className="ml-1">Fix</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-1 mx-auto sm:mx-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
