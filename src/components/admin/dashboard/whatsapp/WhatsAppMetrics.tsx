import { motion } from 'framer-motion';
import { 
  Send, 
  MessageSquareMore, 
  Clock, 
  Zap,
  TrendingUp,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { WhatsAppStats } from '@/hooks/useWhatsAppDashboardStats';

interface WhatsAppMetricsProps {
  stats: WhatsAppStats;
  isLoading: boolean;
}

const WhatsAppMetrics = ({ stats, isLoading }: WhatsAppMetricsProps) => {
  // Resumo estatístico
  const summaryStats = [
    {
      label: 'Mensagens Enviadas',
      value: stats.mensagensEnviadas,
      icon: Send,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Mensagens Recebidas',
      value: stats.mensagensRecebidas,
      icon: MessageSquareMore,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Tempo Médio Atendimento',
      value: `${stats.tempoMedioAtendimento} min`,
      icon: Clock,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Tempo Primeira Resposta',
      value: `${stats.tempoMedioPrimeiraResposta} min`,
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  // KPIs de desempenho
  const performanceKPIs = [
    {
      label: 'Taxa de Resolução',
      value: stats.taxaResolucao,
      target: 85,
      icon: Target,
      color: stats.taxaResolucao >= 85 ? 'bg-green-500' : stats.taxaResolucao >= 70 ? 'bg-yellow-500' : 'bg-red-500'
    },
    {
      label: 'Eficiência',
      value: Math.min(100, Math.round((stats.finalizados / Math.max(1, stats.finalizados + stats.emAtendimento + stats.aguardando)) * 100)),
      target: 80,
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      label: 'Qualidade',
      value: Math.round(stats.taxaResolucao * 0.9),
      target: 90,
      icon: Award,
      color: 'bg-purple-500'
    },
    {
      label: 'Produtividade',
      value: Math.min(100, Math.round((stats.mensagensEnviadas / Math.max(1, stats.mensagensRecebidas)) * 50 + 50)),
      target: 75,
      icon: BarChart3,
      color: 'bg-cyan-500'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Resumo Estatístico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
          Resumo Estatístico
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {summaryStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`${stat.bgColor} border-0 hover:shadow-md transition-shadow`}>
                  <CardContent className="p-2.5 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-br ${stat.color} shrink-0`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                        ) : (
                          <p className="text-base sm:text-xl font-bold text-foreground truncate">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Métricas de Desempenho */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent-foreground animate-pulse" />
                Métricas de Desempenho
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-normal sm:ml-2">
                Indicadores de qualidade
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {performanceKPIs.map((kpi, index) => {
                const Icon = kpi.icon;
                const isAboveTarget = kpi.value >= kpi.target;
                
                return (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className={`p-1 sm:p-1.5 rounded-md ${kpi.color} shrink-0`}>
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                        <span className="text-[11px] sm:text-sm font-medium text-foreground truncate">{kpi.label}</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold shrink-0 ${isAboveTarget ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isLoading ? '-' : `${kpi.value}%`}
                      </span>
                    </div>
                    
                    {isLoading ? (
                      <Skeleton className="h-1.5 sm:h-2 w-full" />
                    ) : (
                      <div className="relative">
                        <Progress value={kpi.value} className="h-1.5 sm:h-2" />
                        <div 
                          className="absolute top-0 h-1.5 sm:h-2 w-0.5 bg-foreground/50"
                          style={{ left: `${kpi.target}%` }}
                        />
                      </div>
                    )}
                    
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Meta: {kpi.target}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WhatsAppMetrics;
