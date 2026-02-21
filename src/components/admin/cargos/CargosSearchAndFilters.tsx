
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CargosSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CargosSearchAndFilters = ({ searchQuery, onSearchChange }: CargosSearchAndFiltersProps) => {
  return (
    <div className="flex justify-between items-center mt-4 gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar cargos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Button variant="outline" size="sm" className="gap-2 px-3">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </Button>
    </div>
  );
};

export default CargosSearchAndFilters;
