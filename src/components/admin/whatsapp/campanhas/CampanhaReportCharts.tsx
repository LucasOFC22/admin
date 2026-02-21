import { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Campanha, CampanhaContato } from '@/hooks/useCampanhas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Percent, Clock, CheckCircle2, XCircle, Eye, Send } from 'lucide-react';

interface CampanhaReportChartsProps {
  campanha: Campanha;
  contatos: CampanhaContato[];
}

const COLORS = {
  enviado: '#22c55e',
  entregue: '#3b82f6',
  lido: '#8b5cf6',
  erro: '#ef4444',
  pendente: '#94a3b8',
  enviando: '#f59e0b'
};

const CampanhaReportCharts = ({ campanha, contatos }: CampanhaReportChartsProps) => {
  // Dados para o gráfico de pizza (distribuição de status)
  const pieData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    contatos.forEach(c => {
      const status = c.status;
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || '#94a3b8'
    }));
  }, [contatos]);

  // Dados para o gráfico de linha (evolução ao longo do tempo)
  const lineData = useMemo(() => {
    const contatosComData = contatos
      .filter(c => c.enviado_em)
      .sort((a, b) => new Date(a.enviado_em!).getTime() - new Date(b.enviado_em!).getTime());

    if (contatosComData.length === 0) return [];

    const hourlyData: Record<string, { enviados: number; entregues: number; lidos: number; erros: number }> = {};

    contatosComData.forEach(c => {
      const hora = format(new Date(c.enviado_em!), 'HH:mm', { locale: ptBR });
      if (!hourlyData[hora]) {
        hourlyData[hora] = { enviados: 0, entregues: 0, lidos: 0, erros: 0 };
      }
      
      if (['enviado', 'entregue', 'lido'].includes(c.status)) {
        hourlyData[hora].enviados++;
      }
      if (['entregue', 'lido'].includes(c.status)) {
        hourlyData[hora].entregues++;
      }
      if (c.status === 'lido') {
        hourlyData[hora].lidos++;
      }
      if (['erro', 'falha'].includes(c.status)) {
        hourlyData[hora].erros++;
      }
    });

    return Object.entries(hourlyData).map(([hora, data]) => ({
      hora,
      ...data
    }));
  }, [contatos]);

  // Métricas avançadas
  const metrics = useMemo(() => {
    const total = campanha.total_contatos;
    const enviados = campanha.enviados;
    const entregues = campanha.entregues;
    const lidos = campanha.lidos;
    const erros = campanha.erros;

    const taxaEntrega = enviados > 0 ? ((entregues / enviados) * 100).toFixed(1) : '0';
    const taxaLeitura = entregues > 0 ? ((lidos / entregues) * 100).toFixed(1) : '0';
    const taxaErro = total > 0 ? ((erros / total) * 100).toFixed(1) : '0';
    const taxaSucesso = total > 0 ? (((enviados) / total) * 100).toFixed(1) : '0';

    // Tempo médio de entrega (simulado baseado nos dados)
    const contatosEntregues = contatos.filter(c => c.entregue_em && c.enviado_em);
    let tempoMedioMs = 0;
    if (contatosEntregues.length > 0) {
      const totalMs = contatosEntregues.reduce((acc, c) => {
        const enviado = new Date(c.enviado_em!).getTime();
        const entregue = new Date(c.entregue_em!).getTime();
        return acc + (entregue - enviado);
      }, 0);
      tempoMedioMs = totalMs / contatosEntregues.length;
    }
    const tempoMedioSegundos = Math.round(tempoMedioMs / 1000);

    return {
      taxaEntrega: parseFloat(taxaEntrega),
      taxaLeitura: parseFloat(taxaLeitura),
      taxaErro: parseFloat(taxaErro),
      taxaSucesso: parseFloat(taxaSucesso),
      tempoMedioSegundos
    };
  }, [campanha, contatos]);

  // Dados para gráfico de barras comparativo
  const barData = useMemo(() => [
    { name: 'Total', valor: campanha.total_contatos, fill: '#94a3b8' },
    { name: 'Enviados', valor: campanha.enviados, fill: '#22c55e' },
    { name: 'Entregues', valor: campanha.entregues, fill: '#3b82f6' },
    { name: 'Lidos', valor: campanha.lidos, fill: '#8b5cf6' },
    { name: 'Erros', valor: campanha.erros, fill: '#ef4444' },
  ], [campanha]);

  return (
    <div className="space-y-4">
      {/* Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/10">
                <Send className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Sucesso</p>
                <p className="text-xl font-bold text-green-600">{metrics.taxaSucesso}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Entrega</p>
                <p className="text-xl font-bold text-blue-600">{metrics.taxaEntrega}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Leitura</p>
                <p className="text-xl font-bold text-purple-600">{metrics.taxaLeitura}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Erro</p>
                <p className="text-xl font-bold text-red-600">{metrics.taxaErro}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resumo de Envios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Evolução */}
      {lineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolução do Envio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="enviados" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Enviados"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="entregues" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Entregues"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lidos" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Lidos"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tempo médio de entrega */}
      {metrics.tempoMedioSegundos > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Entrega</p>
                <p className="text-2xl font-bold">
                  {metrics.tempoMedioSegundos < 60 
                    ? `${metrics.tempoMedioSegundos}s`
                    : `${Math.floor(metrics.tempoMedioSegundos / 60)}m ${metrics.tempoMedioSegundos % 60}s`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampanhaReportCharts;
