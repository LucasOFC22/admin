import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DRELancamento } from './DRETableGrid';
import { formatCurrencyCompact } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DREChartsProps {
  lancamentos: DRELancamento[];
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DRECharts: React.FC<DREChartsProps> = ({ lancamentos }) => {
  // Agrupar por data
  const dataByDate = lancamentos.reduce((acc, item) => {
    const date = item.data;
    if (!acc[date]) {
      acc[date] = { date, receitas: 0, despesas: 0 };
    }
    if (item.tipo === 'RECEITA') {
      acc[date].receitas += item.valor;
    } else {
      acc[date].despesas += item.valor;
    }
    return acc;
  }, {} as Record<string, { date: string; receitas: number; despesas: number }>);

  const chartDataByDate = Object.values(dataByDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(item => ({
      ...item,
      dateFormatted: format(parseISO(item.date), 'dd/MM', { locale: ptBR })
    }));

  // Totais para pie chart
  const totalReceitas = lancamentos.filter(l => l.tipo === 'RECEITA').reduce((sum, l) => sum + l.valor, 0);
  const totalDespesas = lancamentos.filter(l => l.tipo === 'DESPESA').reduce((sum, l) => sum + l.valor, 0);

  const pieData = [
    { name: 'Receitas', value: totalReceitas },
    { name: 'Despesas', value: totalDespesas }
  ];

  // Agrupar por conta
  const dataByAccount = lancamentos.reduce((acc, item) => {
    const conta = item.conta;
    if (!acc[conta]) {
      acc[conta] = { conta, valor: 0 };
    }
    acc[conta].valor += item.tipo === 'RECEITA' ? item.valor : -item.valor;
    return acc;
  }, {} as Record<string, { conta: string; valor: number }>);

  const chartDataByAccount = Object.values(dataByAccount)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const formatCurrency = (value: number) => formatCurrencyCompact(value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* Receitas x Despesas por Data */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Receitas x Despesas por Data</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDataByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateFormatted" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="receitas" name="Receitas" fill="#22c55e" />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição Receitas x Despesas */}
      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Distribuição Total</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Contas */}
      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Top 10 Contas</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartDataByAccount} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="conta" width={80} tick={{ fontSize: 9 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="valor" name="Valor" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução Acumulada */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Evolução Acumulada</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartDataByDate.map((item, index, arr) => {
              const accumulated = arr.slice(0, index + 1).reduce((sum, i) => sum + i.receitas - i.despesas, 0);
              return { ...item, acumulado: accumulated };
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateFormatted" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="acumulado" name="Saldo Acumulado" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
