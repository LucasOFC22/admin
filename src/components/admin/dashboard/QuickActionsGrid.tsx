
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  UserPlus,
  Eye
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const QuickActionsGrid = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const quickActions = [
    {
      title: 'Ver Cotações',
      description: 'Gerenciar todas as cotações',
      icon: FileText,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      action: () => navigate('/cotacoes')
    },
    {
      title: 'Contatos',
      description: 'Visualizar mensagens de contato',
      icon: MessageCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      action: () => navigate('/contatos')
    },
    {
      title: 'Usuários',
      description: 'Gerenciar usuários do sistema',
      icon: Users,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      action: () => navigate('/usuarios')
    },
    {
      title: 'Chat Online',
      description: 'Atender clientes no chat',
      icon: MessageCircle,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      action: () => navigate('/chat')
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios e métricas',
      icon: BarChart3,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      action: () => navigate('/relatorios')
    },
    {
      title: 'Novo Usuário',
      description: 'Adicionar usuário ao sistema',
      icon: UserPlus,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      action: () => navigate('/usuarios')
    },
    {
      title: 'Configurações',
      description: 'Configurar sistema e chat',
      icon: Settings,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      action: () => navigate('/configuracoes')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-gray-900 ${isMobile ? "text-base" : "text-lg"}`}>
          Ações Rápidas
        </h3>
      </div>
      
      <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group" 
                  onClick={action.action}>
              <CardContent className={isMobile ? "p-4" : "p-6"}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`rounded-full ${action.bgColor} group-hover:scale-110 transition-transform duration-300 ${isMobile ? "p-2" : "p-3"}`}>
                    <action.icon className={`${action.textColor} ${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-gray-900 mb-1 ${isMobile ? "text-sm" : ""}`}>
                      {action.title}
                    </h4>
                    <p className={`text-gray-600 ${isMobile ? "text-xs" : "text-sm"}`}>
                      {isMobile ? action.title.replace('Gerenciar', '').replace('Visualizar', '').replace('Atender', '').replace('Adicionar', '').replace('Configurar', '') : action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsGrid;
