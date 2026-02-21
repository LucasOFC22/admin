import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, RefreshCw, Search, Filter, AlertCircle, AlertTriangle, Info, CheckCircle, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogsPagination } from './LogsPagination';

// ==================== LogsTable ====================
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
  // Pagination props
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
              <TableRow><TableCell colSpan={columns.length + (onRowClick ? 1 : 0)} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" /><span className="text-muted-foreground">Carregando...</span></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + (onRowClick ? 1 : 0)} className="text-center py-8 text-muted-foreground">{emptyMessage}</TableCell></TableRow>
            ) : (
              data.map((row) => {
                const rowId = String(row.id);
                const isExpanded = expandedRow === rowId;
                return (
                  <React.Fragment key={rowId}>
                    <TableRow className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined} onClick={() => onRowClick?.(rowId)}>
                      {columns.map((col) => (<TableCell key={col.key} className="text-sm">{formatValue(row[col.key], col, row)}</TableCell>))}
                      {onRowClick && (<TableCell>{isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</TableCell>)}
                    </TableRow>
                    {isExpanded && row.detalhes && (<TableRow><TableCell colSpan={columns.length + 1} className="bg-muted/30"><pre className="text-xs overflow-auto max-h-40 p-2 rounded bg-muted">{typeof row.detalhes === 'string' ? row.detalhes : JSON.stringify(row.detalhes, null, 2)}</pre></TableCell></TableRow>)}
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

// ==================== LogsFilters ====================
export interface FilterOption { value: string; label: string; }
export interface LogsFiltersConfig { showUsuario?: boolean; showNivel?: boolean; showTipo?: boolean; showModulo?: boolean; showSearch?: boolean; }

interface LogsFiltersProps {
  usuarios?: FilterOption[]; selectedUsuario?: string; onUsuarioChange?: (value: string) => void;
  selectedNivel?: string; onNivelChange?: (value: string) => void;
  selectedTipo?: string; onTipoChange?: (value: string) => void; tipoOptions?: FilterOption[];
  selectedModulo?: string; onModuloChange?: (value: string) => void; moduloOptions?: FilterOption[];
  searchValue?: string; onSearchChange?: (value: string) => void; searchPlaceholder?: string;
  startDate: string; onStartDateChange: (value: string) => void;
  endDate: string; onEndDateChange: (value: string) => void;
  onSearch: () => void; onClear: () => void; config?: LogsFiltersConfig;
}

const NIVEIS = [{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Aviso' }, { value: 'error', label: 'Erro' }, { value: 'critical', label: 'Crítico' }];

export const LogsFilters: React.FC<LogsFiltersProps> = ({ usuarios = [], selectedUsuario = '', onUsuarioChange, selectedNivel = '', onNivelChange, selectedTipo = '', onTipoChange, tipoOptions = [], selectedModulo = '', onModuloChange, moduloOptions = [], searchValue = '', onSearchChange, searchPlaceholder = 'Buscar...', startDate, onStartDateChange, endDate, onEndDateChange, onSearch, onClear, config = { showUsuario: true, showNivel: false, showSearch: true } }) => {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" />Filtros</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {config.showUsuario && onUsuarioChange && (<div className="space-y-1.5"><Label className="text-xs">Usuário</Label><Select value={selectedUsuario || "all"} onValueChange={(v) => onUsuarioChange(v === "all" ? "" : v)}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{usuarios.map(u => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent></Select></div>)}
          {config.showNivel && onNivelChange && (<div className="space-y-1.5"><Label className="text-xs">Nível</Label><Select value={selectedNivel || "all"} onValueChange={(v) => onNivelChange(v === "all" ? "" : v)}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{NIVEIS.map(n => (<SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>))}</SelectContent></Select></div>)}
          {config.showTipo && onTipoChange && tipoOptions.length > 0 && (<div className="space-y-1.5"><Label className="text-xs">Tipo</Label><Select value={selectedTipo || "all"} onValueChange={(v) => onTipoChange(v === "all" ? "" : v)}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{tipoOptions.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select></div>)}
          {config.showSearch && onSearchChange && (<div className="space-y-1.5"><Label className="text-xs">Buscar</Label><Input className="h-9" placeholder={searchPlaceholder} value={searchValue} onChange={(e) => onSearchChange(e.target.value)} /></div>)}
          <div className="space-y-1.5"><Label className="text-xs">Data Início</Label><Input className="h-9" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Data Fim</Label><Input className="h-9" type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} /></div>
        </div>
        <div className="flex gap-2 mt-4"><Button onClick={onSearch} size="sm"><Search className="h-4 w-4 mr-2" />Buscar</Button><Button variant="outline" size="sm" onClick={onClear}>Limpar</Button></div>
      </CardContent>
    </Card>
  );
};

// ==================== LogsHeader ====================
interface LogsHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  data?: unknown[];
  filename?: string;
}

export const LogsHeader: React.FC<LogsHeaderProps> = ({
  title,
  description,
  icon,
  onRefresh,
  isRefreshing = false,
  data,
  filename = 'logs',
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {data && data.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        )}
      </div>
    </div>
  );
};

// ==================== LogsStats ====================
export interface LogsStatsData { total: number; info?: number; warning?: number; error?: number; critical?: number; success?: number; }

export const LogsStats: React.FC<{ stats: LogsStatsData; showLevels?: boolean }> = ({ stats, showLevels = true }) => {
  const statCards = [
    { label: 'Total', value: stats.total, icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10', show: true },
    { label: 'Info', value: stats.info || 0, icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10', show: showLevels && stats.info !== undefined },
    { label: 'Avisos', value: stats.warning || 0, icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', show: showLevels && stats.warning !== undefined },
    { label: 'Erros', value: stats.error || 0, icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', show: showLevels && stats.error !== undefined },
    { label: 'Sucesso', value: stats.success || 0, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', show: stats.success !== undefined }
  ].filter(s => s.show);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => { const Icon = stat.icon; return (<Card key={stat.label}><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${stat.bgColor}`}><Icon className={`h-4 w-4 ${stat.color}`} /></div><div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></div></CardContent></Card>); })}
    </div>
  );
};
