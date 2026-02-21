import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DRELancamento } from './DRETableGrid';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DRECalendarViewProps {
  lancamentos: DRELancamento[];
  onDayClick?: (date: Date, items: DRELancamento[]) => void;
}

export const DRECalendarView: React.FC<DRECalendarViewProps> = ({
  lancamentos,
  onDayClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Agrupar lançamentos por dia - normalizar data ISO para yyyy-MM-dd
  const lancamentosByDay = lancamentos.reduce((acc, item) => {
    const dateKey = item.data.split('T')[0]; // "2025-12-17T00:00:00.000Z" → "2025-12-17"
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, DRELancamento[]>);

  const getDayData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const items = lancamentosByDay[dateKey] || [];
    const receitas = items.filter(i => i.tipo === 'RECEITA').reduce((sum, i) => sum + i.valor, 0);
    const despesas = items.filter(i => i.tipo === 'DESPESA').reduce((sum, i) => sum + i.valor, 0);
    return { items, receitas, despesas };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Calendário</CardTitle>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-xs sm:text-sm min-w-[100px] sm:min-w-[140px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Header dos dias da semana */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do calendário */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map(day => {
            const { items, receitas, despesas } = getDayData(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasData = items.length > 0;

            return (
              <div
                key={day.toISOString()}
                onClick={() => hasData && onDayClick?.(day, items)}
                className={cn(
                  "h-24 p-2 rounded-lg border transition-all",
                  isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                  hasData && 'hover:shadow-md cursor-pointer hover:border-primary/50'
                )}
              >
                <div className={cn(
                  "font-medium text-sm mb-1 flex items-center justify-between",
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                  {hasData && <Eye className="h-3 w-3 text-muted-foreground" />}
                </div>
                {hasData && (
                  <div className="space-y-1 text-xs">
                    {receitas > 0 && (
                      <div className="text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(receitas)}
                      </div>
                    )}
                    {despesas > 0 && (
                      <div className="text-destructive flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {formatCurrency(despesas)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
