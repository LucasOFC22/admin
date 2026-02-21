import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, UserCheck, KeyRound,
  MessageCircle, MessageSquare, AlertCircle, MailOpen, Bug, GitBranch, 
  ArrowRight, Users, Contact, Settings, MessagesSquare, Briefcase, Plug, 
  Tag, FileCheck, ListOrdered, AlertTriangle 
} from 'lucide-react';
import { AdminTab } from '@/config/adminSidebarConfig';

// Logs Gerais (existentes)
const logsGerais = [
  { id: 'atividades', title: 'Atividades', description: 'Ações realizadas pelos usuários', icon: UserCheck, route: '/logs-atividades', color: 'blue' },
  { id: 'autenticacao', title: 'Autenticação', description: 'Logins e logouts', icon: KeyRound, route: '/logs-autenticacao', color: 'green' },
  { id: 'email', title: 'Email', description: 'Envios de email', icon: MailOpen, route: '/logs-email', color: 'purple' },
  { id: 'whatsapp', title: 'WhatsApp', description: 'Ações do WhatsApp', icon: MessageCircle, route: '/whatsapp-logs', color: 'green' },
  { id: 'mensagens', title: 'Mensagens Rápidas', description: 'Logs de mensagens', icon: MessageSquare, route: '/logs-mensagens-rapidas', color: 'blue' },
  { id: 'ocorrencias', title: 'Ocorrências', description: 'Alterações em ocorrências', icon: AlertCircle, route: '/logs-ocorrencias', color: 'yellow' },
  { id: 'flows', title: 'FlowBuilders', description: 'Execuções de flows', icon: GitBranch, route: '/flow-logs', color: 'blue' },
  { id: 'erros', title: 'Erros', description: 'Erros do sistema', icon: Bug, route: '/erros', color: 'red' }
];

// Logs Específicos por Módulo (novos)
const logsEspecificos = [
  { id: 'usuarios', title: 'Usuários', description: 'CRUD de usuários', icon: Users, route: '/logs-usuarios', color: 'blue' },
  { id: 'cargos', title: 'Cargos', description: 'Gestão de cargos', icon: Briefcase, route: '/logs-cargos', color: 'purple' },
  { id: 'contatos', title: 'Contatos', description: 'CRUD de contatos', icon: Contact, route: '/logs-contatos', color: 'green' },
  { id: 'configuracoes', title: 'Configurações', description: 'Alterações de config', icon: Settings, route: '/logs-configuracoes', color: 'yellow' },
  { id: 'chat-interno', title: 'Chat Interno', description: 'Mensagens internas', icon: MessagesSquare, route: '/logs-chat-interno', color: 'blue' },
  { id: 'malotes', title: 'Malotes', description: 'Gestão de malotes', icon: Briefcase, route: '/logs-malotes', color: 'yellow' },
  { id: 'conexoes', title: 'Conexões', description: 'API e integrações', icon: Plug, route: '/logs-conexoes', color: 'green' },
  { id: 'tags', title: 'Tags', description: 'CRUD de tags', icon: Tag, route: '/logs-tags', color: 'purple' },
  { id: 'documentos', title: 'Documentos', description: 'Gestão de documentos', icon: FileCheck, route: '/logs-documentos', color: 'blue' },
  { id: 'filas', title: 'Filas WhatsApp', description: 'Filas de atendimento', icon: ListOrdered, route: '/logs-filas', color: 'green' },
  { id: 'sistema', title: 'Sistema', description: 'Logs de sistema', icon: AlertTriangle, route: '/logs-sistema', color: 'red' }
];

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400',
  purple: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400'
};

interface LogCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  onClick: (route: string) => void;
}

const LogCard: React.FC<LogCardProps> = ({ title, description, icon: Icon, route, color, onClick }) => (
  <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]" onClick={() => onClick(route)}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <CardTitle className="text-lg mt-3">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

const LogsCentral: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('logs-central');

  const handleNavigate = (route: string) => navigate(route);

  return (
    <PermissionGuard
      permissions="admin.logs-central.visualizar"
      showMessage={true}
    >
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Logs</h1>
            <p className="text-muted-foreground">Monitore todas as atividades do sistema</p>
          </div>
        </div>

        {/* Logs Gerais */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Logs Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {logsGerais.map((cat) => (
              <LogCard key={cat.id} {...cat} onClick={handleNavigate} />
            ))}
          </div>
        </div>

        {/* Logs Específicos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Logs por Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {logsEspecificos.map((cat) => (
              <LogCard key={cat.id} {...cat} onClick={handleNavigate} />
            ))}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default LogsCentral;
