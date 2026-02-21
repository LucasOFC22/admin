import { Card, CardContent } from '@/components/ui/card';
import { Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContactsStatsProps {
  stats: {
    total: number;
    novos: number;
    em_andamento: number;
    respondidos: number;
    fechados: number;
  };
}

const ContactsStats = ({ stats }: ContactsStatsProps) => {
  const statsData = [
    {
      label: 'Total',
      value: stats.total,
      icon: Mail,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      label: 'Novos',
      value: stats.novos,
      icon: Clock,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      label: 'Em Andamento',
      value: stats.em_andamento,
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600'
    },
    {
      label: 'Respondidos',
      value: stats.respondidos,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      label: 'Fechados',
      value: stats.fechados,
      icon: XCircle,
      color: 'bg-gradient-to-br from-gray-500 to-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ContactsStats;
