
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  MessageSquare, 
  CheckCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useAdminStats } from '@/hooks/useAdminStats';

const AdminOverviewStats = () => {
  const { notify } = useCustomNotifications();
  const { stats, isLoading, error, refetch } = useAdminStats();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const statsConfig = [
    {
      title: 'Total de Contatos',
      value: stats.totalContatos.toString(),
      change: `${stats.contatosTrend >= 0 ? '+' : ''}${stats.contatosTrend}%`,
      trend: stats.contatosTrend >= 0 ? 'up' : 'down',
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      title: 'Contatos Novos',
      value: stats.contatosNovos.toString(),
      change: `${stats.contatosTrend >= 0 ? '+' : ''}${stats.contatosTrend}%`,
      trend: stats.contatosTrend >= 0 ? 'up' : 'down',
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      title: 'Contatos Respondidos',
      value: stats.contatosRespondidos.toString(),
      change: `${stats.contatosTrend >= 0 ? '+' : ''}${stats.contatosTrend}%`,
      trend: stats.contatosTrend >= 0 ? 'up' : 'down',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Usuários Ativos',
      value: stats.totalContatos.toString(),
      change: `${stats.contatosTrend >= 0 ? '+' : ''}${stats.contatosTrend}%`,
      trend: stats.contatosTrend >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'text-indigo-600'
    }
  ];

  const handleStatClick = (stat: any) => {
    notify.info(
      `Detalhes: ${stat.title}`,
      `Valor atual: ${stat.value} (${stat.change} este mês)`
    );
  };

  const handleRefreshStats = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      notify.success('Dados Atualizados', 'Estatísticas atualizadas com sucesso!');
    } catch (error) {
      notify.error('Erro', 'Erro ao atualizar estatísticas');
    } finally {
      setIsRefreshing(false);
    }
  };


  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Erro ao carregar estatísticas: {error}</p>
          <Button onClick={handleRefreshStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Visão geral do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefreshStats} variant="outline" size="sm" disabled={isLoading || isRefreshing}>
            {isLoading || isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleStatClick(stat)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center text-sm">
                  {!isLoading && (
                    <>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                        {stat.change}
                      </span>
                      <span className="text-gray-500 ml-1">vs mês anterior</span>
                    </>
                  )}
                  {isLoading && (
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverviewStats;
