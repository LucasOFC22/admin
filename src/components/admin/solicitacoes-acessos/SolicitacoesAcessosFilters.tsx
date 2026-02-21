import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SolicitacoesAcessosFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const SolicitacoesAcessosFilters = ({
  search,
  onSearchChange,
  onRefresh,
  isLoading,
}: SolicitacoesAcessosFiltersProps) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, empresa, CNPJ ou telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </Card>
  );
};
