import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedUserFilters } from '@/hooks/useUnifiedUsers';
import { Cargo } from '@/hooks/useUnifiedUsers';

interface UnifiedUsersFiltersProps {
  filters: UnifiedUserFilters;
  onFiltersChange: (filters: UnifiedUserFilters) => void;
  cargos: Cargo[];
  loading?: boolean;
}

const UnifiedUsersFilters = ({ filters, onFiltersChange, cargos, loading = false }: UnifiedUsersFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasAdvancedFilters = 
    filters.cargoFilter || 
    filters.emailVerifiedFilter !== 'all' || 
    filters.dateFrom || 
    filters.dateTo;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTypeFilterChange = (value: string) => {
    onFiltersChange({ ...filters, typeFilter: value as UnifiedUserFilters['typeFilter'] });
  };

  const handleStatusFilterChange = (value: string) => {
    onFiltersChange({ ...filters, statusFilter: value as UnifiedUserFilters['statusFilter'] });
  };

  const handleCargoFilterChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      cargoFilter: value === 'all' ? null : parseInt(value) 
    });
  };

  const handleEmailVerifiedFilterChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      emailVerifiedFilter: value as UnifiedUserFilters['emailVerifiedFilter'] 
    });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ ...filters, dateFrom: value });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ ...filters, dateTo: value });
  };

  const handleClearAdvancedFilters = () => {
    onFiltersChange({
      ...filters,
      cargoFilter: null,
      emailVerifiedFilter: 'all',
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={loading}
          className="pl-10"
        />
      </div>

      {/* Filtros de tipo e status */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filtro de tipo */}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de Usuário</p>
          <Tabs value={filters.typeFilter} onValueChange={handleTypeFilterChange}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="cliente">Clientes</TabsTrigger>
              <TabsTrigger value="admin">Administradores</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filtro de status */}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
          <Tabs value={filters.statusFilter} onValueChange={handleStatusFilterChange}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="ativo">Ativos</TabsTrigger>
              <TabsTrigger value="inativo">Inativos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Botão de Filtros Avançados */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="gap-2"
        >
          {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avançados
          {hasAdvancedFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {[
                filters.cargoFilter,
                filters.emailVerifiedFilter !== 'all',
                filters.dateFrom,
                filters.dateTo
              ].filter(Boolean).length}
            </span>
          )}
        </Button>

        {hasAdvancedFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAdvancedFilters}
            className="gap-2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
            Limpar Filtros Avançados
          </Button>
        )}
      </div>

      {/* Filtros Avançados */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
          {/* Filtro por Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo-filter" className="text-sm font-medium">
              Cargo
            </Label>
            <Select
              value={filters.cargoFilter?.toString() || 'all'}
              onValueChange={handleCargoFilterChange}
              disabled={loading}
            >
              <SelectTrigger id="cargo-filter">
                <SelectValue placeholder="Todos os cargos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {cargos.map(cargo => (
                  <SelectItem key={cargo.id} value={cargo.id.toString()}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Email Verificado */}
          <div className="space-y-2">
            <Label htmlFor="email-verified-filter" className="text-sm font-medium">
              Status do Email
            </Label>
            <Select
              value={filters.emailVerifiedFilter || 'all'}
              onValueChange={handleEmailVerifiedFilterChange}
              disabled={loading}
            >
              <SelectTrigger id="email-verified-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="verified">Email Verificado</SelectItem>
                <SelectItem value="pending">Email Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data - De */}
          <div className="space-y-2">
            <Label htmlFor="date-from" className="text-sm font-medium">
              Criado de
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Filtro por Data - Até */}
          <div className="space-y-2">
            <Label htmlFor="date-to" className="text-sm font-medium">
              Criado até
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedUsersFilters;
