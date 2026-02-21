import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useUserEmailAccess } from '@/hooks/useUserEmailAccess';
import { 
  FileText, 
  Package,
  MessageCircle, 
  Users, 
  BarChart3,
  Settings,
  MessageSquare,
  DollarSign,
  Shield,
  Mail
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  path: string;
  permission: string;
}

const allActions: QuickAction[] = [
  {
    title: 'Cotações',
    description: 'Gerenciar cotações',
    icon: FileText,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    path: '/cotacoes',
    permission: 'admin.cotacoes.visualizar'
  },
  {
    title: 'Coletas',
    description: 'Gerenciar coletas',
    icon: Package,
    color: 'bg-gradient-to-br from-green-500 to-green-600',
    path: '/coletas',
    permission: 'admin.coletas.visualizar'
  },
  {
    title: 'WhatsApp',
    description: 'Atendimento online',
    icon: MessageSquare,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    path: '/whatsapp',
    permission: 'admin.whatsapp.visualizar'
  },
  {
    title: 'Contatos',
    description: 'Ver mensagens',
    icon: MessageCircle,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    path: '/contatos',
    permission: 'admin.contatos.visualizar'
  },
  {
    title: 'Financeiro',
    description: 'Contas a receber',
    icon: DollarSign,
    color: 'bg-gradient-to-br from-amber-500 to-amber-600',
    path: '/contas-receber',
    permission: 'admin.contas-receber.visualizar'
  },
  {
    title: 'Usuários',
    description: 'Gerenciar usuários',
    icon: Users,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    path: '/gerenciar-usuarios',
    permission: 'admin.usuarios.visualizar'
  },
  {
    title: 'Cargos',
    description: 'Gerenciar cargos',
    icon: Shield,
    color: 'bg-gradient-to-br from-rose-500 to-rose-600',
    path: '/cargos',
    permission: 'admin.cargos.visualizar'
  },
  {
    title: 'Relatórios',
    description: 'Visualizar métricas',
    icon: BarChart3,
    color: 'bg-gradient-to-br from-teal-500 to-teal-600',
    path: '/relatorios',
    permission: 'admin.relatorios.visualizar'
  },
  {
    title: 'Configurações',
    description: 'Ajustes do sistema',
    icon: Settings,
    color: 'bg-gradient-to-br from-gray-500 to-gray-600',
    path: '/configuracoes',
    permission: 'admin.configuracoes.visualizar'
  }
];

// Ação especial do Email (acesso por conta vinculada, não por permissão)
const emailAction = {
  title: 'Email',
  description: 'Gerenciar emails',
  icon: Mail,
  color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  path: '/email-config'
};

const PermissionBasedQuickActions = () => {
  const navigate = useNavigate();
  const { hasPermission, isLoadingCargoPermissions } = usePermissionGuard();
  const { hasAccess: hasEmailAccess, loading: loadingEmailAccess } = useUserEmailAccess();

  if (isLoadingCargoPermissions || loadingEmailAccess) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="rounded-xl bg-muted p-3 w-12 h-12" />
                <div className="space-y-1 w-full">
                  <div className="h-4 bg-muted rounded w-16 mx-auto" />
                  <div className="h-3 bg-muted rounded w-20 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filtrar ações baseado nas permissões do usuário
  const filteredActions = allActions.filter(action => 
    hasPermission(action.permission)
  );

  // Adicionar ação de email se o usuário tiver acesso a alguma conta
  const allFilteredActions = hasEmailAccess 
    ? [...filteredActions, emailAction]
    : filteredActions;

  if (allFilteredActions.length === 0) {
    return null;
  }

  // Determinar grid baseado no número de ações
  const gridCols = allFilteredActions.length <= 3
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
    : allFilteredActions.length <= 5
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {allFilteredActions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 group border-0 shadow-md h-full"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`rounded-xl ${action.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PermissionBasedQuickActions;
