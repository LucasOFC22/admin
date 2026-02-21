import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ErroEnvio } from '@/services/n8n/errorService';

interface ErrosStatsProps {
  erros: ErroEnvio[];
}

const ErrosStats = ({ erros }: ErrosStatsProps) => {
  const stats = {
    total: erros.length,
    pendentes: erros.filter(e => e.status === 'pendente').length,
    processando: erros.filter(e => e.status === 'processando').length,
    resolvidos: erros.filter(e => e.status === 'resolvido').length,
    erros: erros.filter(e => e.status === 'erro').length,
  };

  const statCards = [
    {
      title: 'Total de Erros',
      value: stats.total,
      icon: AlertTriangle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Pendentes',
      value: stats.pendentes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Processando',
      value: stats.processando,
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Resolvidos',
      value: stats.resolvidos,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Com Erro',
      value: stats.erros,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ErrosStats;
