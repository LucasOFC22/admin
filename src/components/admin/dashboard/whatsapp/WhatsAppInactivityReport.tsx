import { motion } from 'framer-motion';
import { Clock, TrendingDown, Calendar, User, Phone, Timer, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhatsAppInactivityStats, InactiveChat } from '@/hooks/useWhatsAppInactivityStats';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestamp } from '@/utils/dateFormatters';

const WhatsAppInactivityReport = () => {
  const { stats, chats, isLoading, error } = useWhatsAppInactivityStats();

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar dados de inatividade: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const statsCards = [
    {
      title: 'Hoje',
      value: stats.totalHoje,
      icon: Calendar,
      color: 'from-orange-500 to-amber-600'
    },
    {
      title: 'Esta Semana',
      value: stats.totalSemana,
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600'
    },
    {
      title: 'Este Mês',
      value: stats.totalMes,
      icon: Clock,
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Tempo Médio',
      value: formatMinutes(stats.mediaTempoInatividade),
      icon: Timer,
      color: 'from-blue-500 to-cyan-600',
      isText: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
          <Clock className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold">Relatório de Inatividade</h2>
        <Badge variant="secondary" className="text-xs">
          Encerramentos Automáticos
        </Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {card.isText ? card.value : card.value}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                    <card.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfico de Tendência */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tendência Semanal</CardTitle>
          <CardDescription className="text-xs">
            Encerramentos por inatividade nos últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.historicoSemanal}>
                <defs>
                  <linearGradient id="inactivityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 11 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} encerramentos`, 'Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#inactivityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Chats Encerrados */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Últimos Encerramentos por Inatividade</CardTitle>
          <CardDescription className="text-xs">
            Detalhes dos chats encerrados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum chat encerrado por inatividade neste mês</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {chats.map((chat, index) => (
                  <InactiveChatRow key={chat.id} chat={chat} index={index} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const InactiveChatRow = ({ chat, index }: { chat: InactiveChat; index: number }) => {
  const formatDate = (dateStr: string) => formatTimestamp(dateStr);

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
    >
      {/* Avatar/Icon */}
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center shrink-0">
        <User className="h-5 w-5 text-orange-600" />
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{chat.contatoNome}</p>
          {chat.atendenteNome && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {chat.atendenteNome}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {formatPhone(chat.contatoTelefone)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(chat.encerradoEm)}
          </span>
        </div>
      </div>

      {/* Tempo de Inatividade */}
      <div className="text-right shrink-0">
        <Badge 
          variant="secondary" 
          className={`text-xs ${chat.tempoInatividade > 60 ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}
        >
          <Timer className="h-3 w-3 mr-1" />
          {formatMinutes(chat.tempoInatividade)}
        </Badge>
      </div>
    </motion.div>
  );
};

export default WhatsAppInactivityReport;
