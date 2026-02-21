import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactsFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const ContactsFilters = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onRefresh,
  isLoading
}: ContactsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou mensagem..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="novo">Novos</SelectItem>
          <SelectItem value="em_andamento">Em Andamento</SelectItem>
          <SelectItem value="respondido">Respondidos</SelectItem>
          <SelectItem value="fechado">Fechados</SelectItem>
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

export default ContactsFilters;
