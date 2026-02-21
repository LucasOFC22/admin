import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';
import { Filter, Search, User, MapPin, CalendarDays, FileText, X, UserSearch } from 'lucide-react';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, subMonths, addWeeks, format 
} from 'date-fns';

export interface ColetasFilterValues {
  numeroColetaInicial: string;
  numeroColetaFinal: string;
  situacao: string;
  tipoRegistro: string;
  dataColetaInicio: string;
  dataColetaFim: string;
  dataEmissaoInicio: string;
  dataEmissaoFim: string;
  remetente: string;
  destinatario: string;
  cidadeOrigem: string;
  cidadeDestino: string;
  ufColeta: string;
}

interface SelectedEntity {
  nome?: string;
  cpfcgc?: string;
  cidade?: string;
  uf?: string;
  nomeCidade?: string;
}

interface ColetasFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filtros: ColetasFilterValues;
  onFilterChange: (field: string, value: string) => void;
  onLimparFiltros: () => void;
  selectedEmpresa: string;
  onEmpresaChange: (value: string) => void;
  selectedRemetente: SelectedEntity | null;
  selectedDestinatario: SelectedEntity | null;
  selectedCidadeOrigem: SelectedEntity | null;
  selectedCidadeDestino: SelectedEntity | null;
  onOpenRemetenteModal: () => void;
  onOpenDestinatarioModal: () => void;
  onOpenCidadeOrigemModal: () => void;
  onOpenCidadeDestinoModal: () => void;
  onBuscar: () => void;
}

const dateShortcuts = [
  { label: 'Coletas do Dia', getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: 'Coletas da Semana', getRange: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: 'Coletas do Mês', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Mês Passado', getRange: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Próxima Semana', getRange: () => ({ start: startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), end: endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
];

export const ColetasFilters = ({
  isOpen,
  onOpenChange,
  filtros,
  onFilterChange,
  onLimparFiltros,
  selectedEmpresa,
  onEmpresaChange,
  selectedRemetente,
  selectedDestinatario,
  selectedCidadeOrigem,
  selectedCidadeDestino,
  onOpenRemetenteModal,
  onOpenDestinatarioModal,
  onOpenCidadeOrigemModal,
  onOpenCidadeDestinoModal,
  onBuscar
}: ColetasFiltersProps) => {
  
  const handleDateShortcut = (shortcut: typeof dateShortcuts[0]) => {
    const { start, end } = shortcut.getRange();
    onFilterChange('dataColetaInicio', format(start, 'yyyy-MM-dd'));
    onFilterChange('dataColetaFim', format(end, 'yyyy-MM-dd'));
  };

  const hasActiveFilters = () => {
    return Object.entries(filtros).some(([key, value]) => {
      if (key === 'situacao' && value === 'todos') return false;
      if (key === 'tipoRegistro' && value === 'todos') return false;
      return value !== '';
    }) || selectedEmpresa !== 'all' || selectedRemetente || selectedDestinatario || selectedCidadeOrigem || selectedCidadeDestino;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleContent>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
              {hasActiveFilters() && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  Ativos
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Empresa */}
            <div className="md:col-span-2 lg:col-span-3">
              <EmpresaSelector
                value={selectedEmpresa}
                onChange={onEmpresaChange}
                showAllOption={true}
                label=""
              />
            </div>

            {/* Grid de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Número Coleta */}
              <div>
                <Label>Número Coleta (Inicial)</Label>
                <Input
                  placeholder="COL-2024-001"
                  value={filtros.numeroColetaInicial}
                  onChange={(e) => onFilterChange('numeroColetaInicial', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Número Coleta (Final)</Label>
                <Input
                  placeholder="COL-2024-999"
                  value={filtros.numeroColetaFinal}
                  onChange={(e) => onFilterChange('numeroColetaFinal', e.target.value)}
                />
              </div>
              
              {/* Situação */}
              <div>
                <Label>Situação</Label>
                <Select value={filtros.situacao} onValueChange={(value) => onFilterChange('situacao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as situações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as situações</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Implantado">Implantado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Registro */}
              <div>
                <Label>Tipo de Registro</Label>
                <Select value={filtros.tipoRegistro || 'todos'} onValueChange={(value) => onFilterChange('tipoRegistro', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="coleta">Coleta</SelectItem>
                    <SelectItem value="cotacao">Cotação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Datas Coleta */}
              <div>
                <Label>Data Coleta (Início)</Label>
                <Input
                  type="date"
                  value={filtros.dataColetaInicio}
                  onChange={(e) => onFilterChange('dataColetaInicio', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Data Coleta (Fim)</Label>
                <Input
                  type="date"
                  value={filtros.dataColetaFim}
                  onChange={(e) => onFilterChange('dataColetaFim', e.target.value)}
                />
              </div>
            </div>

            {/* Atalhos de Data */}
            <div>
              <Label className="mb-2 block">Atalhos de Data Coleta</Label>
              <div className="flex flex-wrap gap-2">
                {dateShortcuts.map((shortcut) => (
                  <Button
                    key={shortcut.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDateShortcut(shortcut)}
                  >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {shortcut.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Datas Emissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Data Emissão (Início)</Label>
                <Input
                  type="date"
                  value={filtros.dataEmissaoInicio}
                  onChange={(e) => onFilterChange('dataEmissaoInicio', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Data Emissão (Fim)</Label>
                <Input
                  type="date"
                  value={filtros.dataEmissaoFim}
                  onChange={(e) => onFilterChange('dataEmissaoFim', e.target.value)}
                />
              </div>

              {/* UF */}
              <div>
                <Label>UF Coleta</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  value={filtros.ufColeta}
                  onChange={(e) => onFilterChange('ufColeta', e.target.value.toUpperCase())}
                />
              </div>
            </div>
            
            {/* Remetente e Destinatário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Remetente</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={onOpenRemetenteModal}
                    >
                      <UserSearch className="h-4 w-4 mr-2" />
                      {selectedRemetente ? selectedRemetente.nome : 'Selecionar remetente'}
                    </Button>
                  </div>
                </div>
                {selectedRemetente && (
                  <p className="text-xs text-muted-foreground">
                    {selectedRemetente.cpfcgc} - {selectedRemetente.cidade}/{selectedRemetente.uf}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={onOpenDestinatarioModal}
                    >
                      <UserSearch className="h-4 w-4 mr-2" />
                      {selectedDestinatario ? selectedDestinatario.nome : 'Selecionar destinatário'}
                    </Button>
                  </div>
                </div>
                {selectedDestinatario && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDestinatario.cpfcgc} - {selectedDestinatario.cidade}/{selectedDestinatario.uf}
                  </p>
                )}
              </div>
            </div>
            
            {/* Cidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade Origem</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={onOpenCidadeOrigemModal}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedCidadeOrigem ? `${selectedCidadeOrigem.nomeCidade} - ${selectedCidadeOrigem.uf}` : 'Selecionar cidade origem'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cidade Destino</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={onOpenCidadeDestinoModal}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedCidadeDestino ? `${selectedCidadeDestino.nomeCidade} - ${selectedCidadeDestino.uf}` : 'Selecionar cidade destino'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={onBuscar} className="flex-1 sm:flex-none">
                <Search className="h-4 w-4 mr-2" />
                Buscar Coletas
              </Button>
              <Button variant="outline" onClick={onLimparFiltros}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
