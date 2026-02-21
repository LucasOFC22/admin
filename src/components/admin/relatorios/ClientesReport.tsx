
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DateRange } from '@/components/DateRangePicker';
import { getClientes } from '@/services/n8n/clientService';
import { startOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientesReportProps {
  dateRange: DateRange | null;
  period: string;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

// Helper function to convert Firebase Timestamp or Date to Date object
const convertToDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

const ClientesReport = ({ dateRange, period }: ClientesReportProps) => {
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(),
  });

  // Calcular estatísticas
  const stats = {
    total: clientes.length,
    ativos: clientes.filter(c => c.ativo).length,
    comAcesso: clientes.filter(c => c.acessoAreaCliente === true).length,
    suspensos: clientes.filter(c => c.acessoAreaCliente === false).length,
    admins: clientes.filter(c => c.tipo === 'admin').length,
  };

  // Dados para gráfico de status de acesso
  const statusAcessoData = [
    { name: 'Com Acesso', value: stats.comAcesso, color: COLORS[0] },
    { name: 'Suspensos', value: stats.suspensos, color: COLORS[1] }
  ];

  // Dados por tipo
  const tipoData = [
    { name: 'Clientes', value: clientes.filter(c => c.tipo === 'cliente').length, color: COLORS[3] },
    { name: 'Administradores', value: stats.admins, color: COLORS[4] }
  ];

  // Criações mensais (últimos 6 meses)
  const criacoesMensais = () => {
    const meses = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const clientesDoMes = clientes.filter(cliente => {
        const dataCriacao = convertToDate(cliente.dataCriacao);
        if (!dataCriacao) return false;
        
        const mesInicio = startOfMonth(mes);
        const mesFim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
        
        return dataCriacao >= mesInicio && dataCriacao <= mesFim;
      });

      meses.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        total: clientesDoMes.length,
        ativos: clientesDoMes.filter(c => c.ativo).length,
        comAcesso: clientesDoMes.filter(c => c.acessoAreaCliente === true).length
      });
    }
    
    return meses;
  };

  const evolucaoData = criacoesMensais();

  // Lista dos últimos clientes criados
  const ultimosClientes = clientes
    .filter(c => c.dataCriacao)
    .sort((a, b) => {
      const dateA = convertToDate(a.dataCriacao);
      const dateB = convertToDate(b.dataCriacao);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total de Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.comAcesso}</div>
            <p className="text-sm text-muted-foreground">Com Acesso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.suspensos}</div>
            <p className="text-sm text-muted-foreground">Suspensos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <p className="text-sm text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de Acesso */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Acesso à Área Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusAcessoData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusAcessoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tipoData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tipoData.map((entry, index) => (
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
          <CardTitle>Evolução de Clientes (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total" strokeWidth={2} />
              <Line type="monotone" dataKey="ativos" stroke="#10B981" name="Ativos" strokeWidth={2} />
              <Line type="monotone" dataKey="comAcesso" stroke="#8B5CF6" name="Com Acesso" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Últimos Clientes Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Clientes Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ultimosClientes.length === 0 ? (
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            ) : (
              ultimosClientes.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cliente.ativo ? "border-green-200 text-green-700" : "border-gray-200 text-gray-700"}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline" className={cliente.acessoAreaCliente ? "border-blue-200 text-blue-700" : "border-red-200 text-red-700"}>
                      {cliente.acessoAreaCliente ? 'Com Acesso' : 'Suspenso'}
                    </Badge>
                    <Badge variant="outline" className={cliente.tipo === 'admin' ? "border-purple-200 text-purple-700" : "border-gray-200 text-gray-700"}>
                      {cliente.tipo === 'admin' ? 'Admin' : 'Cliente'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientesReport;
