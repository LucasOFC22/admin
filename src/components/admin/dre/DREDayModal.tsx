import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DRELancamento } from './DRETableGrid';

interface DREDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  lancamentos: DRELancamento[];
  allLancamentos: DRELancamento[];
  onDateChange: (date: Date) => void;
}

import { formatCurrency } from '@/lib/formatters';

export const DREDayModal: React.FC<DREDayModalProps> = ({
  open,
  onOpenChange,
  date,
  lancamentos,
  allLancamentos,
  onDateChange,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const receitas = useMemo(() => 
    lancamentos.filter(l => l.tipo === 'RECEITA'), 
    [lancamentos]
  );
  
  const despesas = useMemo(() => 
    lancamentos.filter(l => l.tipo === 'DESPESA'), 
    [lancamentos]
  );

  const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
  const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);

  // Datas com lançamentos para highlight no calendar
  const datesWithData = useMemo(() => {
    const dates = new Set<string>();
    allLancamentos.forEach(l => {
      if (l.data) dates.add(l.data);
    });
    return dates;
  }, [allLancamentos]);

  const handlePrevDay = () => {
    if (date) onDateChange(subDays(date, 1));
  };

  const handleNextDay = () => {
    if (date) onDateChange(addDays(date, 1));
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setCalendarOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="text-lg font-semibold">
              Lançamentos do dia {date && format(date, "dd/MM/yyyy", { locale: ptBR })}
            </span>
            
            {/* Navegação por data */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendário</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={handleCalendarSelect}
                    locale={ptBR}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    modifiers={{
                      hasData: (day) => datesWithData.has(format(day, 'yyyy-MM-dd'))
                    }}
                    modifiersStyles={{
                      hasData: { 
                        fontWeight: 'bold',
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        borderRadius: '4px'
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3 py-3">
          <Card className="p-3 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total Receitas</span>
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400 mt-1">
              {formatCurrency(totalReceitas)}
            </p>
          </Card>
          
          <Card className="p-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Total Despesas</span>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-400 mt-1">
              {formatCurrency(totalDespesas)}
            </p>
          </Card>
          
          <Card className="p-3 bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground">Lançamentos</div>
            <p className="text-lg font-bold mt-1">{lancamentos.length}</p>
          </Card>
        </div>

        {/* Tabela de lançamentos */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-20">Tipo</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead className="w-24">Doc</TableHead>
                <TableHead className="text-right w-28">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento encontrado para este dia.
                  </TableCell>
                </TableRow>
              ) : (
                lancamentos.map((item, index) => (
                  <TableRow key={`${item.id}-${index}`}>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        item.tipo === 'RECEITA' 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        {item.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={item.conta}>
                      {item.conta}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.nome}>
                      {item.nome}
                    </TableCell>
                    <TableCell>{item.banco}</TableCell>
                    <TableCell>{item.documento}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      item.tipo === 'RECEITA' ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(item.valor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
