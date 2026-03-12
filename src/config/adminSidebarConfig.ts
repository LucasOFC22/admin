import { 
  LayoutDashboard, 
  FileText, 
  Truck, 
  Package, 
  FileSearch,
  Mail,
  MessageCircle,
  Kanban,
  Zap,
  Users,
  Tag,
  MessagesSquare,
  Contact,
  FileCheck,
  AlertTriangle,
  Wallet,
  CalendarDays,
  BarChart3,
  Briefcase,
  Shield,
  UserPlus,
  GitBranch,
  Plug,
  Settings,
  Activity,
  UserCheck,
  Cloud,
  KeyRound,
  ShieldAlert,
  Gauge,
  Navigation,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  AlertCircle,
  MailOpen,
  Bug,
  Database,
  ListOrdered,
  Megaphone,
  UserCircle,
  FileDown,
  LucideIcon
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard' 
  | 'email' 
  | 'contacts' 
  | 'cotacoes'
  | 'documentos-clientes'
  | 'whatsapp' 
  | 'whatsapp-kanban'
  | 'filas-whatsapp'
  | 'tags-kanban'
  | 'whatsapp-contatos'
  | 'reports' 
  | 'cliente-acesso' 
  | 'erros-envio'
  | 'usuarios'
  | 'gerenciar-usuarios'
  | 'cargos'
  | 'logs'
  | 'rastreamento'
  
  | 'ranking'
  | 'configuracoes'
  | 'consultar-nfe'
  | 'coletas'
  | 'manifestos'
  | 'malotes'
  | 'erros'
  | 'contas-receber'
  | 'calendario-financeiro'
  | 'dre'
  | 'solicitacoes-documentos'
  | 'baixa-rapida-cte'
  | 'ocorrencias'
  | 'mensagens-rapidas'
  | 'chat-interno'
  | 'solicitacoes-acessos'
  | 'conexoes'
  | 'flowbuilders'
  | 'whatsapp-logs'
  | 'logs-atividades'
  | 'logs-mensagens-rapidas'
  | 'logs-ocorrencias'
  | 'logs-central'
  | 'logs-autenticacao'
  | 'logs-email'
  | 'flow-logs'
  // Novos logs específicos
  | 'logs-usuarios'
  | 'logs-contatos'
  | 'logs-configuracoes'
  | 'logs-chat-interno'
  | 'logs-malotes'
  | 'logs-flow-builder'
  | 'logs-conexoes'
  | 'logs-cargos'
  | 'logs-tags'
  | 'logs-documentos'
  | 'logs-filas'
  | 'logs-sistema'
  | 'campanhas-whatsapp'
  | 'logs-campanhas'
  | 'vagas'
  | 'logs-vagas'
  | 'auditoria-seguranca';

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: string;
}

export interface MenuCategoryConfig {
  id: string;
  label: string;
  items: MenuItemConfig[];
}

// Mapeamento de IDs para tabs
export const tabMapping: Record<string, AdminTab> = {
  'dashboard': 'dashboard',
  'email': 'email',
  'contacts': 'contacts',
  'cotacoes': 'cotacoes',
  'whatsapp': 'whatsapp',
  'whatsapp-kanban': 'whatsapp-kanban',
  'filas-whatsapp': 'filas-whatsapp',
  'tags-kanban': 'tags-kanban',
  'whatsapp-contatos': 'whatsapp-contatos',
  'reports': 'reports',
  'cliente-acesso': 'cliente-acesso',
  'erros-envio': 'erros-envio',
  'usuarios': 'usuarios',
  'gerenciar-usuarios': 'gerenciar-usuarios',
  'cargos': 'cargos',
  'logs': 'logs',
  'rastreamento': 'rastreamento',
  
  'ranking': 'ranking',
  'configuracoes': 'configuracoes',
  'consultar-nfe': 'consultar-nfe',
  'coletas': 'coletas',
  'manifestos': 'manifestos',
  'malotes': 'malotes',
  'erros': 'erros',
  'contas-receber': 'contas-receber',
  'calendario-financeiro': 'calendario-financeiro',
  'dre': 'dre',
  'solicitacoes-documentos': 'solicitacoes-documentos',
  'documentos-clientes': 'documentos-clientes',
  'baixa-rapida-cte': 'baixa-rapida-cte',
  'ocorrencias': 'ocorrencias',
  'mensagens-rapidas': 'mensagens-rapidas',
  'chat-interno': 'chat-interno',
  'solicitacoes-acessos': 'solicitacoes-acessos',
  'conexoes': 'conexoes',
  'flowbuilders': 'flowbuilders',
  'whatsapp-logs': 'whatsapp-logs',
  'logs-atividades': 'logs-atividades',
  'logs-mensagens-rapidas': 'logs-mensagens-rapidas',
  'logs-ocorrencias': 'logs-ocorrencias',
  'logs-central': 'logs-central',
  'logs-autenticacao': 'logs-autenticacao',
  'logs-email': 'logs-email',
  'flow-logs': 'flow-logs',
  // Logs específicos
  'logs-usuarios': 'logs-usuarios',
  'logs-contatos': 'logs-contatos',
  'logs-configuracoes': 'logs-configuracoes',
  'logs-chat-interno': 'logs-chat-interno',
  'logs-malotes': 'logs-malotes',
  'logs-flow-builder': 'logs-flow-builder',
  'logs-conexoes': 'logs-conexoes',
  'logs-cargos': 'logs-cargos',
  'logs-tags': 'logs-tags',
  'logs-documentos': 'logs-documentos',
  'logs-filas': 'logs-filas',
  'logs-sistema': 'logs-sistema',
  'campanhas-whatsapp': 'campanhas-whatsapp',
  'logs-campanhas': 'logs-campanhas',
  'vagas': 'vagas',
  'logs-vagas': 'logs-vagas'
};

// Nova estrutura reorganizada do menu
export const menuCategories: MenuCategoryConfig[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    id: 'operacional',
    label: 'Operacional',
    items: [
      { id: 'cotacoes', label: 'Cotações', icon: FileText, requiredPermission: 'admin.cotacoes.visualizar' },
      { id: 'coletas', label: 'Coletas', icon: Truck, requiredPermission: 'admin.coletas.visualizar' },
      { id: 'manifestos', label: 'Manifestos', icon: Package, requiredPermission: 'admin.manifestos.visualizar' },
      { id: 'consultar-nfe', label: 'Consultar NF-e', icon: FileSearch, requiredPermission: 'admin.nfe.visualizar' },
      { id: 'rastreamento', label: 'Rastreamento', icon: Navigation, requiredPermission: 'admin.rastreamento.visualizar' },
      { id: 'baixa-rapida-cte', label: 'Baixa Rápida CT-e', icon: FileDown, requiredPermission: 'admin.baixa_rapida.visualizar' }
    ]
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    items: [
      { id: 'email', label: 'E-mail', icon: Mail, requiredPermission: 'email.visualizar' },
      { id: 'whatsapp', label: 'Atendimento', icon: MessageCircle, requiredPermission: 'whatsapp.visualizar' },
      { id: 'whatsapp-kanban', label: 'Kanban', icon: Kanban, requiredPermission: 'whatsapp.kanban' },
      { id: 'campanhas-whatsapp', label: 'Campanhas', icon: Megaphone, requiredPermission: 'campanhas.visualizar' },
      { id: 'mensagens-rapidas', label: 'Mensagens Rápidas', icon: Zap, requiredPermission: 'mensagens_rapidas.visualizar' },
      { id: 'whatsapp-contatos', label: 'Contatos WhatsApp', icon: Users, requiredPermission: 'whatsapp.contatos' },
      { id: 'tags-kanban', label: 'Tags', icon: Tag, requiredPermission: 'whatsapp.tags' },
      { id: 'chat-interno', label: 'Chat Interno', icon: MessagesSquare, requiredPermission: 'chat_interno.visualizar' }
    ]
  },
  {
    id: 'clientes',
    label: 'Clientes',
    items: [
      { id: 'contacts', label: 'Contatos', icon: Contact, requiredPermission: 'contatos.visualizar' },
      { id: 'solicitacoes-documentos', label: 'Solicitações Docs', icon: FileCheck, requiredPermission: 'documentos.visualizar' },
      { id: 'documentos-clientes', label: 'Repositório Docs', icon: FolderOpen, requiredPermission: 'admin.documentos-clientes.visualizar' },
      { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle, requiredPermission: 'ocorrencias.visualizar' }
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [
      { id: 'contas-receber', label: 'Contas a Receber', icon: Wallet, requiredPermission: 'financeiro.contas_receber' },
      { id: 'calendario-financeiro', label: 'Calendário', icon: CalendarDays, requiredPermission: 'financeiro.calendario' },
      { id: 'dre', label: 'DRE', icon: BarChart3, requiredPermission: 'financeiro.dre' },
      { id: 'malotes', label: 'Malotes', icon: Briefcase, requiredPermission: 'malotes.visualizar' }
    ]
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      { id: 'gerenciar-usuarios', label: 'Usuários', icon: Users, requiredPermission: 'usuarios.visualizar' },
      { id: 'cargos', label: 'Cargos', icon: Shield, requiredPermission: 'cargos.visualizar' },
      { id: 'solicitacoes-acessos', label: 'Solicitações', icon: UserPlus, requiredPermission: 'solicitacoes.visualizar' },
      { id: 'vagas', label: 'Vagas de Emprego', icon: UserCircle, requiredPermission: 'vagas.visualizar' }
    ]
  },
  {
    id: 'automacao',
    label: 'Automação',
    items: [
      { id: 'flowbuilders', label: 'FlowBuilders', icon: GitBranch, requiredPermission: 'flowbuilders.visualizar' },
      { id: 'conexoes', label: 'Conexões', icon: Plug, requiredPermission: 'conexoes.visualizar' },
      { id: 'configuracoes', label: 'Configurações', icon: Settings, requiredPermission: 'configuracoes.visualizar' }
    ]
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    items: [
      { id: 'logs-central', label: 'Central de Logs', icon: Activity, requiredPermission: 'logs.central' },
      { id: 'logs-atividades', label: 'Atividades', icon: UserCheck, requiredPermission: 'logs.atividades' },
      { id: 'logs-autenticacao', label: 'Autenticação', icon: KeyRound, requiredPermission: 'logs.autenticacao' },
      { id: 'whatsapp-logs', label: 'WhatsApp', icon: MessageCircle, requiredPermission: 'logs.whatsapp' },
      { id: 'logs-campanhas', label: 'Campanhas', icon: Megaphone, requiredPermission: 'logs.campanhas' },
      { id: 'logs-mensagens-rapidas', label: 'Mensagens', icon: MessageSquare, requiredPermission: 'logs.mensagens' },
      { id: 'logs-ocorrencias', label: 'Ocorrências', icon: AlertCircle, requiredPermission: 'logs.ocorrencias' },
      { id: 'logs-email', label: 'Email', icon: MailOpen, requiredPermission: 'logs.email' },
      { id: 'flow-logs', label: 'FlowBuilders', icon: GitBranch, requiredPermission: 'logs.flows' },
      { id: 'erros', label: 'Erros', icon: Bug, requiredPermission: 'logs.erros' }
    ]
  },
  {
    id: 'logs-modulos',
    label: 'Logs por Módulo',
    items: [
      { id: 'logs-usuarios', label: 'Gerenciador de Usuários', icon: Users, requiredPermission: 'logs.usuarios' },
      { id: 'logs-cargos', label: 'Cargos', icon: Briefcase, requiredPermission: 'logs.cargos' },
      { id: 'logs-vagas', label: 'Vagas de Emprego', icon: UserCircle, requiredPermission: 'logs.vagas' },
      { id: 'logs-contatos', label: 'Contatos', icon: Contact, requiredPermission: 'logs.contatos' },
      { id: 'logs-configuracoes', label: 'Configurações', icon: Settings, requiredPermission: 'logs.configuracoes' },
      { id: 'logs-chat-interno', label: 'Chat Interno', icon: MessagesSquare, requiredPermission: 'logs.chat_interno' },
      { id: 'logs-malotes', label: 'Malotes', icon: Briefcase, requiredPermission: 'logs.malotes' },
      { id: 'logs-conexoes', label: 'Conexões', icon: Plug, requiredPermission: 'logs.conexoes' },
      { id: 'logs-tags', label: 'Tags', icon: Tag, requiredPermission: 'logs.tags' },
      { id: 'logs-documentos', label: 'Documentos', icon: FileCheck, requiredPermission: 'logs.documentos' },
      { id: 'logs-filas', label: 'Filas WhatsApp', icon: ListOrdered, requiredPermission: 'logs.filas' },
      { id: 'logs-sistema', label: 'Sistema', icon: AlertTriangle, requiredPermission: 'logs.sistema' }
    ]
  }
];
