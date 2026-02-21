
import { motion } from "framer-motion";
import { Calendar, Clock, LayoutDashboard } from "lucide-react";
import PageHeader from '../PageHeader';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const DashboardHeader = () => {
  const { user } = useUnifiedAuth();
  const userDisplayName = user?.nome || user?.displayName || user?.email?.split('@')[0] || "Usuário";
  
  // Obter a hora do dia para personalizar saudação
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Dashboard' }
  ];

  const timeInfo = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="flex flex-col sm:flex-row gap-4"
    >
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Data</span>
        </div>
        <p className="text-blue-900 font-semibold text-sm capitalize">
          {getCurrentDate()}
        </p>
      </div>
      
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Horário</span>
        </div>
        <p className="text-blue-900 font-semibold text-lg">
          {getCurrentTime()}
        </p>
      </div>
    </motion.div>
  );

  return (
    <PageHeader
      title={`${getGreeting()}, ${userDisplayName}!`}
      subtitle="Bem-vindo ao painel administrativo - Sistema de gestão empresarial integrado"
      icon={LayoutDashboard}
      breadcrumbs={breadcrumbs}
      actions={timeInfo}
    />
  );
};

export default DashboardHeader;
