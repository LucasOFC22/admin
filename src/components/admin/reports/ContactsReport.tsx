
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdminContacts } from '@/hooks/useAdminContacts';

interface ContactsReportProps {
  dateRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ContactsReport = ({ dateRange }: ContactsReportProps) => {
  const { contacts, isLoading } = useAdminContacts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Dados por status
  const statusData = [
    { name: 'Novos', value: contacts.filter(c => c.status === 'novo').length },
    { name: 'Respondidos', value: contacts.filter(c => c.status === 'respondido').length },
    { name: 'Em Andamento', value: contacts.filter(c => c.status === 'em_andamento').length },
    { name: 'Fechados', value: contacts.filter(c => c.status === 'fechado').length }
  ];

  // Dados por origem - mockado
  const sourceData = [
    { name: 'Formulário', value: Math.floor(contacts.length * 0.7) },
    { name: 'Cotação', value: Math.floor(contacts.length * 0.2) },
    { name: 'Outros', value: Math.floor(contacts.length * 0.1) }
  ];

  // Atividade por dia da semana
  const weekDayData = [
    { day: 'Seg', contacts: Math.floor(contacts.length * 0.18) },
    { day: 'Ter', contacts: Math.floor(contacts.length * 0.16) },
    { day: 'Qua', contacts: Math.floor(contacts.length * 0.15) },
    { day: 'Qui', contacts: Math.floor(contacts.length * 0.17) },
    { day: 'Sex', contacts: Math.floor(contacts.length * 0.19) },
    { day: 'Sáb', contacts: Math.floor(contacts.length * 0.08) },
    { day: 'Dom', contacts: Math.floor(contacts.length * 0.07) }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-sm text-gray-600">Total de Contatos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.status === 'novo').length}
            </div>
            <p className="text-sm text-gray-600">Novos Contatos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {contacts.filter(c => c.status === 'respondido').length}
            </div>
            <p className="text-sm text-gray-600">Respondidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {contacts.length > 0 ? Math.round((contacts.filter(c => c.status === 'respondido').length / contacts.length) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Taxa de Resposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Contatos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Contatos</CardTitle>
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

        {/* Origem dos Contatos */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atividade por dia da semana */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos por Dia da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="contacts" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lista de contatos recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contacts.slice(0, 5).map((contact) => (
              <div key={contact.contact_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{contact.status}</p>
                  <p className="text-xs text-gray-500">{new Date(contact.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsReport;
