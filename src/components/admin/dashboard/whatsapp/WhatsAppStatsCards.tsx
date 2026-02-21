import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Users, 
  UserPlus, 
  Send 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { WhatsAppStats } from '@/hooks/useWhatsAppDashboardStats';

interface WhatsAppStatsCardsProps {
  stats: WhatsAppStats;
  isLoading: boolean;
}

const statsConfig = [
  {
    key: 'emAtendimento',
    label: 'Em Atendimento',
    icon: MessageSquare,
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-500/10 to-green-600/10',
    iconBg: 'bg-emerald-500/20'
  },
  {
    key: 'aguardando',
    label: 'Aguardando',
    icon: Clock,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-500/10 to-yellow-500/10',
    iconBg: 'bg-amber-500/20'
  },
  {
    key: 'finalizados',
    label: 'Finalizados',
    icon: CheckCircle2,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/10 to-indigo-600/10',
    iconBg: 'bg-blue-500/20'
  },
  {
    key: 'atendentesAtivos',
    label: 'Atendentes Ativos',
    icon: Users,
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-500/10 to-violet-600/10',
    iconBg: 'bg-purple-500/20'
  },
  {
    key: 'novosContatos',
    label: 'Novos Contatos',
    icon: UserPlus,
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-500/10 to-rose-600/10',
    iconBg: 'bg-pink-500/20'
  },
  {
    key: 'mensagensEnviadas',
    label: 'Mensagens Enviadas',
    icon: Send,
    gradient: 'from-cyan-500 to-teal-600',
    bgGradient: 'from-cyan-500/10 to-teal-600/10',
    iconBg: 'bg-cyan-500/20'
  }
] as const;

const WhatsAppStatsCards = ({ stats, isLoading }: WhatsAppStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {statsConfig.map((config, index) => {
        const Icon = config.icon;
        const value = stats[config.key as keyof WhatsAppStats];

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${config.bgGradient} hover:shadow-lg transition-all duration-300`}>
              <CardContent className="p-2.5 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${config.iconBg}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-foreground/70`} />
                  </div>
                </div>
                
                {isLoading ? (
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-1" />
                ) : (
                  <p className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                    {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                  </p>
                )}
                
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 sm:mt-1 line-clamp-1">
                  {config.label}
                </p>

                {/* Decorative gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${config.gradient}`} />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default WhatsAppStatsCards;
