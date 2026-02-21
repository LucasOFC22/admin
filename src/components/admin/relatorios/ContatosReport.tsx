
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DateRange } from '@/components/DateRangePicker';
import { useAdminContacts } from '@/hooks/useAdminContacts';
import { startOfMonth, format, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContatosReportProps {
  dateRange: DateRange | null;
  period: string;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

// Helper function to convert date string to Date object
const convertToDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Tenta converter formato brasileiro (DD/MM/YYYY)
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  // Se não for formato brasileiro, tenta converter diretamente
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const ContatosReport = ({ dateRange, period }: ContatosReportProps) => {
  const { contacts, isLoading } = useAdminContacts();
  
  // Filtrar contatos pelo período selecionado
  const filteredContacts = (() => {
    if (dateRange?.from && dateRange?.to) {
      return contacts.filter(contact => {
        const contactDate = convertToDate(contact.created_at);
        return contactDate && 
          isWithinInterval(contactDate, { 
            start: dateRange.from, 
            end: dateRange.to 
          });
      });
    } else if (period === '7d') {
      return contacts.filter(contact => {
        const contactDate = convertToDate(contact.created_at);
        const sevenDaysAgo = subDays(new Date(), 7);
        return contactDate && contactDate >= sevenDaysAgo;
      });
    } else if (period === '30d') {
      return contacts.filter(contact => {
        const contactDate = convertToDate(contact.created_at);
        const thirtyDaysAgo = subDays(new Date(), 30);
        return contactDate && contactDate >= thirtyDaysAgo;
      });
    } else if (period === '90d') {
      return contacts.filter(contact => {
        const contactDate = convertToDate(contact.created_at);
        const ninetyDaysAgo = subDays(new Date(), 90);
        return contactDate && contactDate >= ninetyDaysAgo;
      });
    }
    
    return contacts;
  })();

  // Calcular estatísticas
  const stats = {
    total: filteredContacts.length,
    novos: filteredContacts.filter(c => c.status === 'novo').length,
    contatados: filteredContacts.filter(c => c.status === 'respondido').length,
    qualificados: filteredContacts.filter(c => c.status === 'em_andamento').length,
    fechados: filteredContacts.filter(c => c.status === 'fechado').length,
  };

  // Dados para gráfico de status
  const statusData = [
    { name: 'Novos', value: stats.novos, color: COLORS[2] },
    { name: 'Contatados', value: stats.contatados, color: COLORS[0] },
    { name: 'Qualificados', value: stats.qualificados, color: COLORS[3] },
    { name: 'Fechados', value: stats.fechados, color: COLORS[4] }
  ];

  // Contatos mensais (últimos 6 meses)
  const contatosMensais = () => {
    const meses: { mes: string, total: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesFim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
      
      const contatosDoMes = contacts.filter(contato => {
        const dataCriacao = convertToDate(contato.created_at);
        if (!dataCriacao) return false;
        
        return dataCriacao >= mes && dataCriacao <= mesFim;
      });

      meses.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        total: contatosDoMes.length,
      });
    }
    
    return meses;
  };

  const evolucaoData = contatosMensais();

  // Distribuição por origem - Dados mockados por enquanto
  const origemData = [
    { nome: 'Formulário de Contato', valor: Math.floor(filteredContacts.length * 0.7), color: COLORS[0] },
    { nome: 'Cotação', valor: Math.floor(filteredContacts.length * 0.2), color: COLORS[3] },
    { nome: 'Outros', valor: Math.floor(filteredContacts.length * 0.1), color: COLORS[2] }
  ];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <p>Carregando dados de contatos...</p>
        </div>
      ) : (
        <>
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total de Contatos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.novos}</div>
                <p className="text-sm text-muted-foreground">Novos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{stats.contatados}</div>
                <p className="text-sm text-muted-foreground">Contatados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{stats.qualificados}</div>
                <p className="text-sm text-muted-foreground">Qualificados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">{stats.fechados}</div>
                <p className="text-sm text-muted-foreground">Fechados</p>
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
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <PieChart>
                    <Pie
                      data={origemData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="valor"
                      label={({ nome, valor }) => `${nome}: ${valor}`}
                    >
                      {origemData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Contatos (Últimos 6 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Últimos Contatos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Contatos Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredContacts.length === 0 ? (
                  <p className="text-gray-500">Nenhum contato encontrado no período selecionado</p>
                ) : (
                  filteredContacts.slice(0, 5).map((contato) => (
                    <div key={contato.contact_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{contato.name}</p>
                        <p className="text-sm text-muted-foreground">{contato.email} {contato.phone ? `- ${contato.phone}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          switch(contato.status) {
                            case 'novo': 
                              return <Badge className="bg-yellow-100 text-yellow-800">Novo</Badge>;
                            case 'respondido': 
                              return <Badge className="bg-green-100 text-green-800">Respondido</Badge>;
                            case 'em_andamento': 
                              return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
                            case 'fechado': 
                              return <Badge className="bg-purple-100 text-purple-800">Fechado</Badge>;
                            default:
                              return <Badge variant="outline">{contato.status}</Badge>;
                          }
                        })()}
                        <span className="text-sm text-muted-foreground">{new Date(contato.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ContatosReport;
