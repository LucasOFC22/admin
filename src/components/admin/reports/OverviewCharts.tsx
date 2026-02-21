
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAdminQuotes } from '@/hooks/useAdminQuotes';
import { useAdminContacts } from '@/hooks/useAdminContacts';

interface OverviewChartsProps {
  dateRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const OverviewCharts = ({ dateRange }: OverviewChartsProps) => {
  const { quotes } = useAdminQuotes();
  const { contacts } = useAdminContacts();

  // Dados para gráfico de cotações por status
  const quotesStatusData = [
    { 
      name: 'Pendentes', 
      value: quotes.filter(q => q.status === 'pending' || !q.status).length,
      color: '#FFBB28'
    },
    { 
      name: 'Proposta Enviada', 
      value: quotes.filter(q => q.status === 'proposta_enviada').length,
      color: '#0088FE'
    },
    { 
      name: 'Aceitas', 
      value: quotes.filter(q => q.status === 'aceitar').length,
      color: '#00C49F'
    },
    { 
      name: 'Rejeitadas', 
      value: quotes.filter(q => q.status === 'rejeitar').length,
      color: '#FF8042'
    }
  ];

  // Dados para gráfico de atividade ao longo do tempo (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  });

  const activityData = last7Days.map(date => ({
    date,
    cotacoes: Math.floor(Math.random() * 10) + 1, // Simulando dados por enquanto
    contatos: Math.floor(Math.random() * 15) + 5,
    chats: Math.floor(Math.random() * 20) + 10
  }));

  // Dados para gráfico de contatos por origem - mockado
  const contactsSourceData = [
    { name: 'Formulário', value: Math.floor(contacts.length * 0.7) },
    { name: 'Chat', value: Math.floor(contacts.length * 0.3) },
    { name: 'Formulário', value: Math.floor(contacts.length * 0.2) },
    { name: 'Telefone', value: Math.floor(contacts.length * 0.1) }
  ];

  return (
    <div className="space-y-6">
      {/* Primeira linha - Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Cotações por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cotações por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quotesStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {quotesStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Atividade */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cotacoes" stroke="#8884d8" name="Cotações" />
                <Line type="monotone" dataKey="contatos" stroke="#82ca9d" name="Contatos" />
                <Line type="monotone" dataKey="chats" stroke="#ffc658" name="Chats" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Contatos por Origem */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contactsSourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="font-medium">Total de Cotações</span>
                <span className="text-2xl font-bold text-blue-600">{quotes.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium">Total de Contatos</span>
                <span className="text-2xl font-bold text-green-600">{contacts.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="font-medium">Conversas de Chat</span>
                <span className="text-2xl font-bold text-purple-600">0</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <span className="font-medium">Taxa de Conversão</span>
                <span className="text-2xl font-bold text-orange-600">
                  {quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'aceitar').length / quotes.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewCharts;
