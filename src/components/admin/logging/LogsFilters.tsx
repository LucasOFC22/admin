import React from 'react';
import { Filter, Search } from 'lucide-react';
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

export interface FilterOption { 
  value: string; 
  label: string; 
}

export interface LogsFiltersConfig { 
  showUsuario?: boolean; 
  showNivel?: boolean; 
  showTipo?: boolean; 
  showModulo?: boolean; 
  showSearch?: boolean; 
}

interface LogsFiltersProps {
  usuarios?: FilterOption[];
  selectedUsuario?: string;
  onUsuarioChange?: (value: string) => void;
  selectedNivel?: string;
  onNivelChange?: (value: string) => void;
  selectedTipo?: string;
  onTipoChange?: (value: string) => void;
  tipoOptions?: FilterOption[];
  selectedModulo?: string;
  onModuloChange?: (value: string) => void;
  moduloOptions?: FilterOption[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  config?: LogsFiltersConfig;
}

const NIVEIS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Aviso' },
  { value: 'error', label: 'Erro' },
  { value: 'critical', label: 'Crítico' }
];

export const LogsFilters: React.FC<LogsFiltersProps> = ({
  usuarios = [],
  selectedUsuario = '',
  onUsuarioChange,
  selectedNivel = '',
  onNivelChange,
  selectedTipo = '',
  onTipoChange,
  tipoOptions = [],
  selectedModulo = '',
  onModuloChange,
  moduloOptions = [],
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onSearch,
  onClear,
  config = { showUsuario: true, showNivel: false, showSearch: true }
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {config.showUsuario && onUsuarioChange && (
            <div className="space-y-1.5">
              <Label className="text-xs">Usuário</Label>
              <Select value={selectedUsuario || "all"} onValueChange={(v) => onUsuarioChange(v === "all" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {config.showNivel && onNivelChange && (
            <div className="space-y-1.5">
              <Label className="text-xs">Nível</Label>
              <Select value={selectedNivel || "all"} onValueChange={(v) => onNivelChange(v === "all" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {NIVEIS.map(n => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {config.showTipo && onTipoChange && tipoOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={selectedTipo || "all"} onValueChange={(v) => onTipoChange(v === "all" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {tipoOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {config.showModulo && onModuloChange && moduloOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Módulo</Label>
              <Select value={selectedModulo || "all"} onValueChange={(v) => onModuloChange(v === "all" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {moduloOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {config.showSearch && onSearchChange && (
            <div className="space-y-1.5">
              <Label className="text-xs">Buscar</Label>
              <Input 
                className="h-9" 
                placeholder={searchPlaceholder} 
                value={searchValue} 
                onChange={(e) => onSearchChange(e.target.value)} 
              />
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label className="text-xs">Data Início</Label>
            <Input 
              className="h-9" 
              type="date" 
              value={startDate} 
              onChange={(e) => onStartDateChange(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Data Fim</Label>
            <Input 
              className="h-9" 
              type="date" 
              value={endDate} 
              onChange={(e) => onEndDateChange(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button onClick={onSearch} size="sm">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsFilters;
