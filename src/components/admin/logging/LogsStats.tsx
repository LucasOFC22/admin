import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface LogsStatsData { 
  total: number; 
  info?: number; 
  warning?: number; 
  error?: number; 
  critical?: number; 
  success?: number; 
}

interface LogsStatsProps {
  stats: LogsStatsData;
  showLevels?: boolean;
}

export const LogsStats: React.FC<LogsStatsProps> = ({ stats, showLevels = true }) => {
  const statCards = [
    { label: 'Total', value: stats.total, icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10', show: true },
    { label: 'Info', value: stats.info || 0, icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10', show: showLevels && stats.info !== undefined },
    { label: 'Avisos', value: stats.warning || 0, icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', show: showLevels && stats.warning !== undefined },
    { label: 'Erros', value: stats.error || 0, icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', show: showLevels && stats.error !== undefined },
    { label: 'Sucesso', value: stats.success || 0, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', show: stats.success !== undefined }
  ].filter(s => s.show);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LogsStats;
