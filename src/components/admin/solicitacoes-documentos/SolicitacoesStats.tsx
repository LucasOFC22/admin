import { Card } from '@/components/ui/card';
import { FileCheck, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SolicitacoesStatsProps {
  stats: {
    total: number;
    pendentes: number;
    em_processamento: number;
    finalizados: number;
    erros: number;
  };
}

export const SolicitacoesStats = ({ stats }: SolicitacoesStatsProps) => {
  const statsData = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Pendentes',
      value: stats.pendentes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Em Processamento',
      value: stats.em_processamento,
      icon: Loader2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Finalizados',
      value: stats.finalizados,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Erros',
      value: stats.erros,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
