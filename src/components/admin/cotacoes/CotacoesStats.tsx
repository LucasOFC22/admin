import { FileText, Clock, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface CotacoesStatsProps {
  stats: {
    total: number;
    pendentes: number;
    aprovadas: number;
    rejeitadas: number;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const CotacoesStats = ({ stats }: CotacoesStatsProps) => {
  const statItems = [
    { label: 'Total', value: stats.total, icon: FileText },
    { label: 'Pendentes', value: stats.pendentes, icon: Clock, alert: stats.pendentes > 0 },
    { label: 'Aprovadas', value: stats.aprovadas, icon: TrendingUp },
    { label: 'Rejeitadas', value: stats.rejeitadas, icon: Activity }
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {statItems.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden border border-border/60 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
                    <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {stat.label}
                    </p>
                    <p className={`text-lg md:text-2xl font-semibold ${stat.alert ? 'text-destructive' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
                {stat.alert && (
                  <div className="absolute top-3 right-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
