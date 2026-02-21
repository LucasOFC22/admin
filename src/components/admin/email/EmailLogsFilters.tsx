import React from 'react';
import { Filter, Search, Hash } from 'lucide-react';
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

interface FilterOption {
  value: string;
  label: string;
}

interface EmailLogsFiltersProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  tipoAcao: string;
  onTipoAcaoChange: (value: string) => void;
  tipoAcaoOptions: FilterOption[];
  status: 'all' | 'success' | 'error';
  onStatusChange: (value: 'all' | 'success' | 'error') => void;
  statusOptions: FilterOption[];
  contaEmailId: string;
  onContaEmailIdChange: (value: string) => void;
  contasEmail: FilterOption[];
  usuarioResponsavelId: string;
  onUsuarioResponsavelIdChange: (value: string) => void;
  usuariosResponsaveis: FilterOption[];
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  uidSearch: string;
  onUidSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const EmailLogsFilters: React.FC<EmailLogsFiltersProps> = ({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  tipoAcao,
  onTipoAcaoChange,
  tipoAcaoOptions,
  status,
  onStatusChange,
  statusOptions,
  contaEmailId,
  onContaEmailIdChange,
  contasEmail,
  usuarioResponsavelId,
  onUsuarioResponsavelIdChange,
  usuariosResponsaveis,
  searchValue,
  onSearchValueChange,
  uidSearch,
  onUidSearchChange,
  onSearch,
  onClear
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {/* Data início */}
          <div className="space-y-1.5">
            <Label className="text-xs">Início</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Data fim */}
          <div className="space-y-1.5">
            <Label className="text-xs">Fim</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Tipo de ação */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipoAcao} onValueChange={onTipoAcaoChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoAcaoOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as 'all' | 'success' | 'error')}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta de email */}
          <div className="space-y-1.5">
            <Label className="text-xs">Conta</Label>
            <Select value={contaEmailId} onValueChange={onContaEmailIdChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                {contasEmail.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label className="text-xs">Responsável</Label>
            <Select value={usuarioResponsavelId} onValueChange={onUsuarioResponsavelIdChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                {usuariosResponsaveis.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca por UID */}
          <div className="space-y-1.5">
            <Label className="text-xs">UID</Label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={uidSearch}
                onChange={(e) => onUidSearchChange(e.target.value)}
                placeholder="Buscar UID"
                className="h-9 pl-8 text-sm font-mono"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Busca geral */}
          <div className="space-y-1.5">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchValueChange(e.target.value)}
                placeholder="Assunto/destinatário"
                className="h-9 pl-8 text-sm"
                onKeyDown={handleKeyDown}
              />
            </div>
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

export default EmailLogsFilters;
