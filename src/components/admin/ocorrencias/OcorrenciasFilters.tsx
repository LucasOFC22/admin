import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { TIPO_OCORRENCIA_LABELS, STATUS_OCORRENCIA_LABELS } from '@/types/ocorrencias';

interface OcorrenciasFiltersProps {
  filters: {
    search: string;
    tipo: string;
    status: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const OcorrenciasFilters = ({ filters, onFilterChange, onRefresh, isLoading }: OcorrenciasFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por CT-e, email ou CPF/CNPJ..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={filters.tipo} onValueChange={(value) => onFilterChange('tipo', value)}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Tipo de Ocorrência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          {Object.entries(TIPO_OCORRENCIA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          {Object.entries(STATUS_OCORRENCIA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default OcorrenciasFilters;
