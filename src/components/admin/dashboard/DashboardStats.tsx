import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, FileText, MessageSquare, Users, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, trend, icon: Icon, color, isLoading }: StatCardProps) => {
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="flex items-center text-xs mt-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface DashboardStatsProps {
  stats: {
    totalContatos: number;
    contatosNovos: number;
    contatosRespondidos: number;
    contatosTrend: number;
  };
  isLoading: boolean;
}

const DashboardStats = ({ stats, isLoading }: DashboardStatsProps) => {
  const statsConfig = [
    {
      title: 'Total de Contatos',
      value: stats.totalContatos,
      trend: stats.contatosTrend,
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      title: 'Contatos Novos',
      value: stats.contatosNovos,
      trend: stats.contatosTrend,
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      title: 'Contatos Respondidos',
      value: stats.contatosRespondidos,
      trend: stats.contatosTrend,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      title: 'Usuários Ativos',
      value: stats.totalContatos,
      trend: stats.contatosTrend,
      icon: Users,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
