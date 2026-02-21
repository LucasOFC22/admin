import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DayData {
  date: Date;
  receitas: number;
  receitasRecebidas: number;
  despesas: number;
  despesasPagas: number;
}

interface CalendarioFinanceiroCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  daysData: DayData[];
  onDayClick?: (day: DayData) => void;
}

import { formatCurrency, formatCurrencyCompact } from '@/lib/formatters';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const CalendarioFinanceiroCalendar: React.FC<CalendarioFinanceiroCalendarProps> = ({
  currentMonth,
  onMonthChange,
  daysData,
  onDayClick,
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getDayData = (date: Date): DayData | undefined => {
    return daysData.find(d => isSameDay(d.date, date));
  };

  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const handleToday = () => onMonthChange(new Date());

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <h2 className="text-lg sm:text-2xl font-bold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth} className="px-2 sm:px-3">
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="px-2 sm:px-3">
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="px-2 sm:px-3">
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[320px] sm:min-w-0">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                {/* Weekday headers */}
                {WEEKDAYS.map((day, index) => (
                  <div key={day} className="text-center font-semibold p-1 sm:p-2 text-muted-foreground text-xs sm:text-sm">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>
                  </div>
                ))}

                {/* Empty cells for days before month start */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[120px] lg:min-h-[150px] border rounded-lg bg-muted/20" />
                ))}

                {/* Calendar days */}
                {daysInMonth.map((day) => {
                  const dayData = getDayData(day);
                  const hasReceitas = dayData && dayData.receitas > 0;
                  const hasDespesas = dayData && dayData.despesas > 0;
                  const saldo = dayData ? dayData.receitas - dayData.despesas : 0;
                  const today = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] sm:min-h-[120px] lg:min-h-[150px] border rounded-lg p-1 sm:p-2 space-y-1 cursor-pointer hover:bg-accent/50 transition-colors ${
                        today ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => dayData && onDayClick?.(dayData)}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{format(day, 'd')}</div>

                      {(hasReceitas || hasDespesas) && (
                        <div className="space-y-0.5 sm:space-y-1">
                          {/* Mobile: Compact view */}
                          <div className="sm:hidden">
                            {hasReceitas && (
                              <div className="flex items-center gap-0.5 text-green-600">
                                <TrendingUp className="h-2.5 w-2.5" />
                                <span className="text-[10px] font-medium truncate">{formatCurrencyCompact(dayData.receitas)}</span>
                              </div>
                            )}
                            {hasDespesas && (
                              <div className="flex items-center gap-0.5 text-red-600">
                                <TrendingDown className="h-2.5 w-2.5" />
                                <span className="text-[10px] font-medium truncate">{formatCurrencyCompact(dayData.despesas)}</span>
                              </div>
                            )}
                          </div>

                          {/* Desktop: Full view */}
                          <div className="hidden sm:block space-y-1 text-xs">
                            {hasReceitas && (
                              <div className="bg-green-100 dark:bg-green-900/30 p-1 lg:p-1.5 rounded">
                                <div className="flex items-center gap-1 text-green-700 dark:text-green-300 font-semibold">
                                  <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">{formatCurrency(dayData.receitas)}</span>
                                </div>
                                <div className="hidden lg:flex justify-between text-xs mt-1 opacity-90">
                                  <span>Recebido: {formatCurrency(dayData.receitasRecebidas)}</span>
                                </div>
                              </div>
                            )}

                            {hasDespesas && (
                              <div className="bg-red-100 dark:bg-red-900/30 p-1 lg:p-1.5 rounded">
                                <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-semibold">
                                  <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">{formatCurrency(dayData.despesas)}</span>
                                </div>
                                <div className="hidden lg:flex justify-between text-xs mt-1 opacity-90">
                                  <span>Pago: {formatCurrency(dayData.despesasPagas)}</span>
                                </div>
                              </div>
                            )}

                            <div className="hidden lg:block space-y-0.5 border-t pt-1">
                              <div className={`text-xs font-semibold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Saldo: {saldo < 0 ? '-' : ''}{formatCurrency(Math.abs(saldo))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};