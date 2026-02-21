import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LogsPagination } from './LogsPagination';

export interface LogColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface LogsTableProps {
  data: Record<string, unknown>[];
  columns: LogColumn[];
  loading?: boolean;
  expandedRow?: string | null;
  onRowClick?: (id: string) => void;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({
  data,
  columns,
  loading = false,
  expandedRow,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const formatValue = (value: unknown, column: LogColumn, row: Record<string, unknown>): React.ReactNode => {
    if (column.render) return column.render(value, row);
    if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
    if (column.key === 'created_at' || column.key === 'timestamp' || column.key === 'data_ocorrencia') {
      try { return format(new Date(value as string), 'dd/MM/yy HH:mm', { locale: ptBR }); } catch { return String(value); }
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const showPagination = currentPage !== undefined && 
    totalPages !== undefined && 
    pageSize !== undefined && 
    totalItems !== undefined && 
    onPageChange !== undefined && 
    onPageSizeChange !== undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (<TableHead key={col.key}>{col.label}</TableHead>))}
              {onRowClick && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onRowClick ? 1 : 0)} className="text-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Carregando...</span>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onRowClick ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowId = String(row.id);
                const isExpanded = expandedRow === rowId;
                return (
                  <React.Fragment key={rowId}>
                    <TableRow 
                      className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined} 
                      onClick={() => onRowClick?.(rowId)}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className="text-sm">
                          {formatValue(row[col.key], col, row)}
                        </TableCell>
                      ))}
                      {onRowClick && (
                        <TableCell>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && row.detalhes && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="bg-muted/30">
                          <pre className="text-xs overflow-auto max-h-40 p-2 rounded bg-muted">
                            {typeof row.detalhes === 'string' ? row.detalhes : JSON.stringify(row.detalhes, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <LogsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default LogsTable;
