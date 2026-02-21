import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, LayoutGrid, List } from 'lucide-react';

interface SolicitacoesFiltersProps {
  search: string;
  statusFilter: string;
  tipoFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTipoChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export const SolicitacoesFilters = ({
  search,
  statusFilter,
  tipoFilter,
  onSearchChange,
  onStatusChange,
  onTipoChange,
  onRefresh,
  isLoading,
  viewMode,
  onViewModeChange,
}: SolicitacoesFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email, CT-e, NF-e ou CPF/CNPJ..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full lg:w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="em_processamento">Em Processamento</SelectItem>
          <SelectItem value="finalizado">Finalizado</SelectItem>
          <SelectItem value="erro">Erro</SelectItem>
        </SelectContent>
      </Select>

      <Select value={tipoFilter} onValueChange={onTipoChange}>
        <SelectTrigger className="w-full lg:w-[200px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          <SelectItem value="comprovante_entrega">Comprovante Entrega</SelectItem>
          <SelectItem value="cte">CT-e</SelectItem>
          <SelectItem value="boleto">Boleto</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('table')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
