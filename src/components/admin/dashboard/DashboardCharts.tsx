import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleStats, PermissionModules } from '@/hooks/useDashboardPermissionStats';
import { FileText, Package, MessageSquare, DollarSign } from 'lucide-react';

interface DashboardChartsProps {
  stats: ModuleStats;
  modules: PermissionModules;
  isLoading: boolean;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};

const ChartSkeleton = () => (
  <Card className="h-[300px]">
    <CardHeader>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-48 w-full" />
    </CardContent>
  </Card>
);

const DashboardCharts = ({ stats, modules, isLoading }: DashboardChartsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const hasAnyChart = modules.cotacoes || modules.coletas || modules.whatsapp || modules.financeiro;

  if (!hasAnyChart) {
    return null;
  }

  // Dados para gráfico de Cotações (Pizza)
  const cotacoesData = stats.cotacoes ? [
    { name: 'Pendentes', value: stats.cotacoes.pendentes, color: COLORS.warning },
    { name: 'Aprovadas', value: stats.cotacoes.aprovadas, color: COLORS.success },
    { name: 'Outras', value: stats.cotacoes.total - stats.cotacoes.pendentes - stats.cotacoes.aprovadas, color: COLORS.info },
  ].filter(d => d.value > 0) : [];

  // Dados para gráfico de Coletas (Barras)
  const coletasData = stats.coletas ? [
    { name: 'Pendentes', valor: stats.coletas.pendentes, fill: COLORS.warning },
    { name: 'Realizadas', valor: stats.coletas.realizadas, fill: COLORS.success },
  ] : [];

  // Dados para gráfico de WhatsApp (Barras Horizontal)
  const whatsappData = stats.whatsapp ? [
    { name: 'Aguardando', valor: stats.whatsapp.aguardando, fill: COLORS.warning },
    { name: 'Em Atendimento', valor: stats.whatsapp.emAtendimento, fill: COLORS.purple },
    { name: 'Finalizados', valor: stats.whatsapp.finalizados, fill: COLORS.success },
  ] : [];

  // Dados para gráfico Financeiro (Barras por semana)
  const financeiroData = stats.financeiro ? [
    { 
      name: 'Semana Passada', 
      valorAberto: stats.financeiro.semanaPassada?.valorAberto || 0, 
      valorAtrasado: stats.financeiro.semanaPassada?.valorAtrasado || 0 
    },
    { 
      name: 'Semana Atual', 
      valorAberto: stats.financeiro.semanaAtual?.valorAberto || 0, 
      valorAtrasado: stats.financeiro.semanaAtual?.valorAtrasado || 0 
    },
    { 
      name: 'Próxima Semana', 
      valorAberto: stats.financeiro.proximaSemana?.valorAberto || 0, 
      valorAtrasado: stats.financeiro.proximaSemana?.valorAtrasado || 0 
    },
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Cotações */}
      {modules.cotacoes && stats.cotacoes && cotacoesData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Distribuição de Cotações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={cotacoesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {cotacoesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Qtd']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráfico de Coletas */}
      {modules.coletas && stats.coletas && coletasData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                Status das Coletas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={coletasData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Qtd']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráfico de WhatsApp */}
      {modules.whatsapp && stats.whatsapp && whatsappData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Atendimentos WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={whatsappData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Chats']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráfico Financeiro */}
      {modules.financeiro && stats.financeiro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-500" />
                Títulos a Receber por Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={financeiroData} barGap={2}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                      ''
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="valorAberto" 
                    name="Em Aberto" 
                    fill={COLORS.info} 
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                  <Bar 
                    dataKey="valorAtrasado" 
                    name="Atrasado" 
                    fill={COLORS.danger} 
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardCharts;
