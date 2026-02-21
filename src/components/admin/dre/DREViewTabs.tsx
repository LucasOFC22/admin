import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Grid3X3, 
  BarChart3, 
  Calendar, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  Layers, 
  Tag, 
  ArrowRightLeft 
} from 'lucide-react';

export type DREViewMode = 
  | 'grid' 
  | 'graficos' 
  | 'calendario' 
  | 'bancos' 
  | 'fornecedor' 
  | 'contas' 
  | 'operacao' 
  | 'grupos' 
  | 'tipo-lancamento' 
  | 'fornecedor-conta';

export type DREFilterType = 'todos' | 'receitas' | 'despesas';

interface DREViewTabsProps {
  viewMode: DREViewMode;
  setViewMode: (mode: DREViewMode) => void;
  filterType: DREFilterType;
  setFilterType: (type: DREFilterType) => void;
}

export const DREViewTabs: React.FC<DREViewTabsProps> = ({
  viewMode,
  setViewMode,
  filterType,
  setFilterType
}) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filter Type - Todos/Receitas/Despesas */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Exibir:</span>
        <ToggleGroup 
          type="single" 
          value={filterType} 
          onValueChange={(value) => value && setFilterType(value as DREFilterType)}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="todos" className="text-xs px-2 sm:px-3 h-7 sm:h-9">
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem value="receitas" className="text-xs px-2 sm:px-3 h-7 sm:h-9">
            Receitas
          </ToggleGroupItem>
          <ToggleGroupItem value="despesas" className="text-xs px-2 sm:px-3 h-7 sm:h-9">
            Despesas
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* View Modes */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2 scrollbar-thin">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && setViewMode(value as DREViewMode)}
          className="inline-flex gap-1"
        >
          <ToggleGroupItem value="grid" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Grid</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="graficos" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Gráficos</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="calendario" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="bancos" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bancos</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="fornecedor" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Fornecedor</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="contas" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Contas</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="operacao" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Operação</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="grupos" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Grupos</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="tipo-lancamento" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tp Lanç</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="fornecedor-conta" className="flex items-center gap-1 text-xs px-2 h-8 whitespace-nowrap">
            <ArrowRightLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Fornec x Conta</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
