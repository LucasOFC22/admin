import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

interface OcorrenciasStatsProps {
  stats: {
    total: number;
    pendentes: number;
    em_analise: number;
    resolvidas: number;
    canceladas: number;
  };
}

const OcorrenciasStats = ({ stats }: OcorrenciasStatsProps) => {
  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: AlertTriangle,
      color: 'text-primary'
    },
    {
      title: 'Pendentes',
      value: stats.pendentes,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Em Análise',
      value: stats.em_analise,
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Resolvidas',
      value: stats.resolvidas,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      title: 'Canceladas',
      value: stats.canceladas,
      icon: XCircle,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className="p-2 rounded-full bg-primary/10">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OcorrenciasStats;
