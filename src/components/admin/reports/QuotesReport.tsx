
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAdminQuotes } from '@/hooks/useAdminQuotes';

interface QuotesReportProps {
  dateRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const QuotesReport = ({ dateRange }: QuotesReportProps) => {
  const { quotes, isLoading } = useAdminQuotes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Dados por status
  const statusData = [
    { name: 'Pendentes', value: quotes.filter(q => q.status === 'pending' || !q.status).length },
    { name: 'Proposta Enviada', value: quotes.filter(q => q.status === 'proposta_enviada').length },
    { name: 'Aceitas', value: quotes.filter(q => q.status === 'aceitar').length },
    { name: 'Rejeitadas', value: quotes.filter(q => q.status === 'rejeitar').length },
    { name: 'Expiradas', value: quotes.filter(q => q.status === 'expired').length }
  ];

  // Valor total das cotações
  const totalValue = quotes.reduce((sum, quote) => sum + (quote.value || 0), 0);
  const averageValue = quotes.length > 0 ? totalValue / quotes.length : 0;

  // Cotações por faixa de valor
  const valueRanges = [
    { range: 'Até R$ 1.000', value: quotes.filter(q => q.value <= 1000).length },
    { range: 'R$ 1.001 - R$ 5.000', value: quotes.filter(q => q.value > 1000 && q.value <= 5000).length },
    { range: 'R$ 5.001 - R$ 10.000', value: quotes.filter(q => q.value > 5000 && q.value <= 10000).length },
    { range: 'Acima de R$ 10.000', value: quotes.filter(q => q.value > 10000).length }
  ];

  // Simulação de dados temporais (últimos 30 dias)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.getDate(),
      cotacoes: Math.floor(Math.random() * 5) + 1,
      valor: Math.floor(Math.random() * 50000) + 10000
    };
  });

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{quotes.length}</div>
            <p className="text-sm text-gray-600">Total de Cotações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600">Valor Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600">Valor Médio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'aceitar').length / quotes.length) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Taxa de Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Cotações */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cotações por Faixa de Valor */}
        <Card>
          <CardHeader>
            <CardTitle>Cotações por Faixa de Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueRanges} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolução temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Cotações (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last30Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="cotacoes" fill="#8884d8" name="Cotações" />
              <Line yAxisId="right" type="monotone" dataKey="valor" stroke="#82ca9d" name="Valor (R$)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de cotações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Cotações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quotes.slice(0, 5).map((quote, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">#{quote.quoteId}</p>
                  <p className="text-sm text-gray-600">{quote.clientName}</p>
                  <p className="text-xs text-gray-500">{quote.origin} → {quote.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {quote.value > 0 ? `R$ ${quote.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Aguardando'}
                  </p>
                  <p className="text-xs text-gray-500">{quote.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotesReport;
