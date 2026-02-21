import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";

interface Activity {
  id: string;
  type: 'contato_novo' | 'chat_aguardando';
  title: string;
  description: string;
  createdAt: Date;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'contato_novo':
      return <MessageCircle className="h-4 w-4" />;
    case 'chat_aguardando':
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'contato_novo':
      return 'bg-purple-500';
    case 'chat_aguardando':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
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

const ActivityTimeline = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const supabase = requireAuthenticatedClient();
        
        // Calcular data de 24 horas atrás
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        // Buscar contatos das últimas 24 horas
        const contatosResult = await supabase
          .from('contatos')
          .select('contact_id, created_at, name, subject')
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        // Buscar chats do WhatsApp aguardando atendimento das últimas 24 horas
        const chatsResult = await supabase
          .from('chats_whatsapp')
          .select('id, criadoem, usuarioid')
          .eq('resolvido', false)
          .eq('mododeatendimento', 'Atendimento Humano')
          .eq('aceitoporadmin', false)
          .gte('criadoem', oneDayAgo.toISOString())
          .order('criadoem', { ascending: false })
          .limit(10);

        // Buscar dados dos contatos separadamente
        const usuarioIds = chatsResult.data?.map(c => c.usuarioid).filter(Boolean) || [];
        const contatosMap: Record<string, { telefone?: string; nome?: string }> = {};
        
        if (usuarioIds.length > 0) {
          const { data: contatosData } = await supabase
            .from('contatos_whatsapp')
            .select('id, telefone, nome')
            .in('id', usuarioIds);
          
          if (contatosData) {
            contatosData.forEach(contato => {
              contatosMap[contato.id] = { telefone: contato.telefone, nome: contato.nome };
            });
          }
        }

        const newActivities: Activity[] = [];

        // Adicionar contatos às atividades
        if (contatosResult.data) {
          contatosResult.data.forEach((contato) => {
            newActivities.push({
              id: `contato-${contato.contact_id}`,
              type: 'contato_novo',
              title: 'Novo contato recebido',
              description: `${contato.name} - ${contato.subject || 'Sem assunto'}`,
              createdAt: new Date(contato.created_at)
            });
          });
        }

        // Adicionar chats aguardando às atividades
        if (chatsResult.data) {
          chatsResult.data.forEach((chat: any) => {
            const contato = contatosMap[chat.usuarioid];
            const telefone = contato?.telefone || 'Número não identificado';
            const nome = contato?.nome || telefone;
            newActivities.push({
              id: `chat-${chat.id}`,
              type: 'chat_aguardando',
              title: 'Chat aguardando atendimento',
              description: `WhatsApp: ${nome}`,
              createdAt: new Date(chat.criadoem)
            });
          });
        }

        // Ordenar por data e limitar a 10 atividades
        newActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setActivities(newActivities.slice(0, 10));
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
    
    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchActivities, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
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
            Nenhuma atividade recente
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`rounded-full p-2 text-white ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
