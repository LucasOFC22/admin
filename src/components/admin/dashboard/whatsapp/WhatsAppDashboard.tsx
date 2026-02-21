import { motion } from 'framer-motion';
import { RefreshCw, MessageSquare, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppDashboardStats } from '@/hooks/useWhatsAppDashboardStats';
import WhatsAppStatsCards from './WhatsAppStatsCards';
import WhatsAppCharts from './WhatsAppCharts';
import WhatsAppMetrics from './WhatsAppMetrics';
import WhatsAppAttendenteTable from './WhatsAppAttendenteTable';
import WhatsAppFilterDialog from './WhatsAppFilterDialog';
import WhatsAppInactivityReport from './WhatsAppInactivityReport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WhatsAppDashboard = () => {
  const {
    stats,
    atendentes,
    statusDistribution,
    filas,
    filters,
    isLoading,
    lastUpdate,
    refetch,
    applyFilters,
    clearFilters
  } = useWhatsAppDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:gap-4"
        >
          {/* Título e Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Dashboard WhatsApp
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Monitoramento de atendimentos em tempo real
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs shrink-0">
              <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 animate-pulse" />
              Ao vivo
            </Badge>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </span>
            
            <div className="flex items-center gap-2">
              <WhatsAppFilterDialog
                filters={filters}
                filas={filas}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
              />

              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="gap-1.5 h-8 px-2 sm:px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs">Atualizar</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cards de Estatísticas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <WhatsAppStatsCards stats={stats} isLoading={isLoading} />
        </motion.section>

        {/* Gráficos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <WhatsAppCharts 
            stats={stats} 
            statusDistribution={statusDistribution} 
            isLoading={isLoading} 
          />
        </motion.section>

        {/* Métricas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <WhatsAppMetrics stats={stats} isLoading={isLoading} />
        </motion.section>

        {/* Tabela de Atendentes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <WhatsAppAttendenteTable atendentes={atendentes} isLoading={isLoading} />
        </motion.section>

        {/* Relatório de Inatividade */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <WhatsAppInactivityReport />
        </motion.section>
      </div>
    </div>
  );
};

export default WhatsAppDashboard;
