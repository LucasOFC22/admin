
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle, Package, User, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface Activity {
  id: string;
  type: 'quote_created' | 'quote_updated' | 'message_sent' | 'user_registered';
  title: string;
  description: string;
  createdAt: Date | null;
  user?: string;
  metadata?: Record<string, any>;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'quote_created',
    title: 'Nova cotação criada',
    description: 'Cotação #COT-2024-001 para São Paulo → Rio de Janeiro',
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    user: 'João Silva',
  },
  {
    id: '2',
    type: 'message_sent',
    title: 'Nova mensagem no chat',
    description: 'Cliente enviou mensagem sobre cotação #COT-2024-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: 'Maria Santos',
  },
  {
    id: '3',
    type: 'quote_updated',
    title: 'Status da cotação atualizado',
    description: 'Cotação #COT-2024-002 marcada como aprovada',
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    user: 'Admin',
  },
  {
    id: '4',
    type: 'user_registered',
    title: 'Novo usuário registrado',
    description: 'Ana Costa criou uma nova conta',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'quote_created':
      return <Package className="h-4 w-4" />;
    case 'quote_updated':
      return <FileText className="h-4 w-4" />;
    case 'message_sent':
      return <MessageCircle className="h-4 w-4" />;
    case 'user_registered':
      return <User className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'quote_created':
      return 'bg-blue-500';
    case 'quote_updated':
      return 'bg-green-500';
    case 'message_sent':
      return 'bg-purple-500';
    case 'user_registered':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimeAgo = (date: Date | null) => {
  if (!date) return 'Data não disponível';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}m atrás`;
  return 'Agora mesmo';
};

const RecentActivitiesWidget = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-corporate-600" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`rounded-full p-2 text-white ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  {activity.user && (
                    <p className="text-xs text-gray-500 mt-1">por {activity.user}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesWidget;
