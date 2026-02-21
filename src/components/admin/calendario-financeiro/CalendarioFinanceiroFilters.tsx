import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface CalendarioFilters {
  empresa?: string;
  status: 'todos' | 'aberto' | 'atrasado' | 'liquidado';
  contrato: string;
  dataEmissaoInicio: Date | undefined;
  dataEmissaoFim: Date | undefined;
  dataVencimentoInicio: Date | undefined;
  dataVencimentoFim: Date | undefined;
  dataPagamentoInicio: Date | undefined;
  dataPagamentoFim: Date | undefined;
}

interface CalendarioFinanceiroFiltersProps {
  filters: CalendarioFilters;
  onFiltersChange: (filters: CalendarioFilters) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const CalendarioFinanceiroFilters: React.FC<CalendarioFinanceiroFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}) => {
  const today = new Date();

  const updateFilter = <K extends keyof CalendarioFilters>(key: K, value: CalendarioFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const setEmissaoShortcut = (type: 'mesPassado' | 'mesAtual' | 'semanaAtual' | 'proximaSemana') => {
    let inicio: Date, fim: Date;
    switch (type) {
      case 'mesPassado':
        inicio = startOfMonth(subMonths(today, 1));
        fim = endOfMonth(subMonths(today, 1));
        break;
      case 'mesAtual':
        inicio = startOfMonth(today);
        fim = endOfMonth(today);
        break;
      case 'semanaAtual':
        inicio = startOfWeek(today, { weekStartsOn: 0 });
        fim = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'proximaSemana':
        inicio = startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        fim = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        break;
    }
    onFiltersChange({ ...filters, dataEmissaoInicio: inicio, dataEmissaoFim: fim });
  };

  const setVencimentoShortcut = (type: 'mesPassado' | 'mesAtual' | 'semanaAtual' | 'proximaSemana') => {
    let inicio: Date, fim: Date;
    switch (type) {
      case 'mesPassado':
        inicio = startOfMonth(subMonths(today, 1));
        fim = endOfMonth(subMonths(today, 1));
        break;
      case 'mesAtual':
        inicio = startOfMonth(today);
        fim = endOfMonth(today);
        break;
      case 'semanaAtual':
        inicio = startOfWeek(today, { weekStartsOn: 0 });
        fim = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'proximaSemana':
        inicio = startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        fim = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        break;
    }
    onFiltersChange({ ...filters, dataVencimentoInicio: inicio, dataVencimentoFim: fim });
  };

  const setPagamentoShortcut = (type: 'mesPassado' | 'mesAtual' | 'semanaAtual' | 'proximaSemana') => {
    let inicio: Date, fim: Date;
    switch (type) {
      case 'mesPassado':
        inicio = startOfMonth(subMonths(today, 1));
        fim = endOfMonth(subMonths(today, 1));
        break;
      case 'mesAtual':
        inicio = startOfMonth(today);
        fim = endOfMonth(today);
        break;
      case 'semanaAtual':
        inicio = startOfWeek(today, { weekStartsOn: 0 });
        fim = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'proximaSemana':
        inicio = startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        fim = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
        break;
    }
    onFiltersChange({ ...filters, dataPagamentoInicio: inicio, dataPagamentoFim: fim });
  };

  const DatePickerButton = ({ 
    date, 
    onSelect, 
    placeholder 
  }: { 
    date: Date | undefined; 
    onSelect: (date: Date | undefined) => void; 
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {date ? format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          locale={ptBR}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const ShortcutButtons = ({ onShortcut }: { onShortcut: (type: 'mesPassado' | 'mesAtual' | 'semanaAtual' | 'proximaSemana') => void }) => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => onShortcut('mesPassado')}>Mês Passado</Button>
      <Button variant="outline" size="sm" onClick={() => onShortcut('mesAtual')}>Mês Atual</Button>
      <Button variant="outline" size="sm" onClick={() => onShortcut('semanaAtual')}>Semana Atual</Button>
      <Button variant="outline" size="sm" onClick={() => onShortcut('proximaSemana')}>Próxima Semana</Button>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Search className="h-5 w-5" aria-hidden="true" />
          Filtros de Pesquisa
        </CardTitle>
        <CardDescription>Configure os filtros para buscar receitas e despesas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(v) => updateFilter('status', v as CalendarioFilters['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contrato</Label>
            <Select value={filters.contrato} onValueChange={(v) => updateFilter('contrato', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="S">Sem contrato</SelectItem>
                <SelectItem value="N">Apenas contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Emissão Início</Label>
            <DatePickerButton
              date={filters.dataEmissaoInicio}
              onSelect={(d) => updateFilter('dataEmissaoInicio', d)}
              placeholder="Selecione"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Emissão Fim</Label>
            <DatePickerButton
              date={filters.dataEmissaoFim}
              onSelect={(d) => updateFilter('dataEmissaoFim', d)}
              placeholder="Selecione"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Vencimento Início</Label>
            <DatePickerButton
              date={filters.dataVencimentoInicio}
              onSelect={(d) => updateFilter('dataVencimentoInicio', d)}
              placeholder="Selecione"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Vencimento Fim</Label>
            <DatePickerButton
              date={filters.dataVencimentoFim}
              onSelect={(d) => updateFilter('dataVencimentoFim', d)}
              placeholder="Selecione"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Pagamento Início</Label>
            <DatePickerButton
              date={filters.dataPagamentoInicio}
              onSelect={(d) => updateFilter('dataPagamentoInicio', d)}
              placeholder="Selecione"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Pagamento Fim</Label>
            <DatePickerButton
              date={filters.dataPagamentoFim}
              onSelect={(d) => updateFilter('dataPagamentoFim', d)}
              placeholder="Selecione"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-sm text-muted-foreground mb-2 block">Atalhos de Emissão</Label>
          <ShortcutButtons onShortcut={setEmissaoShortcut} />
        </div>

        <div className="mt-4">
          <Label className="text-sm text-muted-foreground mb-2 block">Atalhos de Vencimento</Label>
          <ShortcutButtons onShortcut={setVencimentoShortcut} />
        </div>

        <div className="mt-4">
          <Label className="text-sm text-muted-foreground mb-2 block">Atalhos de Pagamento</Label>
          <ShortcutButtons onShortcut={setPagamentoShortcut} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button className="flex-1" onClick={onSearch}>
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
          <Button variant="outline" onClick={onClear} className="sm:w-auto">
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};