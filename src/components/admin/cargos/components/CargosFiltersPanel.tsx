import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';

interface CargosFiltersPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  uniqueDepartments: string[];
  resultsCount: number;
}

const CargosFiltersPanel = ({
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  uniqueDepartments,
  resultsCount
}: CargosFiltersPanelProps) => {
  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setStatusFilter('all');
  };

  return (
    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <Filter className="h-5 w-5" />
          Filtros e Pesquisa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-slate-600">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">
              Departamento
            </Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept || ''}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">✅ Ativos</SelectItem>
                <SelectItem value="inativo">❌ Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-500">
            {resultsCount > 0 && (
              <span>
                {resultsCount} cargo{resultsCount !== 1 ? 's' : ''} encontrado{resultsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button 
            onClick={clearFilters}
            variant="outline" 
            size="sm"
            className="hover:bg-slate-50"
          >
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CargosFiltersPanel;