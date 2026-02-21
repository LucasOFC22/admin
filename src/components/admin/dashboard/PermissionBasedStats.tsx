import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, FileText, Package, MessageSquare, DollarSign, Users, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleStats, PermissionModules, IndividualLoadingStates } from '@/hooks/useDashboardPermissionStats';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
  hideTrend?: boolean;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

const StatCard = ({ title, value, subtitle, trend = 0, hideTrend = false, icon: Icon, color, delay = 0 }: StatCardProps) => {
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
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
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{subtitle}</span>
            {!hideTrend && (
              <div className="flex items-center text-xs">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatCardSkeleton = () => (
  <Card className="border-0 shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </CardContent>
  </Card>
);

interface PermissionBasedStatsProps {
  stats: ModuleStats;
  modules: PermissionModules;
  isLoading: boolean;
  loadingStates?: IndividualLoadingStates;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const PermissionBasedStats = ({ stats, modules, isLoading, loadingStates }: PermissionBasedStatsProps) => {
  // Se permissões ainda estão carregando, mostra skeletons
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards: React.ReactNode[] = [];
  let delay = 0;

  // Card de WhatsApp (Supabase - rápido)
  if (modules.whatsapp) {
    if (loadingStates?.whatsapp) {
      cards.push(<StatCardSkeleton key="whatsapp-loading" />);
    } else if (stats.whatsapp) {
      cards.push(
        <StatCard
          key="whatsapp"
          title="WhatsApp"
          value={stats.whatsapp.aguardando + stats.whatsapp.emAtendimento}
          subtitle={`${stats.whatsapp.aguardando} aguardando`}
          trend={stats.whatsapp.trend}
          icon={MessageSquare}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={delay}
        />
      );
      delay += 0.05;
    }
  }

  // Card de Usuários (Supabase - rápido)
  if (modules.usuarios) {
    if (loadingStates?.usuarios) {
      cards.push(<StatCardSkeleton key="usuarios-loading" />);
    } else if (stats.usuarios) {
      cards.push(
        <StatCard
          key="usuarios"
          title="Usuários"
          value={stats.usuarios.total}
          subtitle={`${stats.usuarios.ativos} ativos`}
          trend={stats.usuarios.trend}
          icon={Users}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          delay={delay}
        />
      );
      delay += 0.05;
    }
  }

  // Card de Contatos (Supabase - rápido)
  if (modules.contatos) {
    if (loadingStates?.contatos) {
      cards.push(<StatCardSkeleton key="contatos-loading" />);
    } else if (stats.contatos) {
      cards.push(
        <StatCard
          key="contatos"
          title="Contatos"
          value={stats.contatos.total}
          subtitle={`${stats.contatos.novos} novos`}
          trend={stats.contatos.trend}
          icon={UserCheck}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          delay={delay}
        />
      );
      delay += 0.05;
    }
  }

  // Card de Cotações (Backend N8N - lento)
  if (modules.cotacoes) {
    if (loadingStates?.cotacoes) {
      cards.push(<StatCardSkeleton key="cotacoes-loading" />);
    } else if (stats.cotacoes) {
      cards.push(
        <StatCard
          key="cotacoes"
          title="Cotações"
          value={stats.cotacoes.total}
          subtitle={`${stats.cotacoes.pendentes} pendentes`}
          trend={stats.cotacoes.trend}
          icon={FileText}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={delay}
        />
      );
      delay += 0.05;
    }
  }

  // Card de Coletas (Backend N8N - lento)
  if (modules.coletas) {
    if (loadingStates?.coletas) {
      cards.push(<StatCardSkeleton key="coletas-loading" />);
    } else if (stats.coletas) {
      cards.push(
        <StatCard
          key="coletas"
          title="Coletas"
          value={stats.coletas.total}
          subtitle={`${stats.coletas.pendentes} pendentes`}
          trend={stats.coletas.trend}
          icon={Package}
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={delay}
        />
      );
      delay += 0.05;
    }
  }

  // Card Financeiro (Backend N8N - lento)
  if (modules.financeiro) {
    if (loadingStates?.financeiro) {
      cards.push(<StatCardSkeleton key="financeiro-loading" />);
    } else if (stats.financeiro) {
      cards.push(
        <StatCard
          key="financeiro-aberto"
          title="Valor em Aberto"
          value={formatCurrency(stats.financeiro.totalReceber)}
          subtitle="Pendente + Atrasado"
          hideTrend
          icon={DollarSign}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          delay={delay}
        />,
        <StatCard
          key="financeiro-atrasado"
          title={`Valor em Atraso (${stats.financeiro.qtdAtrasados})`}
          value={formatCurrency(stats.financeiro.valorAtrasado)}
          subtitle="Títulos vencidos"
          hideTrend
          icon={DollarSign}
          color="bg-gradient-to-br from-red-500 to-red-600"
          delay={delay + 1}
        />
      );
    }
  }

  // Contar quantos módulos o usuário tem permissão
  const permittedModulesCount = Object.values(modules).filter(Boolean).length;

  if (permittedModulesCount === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Você não tem permissão para visualizar estatísticas.
        </p>
      </Card>
    );
  }

  // Determinar grid baseado no número de módulos permitidos
  const gridCols = permittedModulesCount <= 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : permittedModulesCount <= 3 
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards}
    </div>
  );
};

export default PermissionBasedStats;
