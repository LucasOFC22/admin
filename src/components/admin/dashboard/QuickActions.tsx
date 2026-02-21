import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageCircle, 
  Users, 
  BarChart3,
  Settings,
  MessageSquare
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Cotações',
      description: 'Gerenciar cotações',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      path: '/cotacoes'
    },
    {
      title: 'Contatos',
      description: 'Ver mensagens',
      icon: MessageCircle,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      path: '/contatos'
    },
    {
      title: 'Usuários',
      description: 'Gerenciar usuários',
      icon: Users,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      path: '/usuarios'
    },
    {
      title: 'Chat',
      description: 'Atendimento online',
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      path: '/chatinterno'
    },
    {
      title: 'Relatórios',
      description: 'Visualizar métricas',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      path: '/relatorios'
    },
    {
      title: 'Configurações',
      description: 'Ajustes do sistema',
      icon: Settings,
      color: 'bg-gradient-to-br from-gray-500 to-gray-600',
      path: '/configuracoes'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 group border-0 shadow-md"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`rounded-xl ${action.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActions;
