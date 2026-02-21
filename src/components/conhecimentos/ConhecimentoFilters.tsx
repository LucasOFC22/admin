import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';

interface ConhecimentoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

const ConhecimentoFilters = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}: ConhecimentoFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca por Texto */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Número, origem, destino..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select defaultValue="all">
                <SelectTrigger id="period">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConhecimentoFilters;
