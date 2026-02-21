import React, { useState, useMemo, useCallback } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Landmark, Info, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from '@/lib/toast';
import { backendService } from '@/services/api/backendService';
import {
  CalendarioFinanceiroFilters,
  CalendarioFinanceiroSummaryCards,
  CalendarioFinanceiroCalendar,
  CalendarioFinanceiroDayModal,
  CalendarioFinanceiroExportMenu,
  type CalendarioFilters,
  type FinancialSummary,
  type DayData,
  type DayDetailItem,
} from '@/components/admin/calendario-financeiro';

type ViewMode = 'titulos' | 'pagamentos';
type GroupByPagamentos = 'data' | 'banco' | 'operacao' | 'fornecedor';

// Tipo interno para dados do backend
interface BackendDayData {
  date: string;
  receitas: number;
  receitasRecebidas: number;
  despesas: number;
  despesasPagas: number;
}

interface BackendDayDetailItem {
  id: string;
  cliente: string;
  cpfCnpj: string;
  documento: string;
  valor: number;
  status: 'aberto' | 'atrasado' | 'liquidado';
  tipo: 'receita' | 'despesa';
  dataVencimento?: string;
  dataPagamento?: string;
}

const CalendarioFinanceiro: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('titulos');
  const [groupBy, setGroupBy] = useState<GroupByPagamentos>('data');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<CalendarioFilters>({
    status: 'todos',
    contrato: 'todos',
    dataEmissaoInicio: startOfMonth(new Date()),
    dataEmissaoFim: new Date(),
    dataVencimentoInicio: undefined,
    dataVencimentoFim: undefined,
    dataPagamentoInicio: undefined,
    dataPagamentoFim: undefined,
  });

  // Estado para dados reais do backend
  const [backendDaysData, setBackendDaysData] = useState<BackendDayData[]>([]);
  const [allItems, setAllItems] = useState<BackendDayDetailItem[]>([]);
  const [summaryData, setSummaryData] = useState<FinancialSummary>({
    totalReceitas: 0,
    receitasRecebidas: 0,
    receitasAReceber: 0,
    totalDespesas: 0,
    despesasPagas: 0,
    despesasAPagar: 0,
    qtdReceitas: 0,
    qtdDespesas: 0,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalItems, setModalItems] = useState<DayDetailItem[]>([]);
  const [modalTipo, setModalTipo] = useState<'receita' | 'despesa'>('receita');
  const [modalLoading, setModalLoading] = useState(false);

  // Helper para parsear data string como local (evita bug de UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Converter daysData do backend para formato esperado pelo componente
  const convertedDaysData: DayData[] = useMemo(() => {
    return backendDaysData.map(day => ({
      ...day,
      date: parseLocalDate(day.date),
    }));
  }, [backendDaysData]);

  // Helper para formatar data no timezone local (evita bug de UTC)
  const formatDateForApi = (date: Date | undefined): string | undefined => {
    return date ? format(date, 'yyyy-MM-dd') : undefined;
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const mes = currentMonth.getMonth() + 1;
      const ano = currentMonth.getFullYear();

      const response = await backendService.buscarCalendarioFinanceiro({
        empresa: filters.empresa,
        status: filters.status !== 'todos' ? filters.status : undefined,
        contrato: filters.contrato !== 'todos' ? filters.contrato : undefined,
        dataEmissaoInicio: formatDateForApi(filters.dataEmissaoInicio),
        dataEmissaoFim: formatDateForApi(filters.dataEmissaoFim),
        dataVencimentoInicio: formatDateForApi(filters.dataVencimentoInicio),
        dataVencimentoFim: formatDateForApi(filters.dataVencimentoFim),
        dataPagamentoInicio: formatDateForApi(filters.dataPagamentoInicio),
        dataPagamentoFim: formatDateForApi(filters.dataPagamentoFim),
        mes,
        ano,
        modoVisualizacao: viewMode,
      });

      if (response.success && response.data) {
        setBackendDaysData(response.data.dias as BackendDayData[]);
        setSummaryData(response.data.resumo);
        setAllItems((response.data.items || []) as BackendDayDetailItem[]);
        toast.success(`${response.data.dias.length} dias com movimentação carregados!`);
      } else {
        toast.error(response.error || 'Erro ao carregar dados');
        setBackendDaysData([]);
        setSummaryData({
          totalReceitas: 0,
          receitasRecebidas: 0,
          receitasAReceber: 0,
          totalDespesas: 0,
          despesasPagas: 0,
          despesasAPagar: 0,
          qtdReceitas: 0,
          qtdDespesas: 0,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar calendário financeiro:', error);
      toast.error('Erro ao buscar calendário financeiro');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, filters, viewMode]);

  const handleClear = () => {
    setFilters({
      status: 'todos',
      contrato: 'todos',
      dataEmissaoInicio: undefined,
      dataEmissaoFim: undefined,
      dataVencimentoInicio: undefined,
      dataVencimentoFim: undefined,
      dataPagamentoInicio: undefined,
      dataPagamentoFim: undefined,
    });
  };


  const handleDayClick = useCallback(async (day: DayData) => {
    // Determine tipo based on what has value
    const tipo = day.receitas > 0 ? 'receita' : 'despesa';
    setModalDate(day.date);
    setModalTipo(tipo);
    setModalOpen(true);
    setModalLoading(true);

    try {
      // Filtrar items locais primeiro (se tiver)
      const dateStr = format(day.date, 'yyyy-MM-dd');
      const localItems = allItems.filter(item => {
        // Verificar tanto dataVencimento quanto dataPagamento
        const itemVencimento = item.dataVencimento?.split('T')[0];
        const itemPagamento = item.dataPagamento?.split('T')[0];
        const matchesDate = itemVencimento === dateStr || itemPagamento === dateStr;
        return matchesDate && item.tipo === tipo;
      });

      if (localItems.length > 0) {
        // Converter para o tipo do componente (sem dataVencimento/dataPagamento)
        const convertedItems: DayDetailItem[] = localItems.map(item => ({
          id: item.id,
          cliente: item.cliente,
          cpfCnpj: item.cpfCnpj,
          documento: item.documento,
          valor: item.valor,
          status: item.status,
          tipo: item.tipo,
        }));
        setModalItems(convertedItems);
        setModalLoading(false);
        return;
      }

      // Se não tiver localmente, buscar do backend
      const response = await backendService.buscarDetalheDia({
        data: format(day.date, 'yyyy-MM-dd'),
        tipo,
        empresa: filters.empresa,
      });

      if (response.success && response.data) {
        // Converter para o tipo do componente
        const convertedItems: DayDetailItem[] = response.data.map((item: any) => ({
          id: item.id,
          cliente: item.cliente,
          cpfCnpj: item.cpfCnpj,
          documento: item.documento,
          valor: item.valor,
          status: item.status,
          tipo: item.tipo,
        }));
        setModalItems(convertedItems);
      } else {
        setModalItems([]);
        toast.error(response.error || 'Erro ao carregar detalhes');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do dia:', error);
      setModalItems([]);
    } finally {
      setModalLoading(false);
    }
  }, [allItems, filters.empresa]);

  const handleMonthChange = useCallback((newMonth: Date) => {
    setCurrentMonth(newMonth);
  }, []);

  return (
    <>
      <main className="flex-1 p-2 sm:p-4 lg:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* View Mode Toggle */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm sm:text-base font-semibold">Modo de Visualização</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Alterne entre visualização por títulos ou pagamentos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant={viewMode === 'titulos' ? 'default' : 'outline'}
                    onClick={() => setViewMode('titulos')}
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    <DollarSign className="h-4 w-4" aria-hidden="true" />
                    Títulos
                  </Button>
                  <Button
                    variant={viewMode === 'pagamentos' ? 'default' : 'outline'}
                    onClick={() => setViewMode('pagamentos')}
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    <Landmark className="h-4 w-4" aria-hidden="true" />
                    Pagamentos
                  </Button>
                </div>

                {/* Agrupamento (apenas para modo Pagamentos) */}
                {viewMode === 'pagamentos' && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t">
                    <Label className="text-sm font-medium whitespace-nowrap">Agrupar por:</Label>
                    <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByPagamentos)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="operacao">Operação</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <CalendarioFinanceiroFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            onClear={handleClear}
          />

          {/* Search and Export Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
            <CalendarioFinanceiroExportMenu
              items={allItems}
              summary={summaryData}
              currentMonth={currentMonth}
              viewMode={viewMode}
              disabled={isLoading}
            />
          </div>

          {/* Summary Cards */}
          <CalendarioFinanceiroSummaryCards summary={summaryData} viewMode={viewMode} />

          {/* Calendar */}
          <CalendarioFinanceiroCalendar
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            daysData={convertedDaysData}
            onDayClick={handleDayClick}
          />
        </div>
      </main>

      {/* Day Details Modal */}
      <CalendarioFinanceiroDayModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={modalDate}
        items={modalItems}
        tipo={modalTipo}
      />
    </>
  );
};

export default CalendarioFinanceiro;
