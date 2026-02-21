import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface UnifiedUsersStatsProps {
  stats: {
    total: number;
    clientes: number;
    admins: number;
    ativos: number;
  };
  loading?: boolean;
}

const UnifiedUsersStats = ({ stats, loading = false }: UnifiedUsersStatsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-12"></div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    { label: 'Total de Usuários', value: stats.total, icon: Users, color: 'text-primary' },
    { label: 'Clientes', value: stats.clientes, icon: UserCheck, color: 'text-blue-500', valueColor: 'text-blue-600' },
    { label: 'Administradores', value: stats.admins, icon: ShieldCheck, color: 'text-purple-500', valueColor: 'text-purple-600' },
    { label: 'Usuários Ativos', value: stats.ativos, icon: CheckCircle, color: 'text-green-500', valueColor: 'text-green-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-3xl font-bold ${stat.valueColor || 'text-foreground'}`}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <div className={`p-3 rounded-full bg-primary/10`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default UnifiedUsersStats;
