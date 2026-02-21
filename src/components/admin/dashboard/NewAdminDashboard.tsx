import { motion } from 'framer-motion';
import DashboardHeader from './DashboardHeader';
import PermissionBasedStats from './PermissionBasedStats';
import PermissionBasedQuickActions from './PermissionBasedQuickActions';
import PermissionBasedTimeline from './PermissionBasedTimeline';
import DashboardCharts from './DashboardCharts';
import { useDashboardPermissionStats } from '@/hooks/useDashboardPermissionStats';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const NewAdminDashboard = () => {
  const { stats, modules, isLoading, loadingStates, isRefetching, refetch } = useDashboardPermissionStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header com botão de atualizar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema • <span className="text-xs">Dados carregam progressivamente</span>
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            disabled={isRefetching}
            title="Atualiza todos os dados"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>

        {/* Estatísticas Principais - baseadas em permissões */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PermissionBasedStats stats={stats} modules={modules} isLoading={isLoading} loadingStates={loadingStates} />
        </motion.section>

        {/* Gráficos - baseados em permissões */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold mb-4">Visão Geral</h3>
          <DashboardCharts stats={stats} modules={modules} isLoading={isLoading} />
        </motion.section>

        {/* Ações Rápidas - filtradas por permissões */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4">Ações Rápidas</h3>
          <PermissionBasedQuickActions />
        </motion.section>

        {/* Timeline de Atividades - filtrada por permissões */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <PermissionBasedTimeline />
        </motion.section>
      </div>
    </div>
  );
};

export default NewAdminDashboard;
