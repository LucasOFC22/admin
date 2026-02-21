import { Card, CardContent } from '@/components/ui/card';
import { ManifestoStats as Stats } from '@/types/manifesto';
import { FileText, Clock, Scale, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/formatters';

interface ManifestoStatsProps {
  stats: Stats;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const ManifestoStats = ({ stats }: ManifestoStatsProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num);
  };

  // formatCurrency imported from @/lib/formatters

  const statsConfig = [
    {
      label: 'Total de Manifestos',
      value: stats.total.toString(),
      icon: FileText,
    },
    {
      label: 'Menos de 24h',
      value: stats.menos24h.toString(),
      icon: Clock,
      alert: stats.menos24h > 0
    },
    {
      label: 'Peso Total',
      value: `${formatNumber(stats.pesoTotal)} kg`,
      icon: Scale,
    },
    {
      label: 'Valor Total',
      value: formatCurrency(stats.valorTotal),
      icon: DollarSign,
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {statsConfig.map((stat, index) => (
        <motion.div key={index} variants={item}>
          <Card className="relative overflow-hidden border border-border/60 bg-card hover:shadow-md transition-all duration-300">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className={`text-lg sm:text-2xl font-semibold tracking-tight truncate ${stat.alert ? 'text-destructive' : 'text-foreground'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="p-1.5 sm:p-2.5 rounded-lg bg-muted/50 shrink-0 ml-2">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
              </div>
              {stat.alert && (
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
