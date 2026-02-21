import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Landmark } from 'lucide-react';

export interface FinancialSummary {
  totalReceitas: number;
  receitasRecebidas: number;
  receitasAReceber: number;
  totalDespesas: number;
  despesasPagas: number;
  despesasAPagar: number;
  qtdReceitas?: number;
  qtdDespesas?: number;
}

interface CalendarioFinanceiroSummaryCardsProps {
  summary: FinancialSummary;
  viewMode?: 'titulos' | 'pagamentos';
}

import { formatCurrency } from '@/lib/formatters';

export const CalendarioFinanceiroSummaryCards: React.FC<CalendarioFinanceiroSummaryCardsProps> = ({
  summary,
  viewMode = 'titulos',
}) => {
  // Modo Pagamentos - 4 cards simplificados
  if (viewMode === 'pagamentos') {
    const saldoPeriodo = summary.receitasRecebidas - summary.despesasPagas;
    const qtdTotal = (summary.qtdReceitas || 0) + (summary.qtdDespesas || 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recebido */}
        <Card>
          <CardContent className="p-6 pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Recebido</p>
                <TrendingUp className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary.receitasRecebidas)}</p>
              <div className="text-xs text-muted-foreground">
                {summary.qtdReceitas || 0} recebimento(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Pago */}
        <Card>
          <CardContent className="p-6 pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Pago</p>
                <TrendingDown className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(summary.despesasPagas)}</p>
              <div className="text-xs text-muted-foreground">
                {summary.qtdDespesas || 0} pagamento(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo do Período */}
        <Card>
          <CardContent className="p-6 pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Saldo do Período</p>
                <DollarSign className={`h-6 w-6 ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
              </div>
              <p className={`text-xl font-bold ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldoPeriodo)}
              </p>
              <div className="text-xs text-muted-foreground">Fluxo de caixa realizado</div>
            </div>
          </CardContent>
        </Card>

        {/* Qtd. Movimentos */}
        <Card>
          <CardContent className="p-6 pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Qtd. Movimentos</p>
                <Landmark className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-primary">{qtdTotal}</p>
              <div className="text-xs text-muted-foreground">Total de lançamentos</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modo Títulos - layout original com 5 cards
  const saldoTotal = summary.totalReceitas - summary.totalDespesas;
  const saldoLiquidado = summary.receitasRecebidas - summary.despesasPagas;
  const saldoAberto = summary.receitasAReceber - summary.despesasAPagar;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
      <Card>
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Receitas</p>
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" aria-hidden="true" />
            </div>
            <p className="text-sm sm:text-xl font-bold text-green-600">{formatCurrency(summary.totalReceitas)}</p>
            <div className="hidden sm:block text-xs space-y-1 mt-2 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recebido:</span>
                <span className="font-semibold text-green-700">{formatCurrency(summary.receitasRecebidas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">A Receber:</span>
                <span className="font-semibold">{formatCurrency(summary.receitasAReceber)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Despesas</p>
              <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" aria-hidden="true" />
            </div>
            <p className="text-sm sm:text-xl font-bold text-red-600">{formatCurrency(summary.totalDespesas)}</p>
            <div className="hidden sm:block text-xs space-y-1 mt-2 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago:</span>
                <span className="font-semibold text-red-700">{formatCurrency(summary.despesasPagas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">A Pagar:</span>
                <span className="font-semibold">{formatCurrency(summary.despesasAPagar)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo Total</p>
              <DollarSign className={`h-4 w-4 sm:h-6 sm:w-6 ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
            </div>
            <p className={`text-sm sm:text-xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo Liquidado</p>
              <DollarSign className={`h-4 w-4 sm:h-6 sm:w-6 ${saldoLiquidado >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
            </div>
            <p className={`text-sm sm:text-xl font-bold ${saldoLiquidado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoLiquidado)}
            </p>
            <div className="hidden sm:block text-xs text-muted-foreground">Já pago/recebido</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:pt-6 sm:p-6">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo em Aberto</p>
              <DollarSign className={`h-4 w-4 sm:h-6 sm:w-6 ${saldoAberto >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
            </div>
            <p className={`text-sm sm:text-xl font-bold ${saldoAberto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoAberto)}
            </p>
            <div className="hidden sm:block text-xs text-muted-foreground">A pagar/receber</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
