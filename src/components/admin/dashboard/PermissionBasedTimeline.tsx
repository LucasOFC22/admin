import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageCircle, FileText, Package, DollarSign, UserPlus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";

type ActivityType = 'contato_novo' | 'chat_aguardando' | 'cotacao_nova' | 'coleta_nova' | 'titulo_novo' | 'usuario_novo';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: Date;
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  contato_novo: { icon: MessageCircle, color: 'bg-indigo-500' },
  chat_aguardando: { icon: MessageCircle, color: 'bg-purple-500' },
  cotacao_nova: { icon: FileText, color: 'bg-blue-500' },
  coleta_nova: { icon: Package, color: 'bg-green-500' },
  titulo_novo: { icon: DollarSign, color: 'bg-amber-500' },
  usuario_novo: { icon: UserPlus, color: 'bg-orange-500' },
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}min atrás`;
  return 'Agora';
};

const PermissionBasedTimeline = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { hasPermission, isLoadingCargoPermissions } = usePermissionGuard();

  const fetchActivities = async (showRefreshing = false) => {
    if (isLoadingCargoPermissions) return;

    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const newActivities: Activity[] = [];

      // Buscar contatos (via Supabase - pode atualizar automaticamente)
      const supabase = requireAuthenticatedClient();
      
      if (hasPermission('admin.contatos.visualizar')) {
        try {
          const { data: contatos } = await supabase
            .from('contatos')
            .select('contact_id, created_at, name, subject')
            .gte('created_at', oneDayAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          contatos?.forEach((contato) => {
            newActivities.push({
              id: `contato-${contato.contact_id}`,
              type: 'contato_novo',
              title: 'Novo contato recebido',
              description: `${contato.name} - ${contato.subject || 'Sem assunto'}`,
              createdAt: new Date(contato.created_at)
            });
          });
        } catch (e) {
          console.warn('Erro ao buscar contatos para timeline:', e);
        }
      }

      // Buscar chats WhatsApp (via Supabase - pode atualizar automaticamente)
      if (hasPermission('admin.whatsapp.visualizar')) {
        try {
          const { data: chats } = await supabase
            .from('chats_whatsapp')
            .select('id, criadoem, usuarioid')
            .eq('resolvido', false)
            .eq('mododeatendimento', 'Atendimento Humano')
            .eq('aceitoporadmin', false)
            .gte('criadoem', oneDayAgo.toISOString())
            .order('criadoem', { ascending: false })
            .limit(5);

          // Buscar dados dos contatos
          const usuarioIds = chats?.map(c => c.usuarioid).filter(Boolean) || [];
          const contatosMap: Record<string, { telefone?: string; nome?: string }> = {};
          
          if (usuarioIds.length > 0) {
            const { data: contatosData } = await supabase
              .from('contatos_whatsapp')
              .select('id, telefone, nome')
              .in('id', usuarioIds);
            
            contatosData?.forEach(contato => {
              contatosMap[contato.id] = { telefone: contato.telefone, nome: contato.nome };
            });
          }

          chats?.forEach((chat) => {
            const contato = contatosMap[chat.usuarioid];
            const nome = contato?.nome || contato?.telefone || 'Número não identificado';
            newActivities.push({
              id: `chat-${chat.id}`,
              type: 'chat_aguardando',
              title: 'Chat aguardando atendimento',
              description: `WhatsApp: ${nome}`,
              createdAt: new Date(chat.criadoem)
            });
          });
        } catch (e) {
          console.warn('Erro ao buscar chats para timeline:', e);
        }
      }

      // Ordenar por data e limitar
      newActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActivities(newActivities.slice(0, 10));
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Ref para armazenar a função de fetch sem causar re-renders
  const fetchActivitiesRef = useRef(fetchActivities);
  fetchActivitiesRef.current = fetchActivities;

  useEffect(() => {
    if (!isLoadingCargoPermissions) {
      fetchActivitiesRef.current();
    }
    
    // Atualização automática a cada 2 minutos
    const interval = setInterval(() => fetchActivitiesRef.current(true), 120000);
    return () => clearInterval(interval);
  }, [isLoadingCargoPermissions]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividades Recentes (24h)
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fetchActivitiesRef.current(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isLoadingCargoPermissions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="rounded-full p-2 bg-muted w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma atividade recente</p>
            <p className="text-xs mt-1">WhatsApp e Contatos atualizam automaticamente</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`rounded-full p-2 text-white ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionBasedTimeline;
