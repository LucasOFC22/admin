import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface DRESummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  qtdReceitas: number;
  qtdDespesas: number;
  qtdBancos: number;
  qtdFornecedores: number;
}

export const DRESummaryCards: React.FC<DRESummaryCardsProps> = ({
  totalReceitas,
  totalDespesas,
  qtdReceitas,
  qtdDespesas,
  qtdBancos,
  qtdFornecedores
}) => {
  const resultado = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? ((resultado / totalReceitas) * 100).toFixed(1) : '0.0';
  const isLucro = resultado >= 0;

  // formatCurrency imported from @/lib/formatters

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {/* Total Receitas */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Total Receitas</div>
          <div className="text-sm sm:text-lg font-bold text-green-600 truncate">
            {formatCurrency(totalReceitas)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {qtdReceitas} lançamentos
          </div>
        </CardContent>
      </Card>

      {/* Total Despesas */}
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Total Despesas</div>
          <div className="text-sm sm:text-lg font-bold text-destructive truncate">
            {formatCurrency(totalDespesas)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {qtdDespesas} lançamentos
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card className={`border-l-4 ${isLucro ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Resultado</div>
          <div className={`text-sm sm:text-lg font-bold truncate ${isLucro ? 'text-green-600' : 'text-destructive'}`}>
            {formatCurrency(resultado)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {isLucro ? 'Lucro' : 'Prejuízo'}
          </div>
        </CardContent>
      </Card>

      {/* Margem */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Margem</div>
          <div className="text-sm sm:text-lg font-bold">
            {margem}%
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            sobre receita
          </div>
        </CardContent>
      </Card>

      {/* Bancos */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Bancos</div>
          <div className="text-sm sm:text-lg font-bold">
            {qtdBancos}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            contas utilizadas
          </div>
        </CardContent>
      </Card>

      {/* Fornecedores */}
      <Card className="border-l-4 border-l-secondary">
        <CardContent className="p-3 sm:pt-4 sm:p-6">
          <div className="text-[10px] sm:text-xs text-muted-foreground">Fornecedores</div>
          <div className="text-sm sm:text-lg font-bold">
            {qtdFornecedores}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            únicos no período
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
