import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartData, WhatsAppStats } from '@/hooks/useWhatsAppDashboardStats';

interface WhatsAppChartsProps {
  stats: WhatsAppStats;
  statusDistribution: ChartData[];
  isLoading: boolean;
}

const WhatsAppCharts = ({ stats, statusDistribution, isLoading }: WhatsAppChartsProps) => {
  // Dados para o gráfico de barras
  const barData = [
    { name: 'Em Atendimento', value: stats.emAtendimento, fill: 'hsl(142 76% 36%)' },
    { name: 'Aguardando', value: stats.aguardando, fill: 'hsl(48 96% 53%)' },
    { name: 'Finalizados', value: stats.finalizados, fill: 'hsl(217 91% 60%)' },
    { name: 'Novos Contatos', value: stats.novosContatos, fill: 'hsl(330 81% 60%)' }
  ];

  // Cores para o gráfico de pizza
  const COLORS = ['hsl(142 76% 36%)', 'hsl(48 96% 53%)', 'hsl(217 91% 60%)', 'hsl(280 87% 65%)'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-lg font-bold text-primary">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
      {/* Gráfico de Barras - Análise de Atendimentos */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-8"
      >
        <Card className="h-full">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-pulse" />
              Análise de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {isLoading ? (
              <Skeleton className="h-[200px] sm:h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 300}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 640 ? 9 : 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    interval={0}
                    angle={window.innerWidth < 640 ? -45 : 0}
                    textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                    height={window.innerWidth < 640 ? 60 : 30}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 640 ? 10 : 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={window.innerWidth < 640 ? 40 : 60}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Gráfico Donut - Distribuição de Status */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="lg:col-span-4"
      >
        <Card className="h-full">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent-foreground animate-pulse" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {isLoading ? (
              <Skeleton className="h-[200px] sm:h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 220 : 300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={window.innerWidth < 640 ? 40 : 60}
                    outerRadius={window.innerWidth < 640 ? 65 : 90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                    formatter={(value) => (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WhatsAppCharts;
