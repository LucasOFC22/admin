import { PermissionGroup } from '@/types/permissions';
import { 
  BarChart3, 
  FileText, 
  Package, 
  Users, 
  Building2, 
  MessageCircle, 
  Settings, 
  Activity, 
  UserCheck, 
  Receipt,
  Truck,
  AlertTriangle,
  Database,
  FileCheck,
  Mail,
  FileSearch
} from 'lucide-react';

export const permissionsMap: PermissionGroup[] = [
  {
    category: 'WhatsApp Notas',
    icon: 'StickyNote',
    description: 'Notas internas do chat WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp.notas.editar',
        name: 'Editar Notas de Outros',
        description: 'Editar notas internas criadas por outros usuários',
        action: 'edit',
        resource: 'notas-whatsapp',
        category: 'WhatsApp Notas',
        enabled: true
      },
      {
        id: 'admin.whatsapp.notas.excluir',
        name: 'Excluir Notas de Outros',
        description: 'Excluir notas internas criadas por outros usuários',
        action: 'delete',
        resource: 'notas-whatsapp',
        category: 'WhatsApp Notas',
        enabled: true
      },
      {
        id: 'admin.whatsapp.notas.ver_historico_contato',
        name: 'Ver Notas de Chats Antigos',
        description: 'Visualizar notas de outros chats do mesmo contato',
        action: 'view',
        resource: 'notas-whatsapp',
        category: 'WhatsApp Notas',
        enabled: true
      }
    ]
  },
  {
    category: 'Dashboard',
    icon: 'BarChart3',
    description: 'Permissões relacionadas ao painel principal',
    permissions: [
      {
        id: 'admin.dashboard.visualizar',
        name: 'Visualizar Dashboard',
        description: 'Acesso à página de dashboard',
        action: 'view',
        resource: 'dashboard',
        category: 'Dashboard',
        enabled: true
      }
    ]
  },
  {
    category: 'Cotações',
    icon: 'FileText',
    description: 'Gerenciamento de cotações e propostas',
    permissions: [
      {
        id: 'admin.cotacoes.visualizar',
        name: 'Visualizar Cotações',
        description: 'Acessar página de cotações',
        action: 'view',
        resource: 'cotacoes',
        category: 'Cotações',
        enabled: true
      },
      {
        id: 'admin.cotacoes.criar',
        name: 'Criar Cotações',
        description: 'Criar novas cotações',
        action: 'create',
        resource: 'cotacoes',
        category: 'Cotações',
        enabled: true
      },
      {
        id: 'admin.cotacoes.editar',
        name: 'Editar Cotações',
        description: 'Editar cotações existentes',
        action: 'edit',
        resource: 'cotacoes',
        category: 'Cotações',
        enabled: true
      },
      {
        id: 'admin.cotacoes.excluir',
        name: 'Excluir Cotações',
        description: 'Excluir cotações',
        action: 'delete',
        resource: 'cotacoes',
        category: 'Cotações',
        enabled: true
      },
      {
        id: 'admin.cotacoes.exportar',
        name: 'Exportar Cotações',
        description: 'Exportar dados de cotações',
        action: 'export',
        resource: 'cotacoes',
        category: 'Cotações',
        enabled: true
      }
    ]
  },
  {
    category: 'Coletas',
    icon: 'Package',
    description: 'Gerenciamento de coletas e entregas',
    permissions: [
      {
        id: 'admin.coletas.visualizar',
        name: 'Visualizar Coletas',
        description: 'Acessar página de coletas',
        action: 'view',
        resource: 'coletas',
        category: 'Coletas',
        enabled: true
      },
      {
        id: 'admin.coletas.criar',
        name: 'Criar Coletas',
        description: 'Criar novas coletas',
        action: 'create',
        resource: 'coletas',
        category: 'Coletas',
        enabled: true
      },
      {
        id: 'admin.coletas.editar',
        name: 'Editar Coletas',
        description: 'Editar coletas existentes',
        action: 'edit',
        resource: 'coletas',
        category: 'Coletas',
        enabled: true
      },
      {
        id: 'admin.coletas.excluir',
        name: 'Excluir Coletas',
        description: 'Excluir coletas',
        action: 'delete',
        resource: 'coletas',
        category: 'Coletas',
        enabled: true
      },
      {
        id: 'admin.coletas.pdf',
        name: 'Baixar PDF',
        description: 'Baixar PDF das coletas',
        action: 'export',
        resource: 'coletas',
        category: 'Coletas',
        enabled: true
      }
    ]
  },
  {
    category: 'Manifestos',
    icon: 'Truck',
    description: 'Gerenciamento de manifestos de transporte',
    permissions: [
      {
        id: 'admin.manifestos.visualizar',
        name: 'Visualizar Manifestos',
        description: 'Acesso à página de manifestos',
        action: 'view',
        resource: 'manifestos',
        category: 'Manifestos',
        enabled: true
      },
      {
        id: 'admin.manifestos.pdf',
        name: 'Baixar PDF',
        description: 'Baixar PDF dos manifestos',
        action: 'export',
        resource: 'manifestos',
        category: 'Manifestos',
        enabled: true
      },
      {
        id: 'admin.manifestos.todas-empresas',
        name: 'Ver Todas Empresas',
        description: 'Visualizar manifestos de todas as empresas',
        action: 'view',
        resource: 'manifestos',
        category: 'Manifestos',
        enabled: true
      }
    ]
  },
  {
    category: 'Rastreamento',
    icon: 'Navigation',
    description: 'Rastreamento de mercadorias',
    permissions: [
      {
        id: 'admin.rastreamento.visualizar',
        name: 'Visualizar Rastreamento',
        description: 'Acessar página de rastreamento de mercadorias',
        action: 'view',
        resource: 'rastreamento',
        category: 'Rastreamento',
        enabled: true
      }
    ]
  },
  {
    category: 'Consultar NF-e',
    icon: 'FileSearch',
    description: 'Consulta e download de documentos fiscais (CT-e/NF-e)',
    permissions: [
      {
        id: 'admin.nfe.visualizar',
        name: 'Visualizar NF-e',
        description: 'Acessar página de consulta NF-e',
        action: 'view',
        resource: 'nfe',
        category: 'Consultar NF-e',
        enabled: true
      },
      {
        id: 'admin.nfe.pdf',
        name: 'Baixar PDF',
        description: 'Baixar arquivos PDF de CT-e',
        action: 'export',
        resource: 'nfe',
        category: 'Consultar NF-e',
        enabled: true
      },
      {
        id: 'admin.nfe.xml',
        name: 'Baixar XML',
        description: 'Baixar arquivos XML de CT-e',
        action: 'export',
        resource: 'nfe',
        category: 'Consultar NF-e',
        enabled: true
      },
      {
        id: 'admin.nfe.imprimir',
        name: 'Imprimir PDF',
        description: 'Imprimir documentos PDF de CT-e',
        action: 'export',
        resource: 'nfe',
        category: 'Consultar NF-e',
        enabled: true
      },
      {
        id: 'admin.nfe.exportar',
        name: 'Exportar CSV',
        description: 'Exportar resultados em CSV',
        action: 'export',
        resource: 'nfe',
        category: 'Consultar NF-e',
        enabled: true
      }
    ]
  },
  {
    category: 'Atendimento',
    icon: 'MessageCircle',
    description: 'Chat e atendimento via WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp.visualizar',
        name: 'Visualizar WhatsApp',
        description: 'Acessar página de chat WhatsApp',
        action: 'view',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.enviar',
        name: 'Enviar Mensagens',
        description: 'Enviar mensagens no WhatsApp',
        action: 'create',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.ver_conversas_outros',
        name: 'Ver Conversas de Outros',
        description: 'Visualizar conversas de outros atendentes',
        action: 'view',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.transferir',
        name: 'Transferir Conversas',
        description: 'Transferir conversas entre atendentes',
        action: 'edit',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.finalizar',
        name: 'Finalizar Atendimento',
        description: 'Finalizar atendimentos de conversas',
        action: 'edit',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.finalizar-silencioso',
        name: 'Encerrar Silenciosamente',
        description: 'Encerrar tickets sem enviar mensagem ao cliente',
        action: 'edit',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.historico',
        name: 'Ver Histórico',
        description: 'Visualizar histórico completo de conversas',
        action: 'view',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.exportar',
        name: 'Exportar Conversas',
        description: 'Exportar conversas e histórico',
        action: 'export',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.ignorar',
        name: 'Ignorar Atendimento',
        description: 'Ignorar tickets pendentes (marca como resolvido)',
        action: 'edit',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      },
      {
        id: 'admin.whatsapp.aceitar',
        name: 'Aceitar Atendimento',
        description: 'Aceitar tickets para atendimento',
        action: 'edit',
        resource: 'whatsapp',
        category: 'Atendimento',
        enabled: true
      }
    ]
  },
  {
    category: 'Kanban',
    icon: 'MessageCircle',
    description: 'Kanban de atendimento WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp-kanban.visualizar',
        name: 'Visualizar Kanban',
        description: 'Acessar página de kanban WhatsApp',
        action: 'view',
        resource: 'whatsapp-kanban',
        category: 'Kanban',
        enabled: true
      },
      {
        id: 'admin.whatsapp-kanban.mover',
        name: 'Mover Cards',
        description: 'Mover cards entre colunas do kanban',
        action: 'edit',
        resource: 'whatsapp-kanban',
        category: 'Kanban',
        enabled: true
      }
    ]
  },
  {
    category: 'Filas',
    icon: 'MessageCircle',
    description: 'Gerenciamento de filas de atendimento WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp.filas.visualizar',
        name: 'Visualizar Filas',
        description: 'Acessar página de filas WhatsApp',
        action: 'view',
        resource: 'filas-whatsapp',
        category: 'Filas',
        enabled: true
      },
      {
        id: 'admin.whatsapp.filas.criar',
        name: 'Criar Filas',
        description: 'Criar novas filas de atendimento',
        action: 'create',
        resource: 'filas-whatsapp',
        category: 'Filas',
        enabled: true
      },
      {
        id: 'admin.whatsapp.filas.editar',
        name: 'Editar Filas',
        description: 'Editar filas existentes',
        action: 'edit',
        resource: 'filas-whatsapp',
        category: 'Filas',
        enabled: true
      },
      {
        id: 'admin.whatsapp.filas.excluir',
        name: 'Excluir Filas',
        description: 'Excluir filas de atendimento',
        action: 'delete',
        resource: 'filas-whatsapp',
        category: 'Filas',
        enabled: true
      }
    ]
  },
  {
    category: 'Mensagens rápidas',
    icon: 'MessageCircle',
    description: 'Gerenciamento de mensagens rápidas',
    permissions: [
      {
        id: 'admin.mensagens-rapidas.visualizar',
        name: 'Visualizar Mensagens Rápidas',
        description: 'Acessar página de mensagens rápidas',
        action: 'view',
        resource: 'mensagens-rapidas',
        category: 'Mensagens rápidas',
        enabled: true
      },
      {
        id: 'admin.mensagens-rapidas.criar',
        name: 'Criar Mensagens Rápidas',
        description: 'Criar novas mensagens rápidas',
        action: 'create',
        resource: 'mensagens-rapidas',
        category: 'Mensagens rápidas',
        enabled: true
      },
      {
        id: 'admin.mensagens-rapidas.editar',
        name: 'Editar Mensagens Rápidas',
        description: 'Editar mensagens rápidas existentes',
        action: 'edit',
        resource: 'mensagens-rapidas',
        category: 'Mensagens rápidas',
        enabled: true
      },
      {
        id: 'admin.mensagens-rapidas.excluir',
        name: 'Excluir Mensagens Rápidas',
        description: 'Excluir mensagens rápidas',
        action: 'delete',
        resource: 'mensagens-rapidas',
        category: 'Mensagens rápidas',
        enabled: true
      }
    ]
  },
  {
    category: 'Contatos WhatsApp',
    icon: 'MessageCircle',
    description: 'Gerenciamento de contatos WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp.contatos.visualizar',
        name: 'Visualizar Contatos WhatsApp',
        description: 'Visualizar contatos do WhatsApp',
        action: 'view',
        resource: 'contatos-whatsapp',
        category: 'Contatos WhatsApp',
        enabled: true
      },
      {
        id: 'admin.whatsapp.contatos.criar',
        name: 'Criar Contatos WhatsApp',
        description: 'Criar contatos no WhatsApp',
        action: 'create',
        resource: 'contatos-whatsapp',
        category: 'Contatos WhatsApp',
        enabled: true
      },
      {
        id: 'admin.whatsapp.contatos.editar',
        name: 'Editar Contatos WhatsApp',
        description: 'Editar contatos do WhatsApp',
        action: 'edit',
        resource: 'contatos-whatsapp',
        category: 'Contatos WhatsApp',
        enabled: true
      },
      {
        id: 'admin.whatsapp.contatos.importar',
        name: 'Importar Contatos',
        description: 'Importar contatos em massa',
        action: 'import',
        resource: 'contatos-whatsapp',
        category: 'Contatos WhatsApp',
        enabled: true
      },
      {
        id: 'admin.whatsapp.contatos.exportar',
        name: 'Exportar Contatos WhatsApp',
        description: 'Exportar contatos do WhatsApp',
        action: 'export',
        resource: 'contatos-whatsapp',
        category: 'Contatos WhatsApp',
        enabled: true
      }
    ]
  },
  {
    category: 'Tags',
    icon: 'Package',
    description: 'Gerenciamento de tags do kanban',
    permissions: [
      {
        id: 'admin.tags-kanban.visualizar',
        name: 'Visualizar Tags',
        description: 'Visualizar tags do kanban',
        action: 'view',
        resource: 'tags-kanban',
        category: 'Tags',
        enabled: true
      },
      {
        id: 'admin.tags-kanban.criar',
        name: 'Criar Tags',
        description: 'Criar novas tags',
        action: 'create',
        resource: 'tags-kanban',
        category: 'Tags',
        enabled: true
      },
      {
        id: 'admin.tags-kanban.editar',
        name: 'Editar Tags',
        description: 'Editar tags existentes',
        action: 'edit',
        resource: 'tags-kanban',
        category: 'Tags',
        enabled: true
      },
      {
        id: 'admin.tags-kanban.excluir',
        name: 'Excluir Tags',
        description: 'Excluir tags',
        action: 'delete',
        resource: 'tags-kanban',
        category: 'Tags',
        enabled: true
      }
    ]
  },
  {
    category: 'Chat Interno',
    icon: 'MessageSquare',
    description: 'Chat interno entre usuários do sistema',
    permissions: [
      {
        id: 'admin.chat-interno.visualizar',
        name: 'Visualizar Chat Interno',
        description: 'Acessar página de chat interno',
        action: 'view',
        resource: 'chat-interno',
        category: 'Chat Interno',
        enabled: true
      },
      {
        id: 'admin.chat-interno.enviar',
        name: 'Enviar Mensagens',
        description: 'Enviar mensagens no chat interno',
        action: 'create',
        resource: 'chat-interno',
        category: 'Chat Interno',
        enabled: true
      }
    ]
  },
  {
    category: 'Contatos',
    icon: 'UserCheck',
    description: 'Gerenciamento de contatos e clientes',
    permissions: [
      {
        id: 'admin.contatos.visualizar',
        name: 'Visualizar Contatos',
        description: 'Acessar página de contatos',
        action: 'view',
        resource: 'contatos',
        category: 'Contatos',
        enabled: true
      },
      {
        id: 'admin.contatos.responder',
        name: 'Responder Contatos',
        description: 'Responder mensagens de contato',
        action: 'edit',
        resource: 'contatos',
        category: 'Contatos',
        enabled: true
      },
      {
        id: 'admin.contatos.excluir',
        name: 'Excluir Contatos',
        description: 'Excluir mensagens de contato',
        action: 'delete',
        resource: 'contatos',
        category: 'Contatos',
        enabled: true
      }
    ]
  },
  {
    category: 'Solicitação Documentos',
    icon: 'FileCheck',
    description: 'Gerenciamento de solicitações de documentos',
    permissions: [
      {
        id: 'admin.solicitacoes-documentos.visualizar',
        name: 'Visualizar Solicitações',
        description: 'Acessar página de solicitações de documentos',
        action: 'view',
        resource: 'solicitacoes-documentos',
        category: 'Solicitação Documentos',
        enabled: true
      },
      {
        id: 'admin.solicitacoes-documentos.criar',
        name: 'Criar Solicitações',
        description: 'Criar novas solicitações de documentos',
        action: 'create',
        resource: 'solicitacoes-documentos',
        category: 'Solicitação Documentos',
        enabled: true
      },
      {
        id: 'admin.solicitacoes-documentos.editar',
        name: 'Editar Solicitações',
        description: 'Editar solicitações existentes',
        action: 'edit',
        resource: 'solicitacoes-documentos',
        category: 'Solicitação Documentos',
        enabled: true
      },
      {
        id: 'admin.solicitacoes-documentos.excluir',
        name: 'Excluir Solicitações',
        description: 'Excluir solicitações de documentos',
        action: 'delete',
        resource: 'solicitacoes-documentos',
        category: 'Solicitação Documentos',
        enabled: true
      }
    ]
  },
  {
    category: 'Repositório Documentos',
    icon: 'FolderOpen',
    description: 'Gerenciamento do repositório de documentos para clientes',
    permissions: [
      {
        id: 'admin.documentos-clientes.visualizar',
        name: 'Visualizar Repositório',
        description: 'Acessar repositório de documentos dos clientes',
        action: 'view',
        resource: 'documentos-clientes',
        category: 'Repositório Documentos',
        enabled: true
      },
      {
        id: 'admin.documentos-clientes.criar',
        name: 'Criar Documentos',
        description: 'Fazer upload de novos documentos',
        action: 'create',
        resource: 'documentos-clientes',
        category: 'Repositório Documentos',
        enabled: true
      },
      {
        id: 'admin.documentos-clientes.editar',
        name: 'Editar Documentos',
        description: 'Editar informações de documentos',
        action: 'edit',
        resource: 'documentos-clientes',
        category: 'Repositório Documentos',
        enabled: true
      },
      {
        id: 'admin.documentos-clientes.excluir',
        name: 'Excluir Documentos',
        description: 'Excluir documentos do repositório',
        action: 'delete',
        resource: 'documentos-clientes',
        category: 'Repositório Documentos',
        enabled: true
      }
    ]
  },
  {
    category: 'Ocorrências',
    icon: 'AlertCircle',
    description: 'Gerenciamento de ocorrências e problemas reportados',
    permissions: [
      {
        id: 'admin.ocorrencias.visualizar',
        name: 'Visualizar Ocorrências',
        description: 'Acessar página de ocorrências',
        action: 'view',
        resource: 'ocorrencias',
        category: 'Ocorrências',
        enabled: true
      },
      {
        id: 'admin.ocorrencias.criar',
        name: 'Criar Ocorrências',
        description: 'Criar novas ocorrências',
        action: 'create',
        resource: 'ocorrencias',
        category: 'Ocorrências',
        enabled: true
      },
      {
        id: 'admin.ocorrencias.editar',
        name: 'Editar Ocorrências',
        description: 'Editar ocorrências existentes',
        action: 'edit',
        resource: 'ocorrencias',
        category: 'Ocorrências',
        enabled: true
      },
      {
        id: 'admin.ocorrencias.excluir',
        name: 'Excluir Ocorrências',
        description: 'Excluir ocorrências',
        action: 'delete',
        resource: 'ocorrencias',
        category: 'Ocorrências',
        enabled: true
      },
      {
        id: 'admin.ocorrencias.alterar_status',
        name: 'Alterar Status',
        description: 'Alterar status de ocorrências',
        action: 'edit',
        resource: 'ocorrencias',
        category: 'Ocorrências',
        enabled: true
      }
    ]
  },
  {
    category: 'Contas a Receber',
    icon: 'FileText',
    description: 'Gerenciamento de contas a receber',
    permissions: [
      {
        id: 'admin.contas-receber.visualizar',
        name: 'Visualizar Contas a Receber',
        description: 'Acessar página de contas a receber',
        action: 'view',
        resource: 'contas-receber',
        category: 'Contas a Receber',
        enabled: true
      },
      {
        id: 'admin.contas-receber.criar',
        name: 'Criar Contas',
        description: 'Criar novas contas a receber',
        action: 'create',
        resource: 'contas-receber',
        category: 'Contas a Receber',
        enabled: true
      },
      {
        id: 'admin.contas-receber.editar',
        name: 'Editar Contas',
        description: 'Editar contas a receber existentes',
        action: 'edit',
        resource: 'contas-receber',
        category: 'Contas a Receber',
        enabled: true
      },
      {
        id: 'admin.contas-receber.excluir',
        name: 'Excluir Contas',
        description: 'Excluir contas a receber',
        action: 'delete',
        resource: 'contas-receber',
        category: 'Contas a Receber',
        enabled: true
      },
      {
        id: 'admin.contas-receber.exportar',
        name: 'Exportar Contas',
        description: 'Exportar dados de contas a receber',
        action: 'export',
        resource: 'contas-receber',
        category: 'Contas a Receber',
        enabled: true
      }
    ]
  },
  {
    category: 'Malotes',
    icon: 'FileText',
    description: 'Gerenciamento de malotes',
    permissions: [
      {
        id: 'admin.malotes.visualizar',
        name: 'Visualizar Malotes',
        description: 'Acessar página de malotes',
        action: 'view',
        resource: 'malotes',
        category: 'Malotes',
        enabled: true
      },
      {
        id: 'admin.malotes.criar',
        name: 'Criar Malotes',
        description: 'Criar novos malotes',
        action: 'create',
        resource: 'malotes',
        category: 'Malotes',
        enabled: true
      },
      {
        id: 'admin.malotes.editar',
        name: 'Editar Malotes',
        description: 'Editar malotes existentes',
        action: 'edit',
        resource: 'malotes',
        category: 'Malotes',
        enabled: true
      },
      {
        id: 'admin.malotes.excluir',
        name: 'Excluir Malotes',
        description: 'Excluir malotes',
        action: 'delete',
        resource: 'malotes',
        category: 'Malotes',
        enabled: true
      }
    ]
  },
  {
    category: 'Gerenciar Usuários',
    icon: 'Users',
    description: 'Gerenciamento de usuários do sistema',
    permissions: [
      {
        id: 'admin.usuarios.visualizar',
        name: 'Visualizar Usuários',
        description: 'Acessar página de usuários',
        action: 'view',
        resource: 'usuarios',
        category: 'Gerenciar Usuários',
        enabled: true
      },
      {
        id: 'admin.usuarios.criar',
        name: 'Criar Usuários',
        description: 'Criar novos usuários',
        action: 'create',
        resource: 'usuarios',
        category: 'Gerenciar Usuários',
        enabled: true
      },
      {
        id: 'admin.usuarios.editar',
        name: 'Editar Usuários',
        description: 'Editar usuários existentes',
        action: 'edit',
        resource: 'usuarios',
        category: 'Gerenciar Usuários',
        enabled: true
      },
      {
        id: 'admin.usuarios.excluir',
        name: 'Excluir Usuários',
        description: 'Excluir usuários',
        action: 'delete',
        resource: 'usuarios',
        category: 'Gerenciar Usuários',
        enabled: true,
        critical: true
      }
    ]
  },
  {
    category: 'Cargos',
    icon: 'Building2',
    description: 'Gerenciamento de cargos e departamentos',
    permissions: [
      {
        id: 'admin.cargos.visualizar',
        name: 'Visualizar Cargos',
        description: 'Acessar página de cargos',
        action: 'view',
        resource: 'cargos',
        category: 'Cargos',
        enabled: true
      },
      {
        id: 'admin.cargos.criar',
        name: 'Criar Cargos',
        description: 'Criar novos cargos',
        action: 'create',
        resource: 'cargos',
        category: 'Cargos',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.cargos.editar',
        name: 'Editar Cargos',
        description: 'Editar cargos existentes',
        action: 'edit',
        resource: 'cargos',
        category: 'Cargos',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.cargos.excluir',
        name: 'Excluir Cargos',
        description: 'Excluir cargos',
        action: 'delete',
        resource: 'cargos',
        category: 'Cargos',
        enabled: true,
        critical: true
      }
    ]
  },
  {
    category: 'Solicitações de Acesso',
    icon: 'UserCheck',
    description: 'Gerenciamento de solicitações de acesso ao sistema',
    permissions: [
      {
        id: 'admin.solicitacoes-acessos.visualizar',
        name: 'Visualizar Solicitações de Acesso',
        description: 'Acessar página de solicitações de acesso',
        action: 'view',
        resource: 'solicitacoes-acessos',
        category: 'Solicitações de Acesso',
        enabled: true
      },
      {
        id: 'admin.solicitacoes-acessos.excluir',
        name: 'Excluir Solicitações de Acesso',
        description: 'Excluir solicitações de acesso',
        action: 'delete',
        resource: 'solicitacoes-acessos',
        category: 'Solicitações de Acesso',
        enabled: true
      }
    ]
  },
  {
    category: 'FlowBuilders',
    icon: 'Workflow',
    description: 'Gerenciamento de fluxos de automação',
    permissions: [
      {
        id: 'admin.flowbuilders.visualizar',
        name: 'Visualizar FlowBuilders',
        description: 'Acessar página de flowbuilders',
        action: 'view',
        resource: 'flowbuilders',
        category: 'FlowBuilders',
        enabled: true
      },
      {
        id: 'admin.flowbuilders.criar',
        name: 'Criar Fluxos',
        description: 'Criar novos fluxos de automação',
        action: 'create',
        resource: 'flowbuilders',
        category: 'FlowBuilders',
        enabled: true
      },
      {
        id: 'admin.flowbuilders.editar',
        name: 'Editar Fluxos',
        description: 'Editar fluxos existentes',
        action: 'edit',
        resource: 'flowbuilders',
        category: 'FlowBuilders',
        enabled: true
      },
      {
        id: 'admin.flowbuilders.excluir',
        name: 'Excluir Fluxos',
        description: 'Excluir fluxos de automação',
        action: 'delete',
        resource: 'flowbuilders',
        category: 'FlowBuilders',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.flowbuilders.executar',
        name: 'Executar Fluxos',
        description: 'Executar fluxos de automação',
        action: 'manage',
        resource: 'flowbuilders',
        category: 'FlowBuilders',
        enabled: true
      }
    ]
  },
  {
    category: 'Conexões',
    icon: 'Network',
    description: 'Gerenciamento de conexões e integrações',
    permissions: [
      {
        id: 'admin.conexoes.visualizar',
        name: 'Visualizar Conexões',
        description: 'Acessar página de conexões',
        action: 'view',
        resource: 'conexoes',
        category: 'Conexões',
        enabled: true
      },
      {
        id: 'admin.conexoes.criar',
        name: 'Criar Conexões',
        description: 'Criar novas conexões',
        action: 'create',
        resource: 'conexoes',
        category: 'Conexões',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.conexoes.editar',
        name: 'Editar Conexões',
        description: 'Editar conexões existentes',
        action: 'edit',
        resource: 'conexoes',
        category: 'Conexões',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.conexoes.excluir',
        name: 'Excluir Conexões',
        description: 'Excluir conexões',
        action: 'delete',
        resource: 'conexoes',
        category: 'Conexões',
        enabled: true,
        critical: true
      }
    ]
  },
  {
    category: 'Configurações',
    icon: 'Settings',
    description: 'Configurações gerais do sistema',
    permissions: [
      {
        id: 'admin.configuracoes.visualizar',
        name: 'Visualizar Configurações',
        description: 'Acessar página de configurações',
        action: 'view',
        resource: 'configuracoes',
        category: 'Configurações',
        enabled: true
      },
      {
        id: 'admin.configuracoes.editar',
        name: 'Editar Configurações',
        description: 'Alterar configurações do sistema',
        action: 'edit',
        resource: 'configuracoes',
        category: 'Configurações',
        enabled: true,
        critical: true
      }
    ]
  },
  {
    category: 'Erros',
    icon: 'Activity',
    description: 'Registros de erros do sistema',
    permissions: [
      {
        id: 'admin.erros.visualizar',
        name: 'Visualizar Erros',
        description: 'Acessar página de logs de erros',
        action: 'view',
        resource: 'erros',
        category: 'Erros',
        enabled: true
      },
      {
        id: 'admin.erros.editar',
        name: 'Editar Erros',
        description: 'Editar status de erros (marcar como resolvido)',
        action: 'edit',
        resource: 'erros',
        category: 'Erros',
        enabled: true
      },
      {
        id: 'admin.erros.excluir',
        name: 'Excluir Erros',
        description: 'Excluir registros de erros',
        action: 'delete',
        resource: 'erros',
        category: 'Erros',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.erros.exportar',
        name: 'Exportar Erros',
        description: 'Exportar logs de erros',
        action: 'export',
        resource: 'erros',
        category: 'Erros',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs de Atividade',
    icon: 'Activity',
    description: 'Logs de atividades do sistema',
    permissions: [
      {
        id: 'admin.logs-atividades.visualizar',
        name: 'Visualizar Logs',
        description: 'Acessar página de logs de atividade',
        action: 'view',
        resource: 'logs-atividades',
        category: 'Logs de Atividade',
        enabled: true
      },
      {
        id: 'admin.logs-atividades.exportar',
        name: 'Exportar Logs',
        description: 'Exportar logs de atividade',
        action: 'export',
        resource: 'logs-atividades',
        category: 'Logs de Atividade',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Mensagens Rápidas',
    icon: 'MessageSquare',
    description: 'Logs de alterações em mensagens rápidas',
    permissions: [
      {
        id: 'admin.logs-mensagens-rapidas.visualizar',
        name: 'Visualizar Logs',
        description: 'Acessar página de logs de mensagens rápidas',
        action: 'view',
        resource: 'logs-mensagens-rapidas',
        category: 'Logs Mensagens Rápidas',
        enabled: true
      },
      {
        id: 'admin.logs-mensagens-rapidas.exportar',
        name: 'Exportar Logs',
        description: 'Exportar logs de mensagens rápidas',
        action: 'export',
        resource: 'logs-mensagens-rapidas',
        category: 'Logs Mensagens Rápidas',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Ocorrências',
    icon: 'FileWarning',
    description: 'Logs de alterações em ocorrências',
    permissions: [
      {
        id: 'admin.logs-ocorrencias.visualizar',
        name: 'Visualizar Logs',
        description: 'Acessar página de logs de ocorrências',
        action: 'view',
        resource: 'logs-ocorrencias',
        category: 'Logs Ocorrências',
        enabled: true
      },
      {
        id: 'admin.logs-ocorrencias.exportar',
        name: 'Exportar Logs',
        description: 'Exportar logs de ocorrências',
        action: 'export',
        resource: 'logs-ocorrencias',
        category: 'Logs Ocorrências',
        enabled: true
      }
    ]
  },
  {
    category: 'Empresas',
    icon: 'Building2',
    description: 'Acesso a empresas específicas do sistema',
    permissions: [
      {
        id: 'admin.empresas.fp-transcargas-190',
        name: 'FP TRANSCARGAS LTDA (190)',
        description: 'Acesso à empresa FP TRANSCARGAS LTDA - CNPJ 05805337000190',
        action: 'view',
        resource: 'empresas',
        category: 'Empresas',
        enabled: true
      },
      {
        id: 'admin.empresas.fp-transcargas-270',
        name: 'FP TRANSCARGAS LTDA (270)',
        description: 'Acesso à empresa FP TRANSCARGAS LTDA - CNPJ 05805337000270',
        action: 'view',
        resource: 'empresas',
        category: 'Empresas',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs WhatsApp',
    icon: 'MessageCircle',
    description: 'Logs de comunicação WhatsApp',
    permissions: [
      {
        id: 'admin.whatsapp-logs.visualizar',
        name: 'Visualizar Logs WhatsApp',
        description: 'Acessar página de logs do WhatsApp',
        action: 'view',
        resource: 'whatsapp-logs',
        category: 'Logs WhatsApp',
        enabled: true
      },
      {
        id: 'admin.whatsapp-logs.exportar',
        name: 'Exportar Logs WhatsApp',
        description: 'Exportar logs do WhatsApp',
        action: 'export',
        resource: 'whatsapp-logs',
        category: 'Logs WhatsApp',
        enabled: true
      }
    ]
  },
  {
    category: 'Cliente: Documentos',
    icon: 'FolderOpen',
    description: 'Documentos disponíveis para o cliente',
    area: 'cliente',
    permissions: [
      {
        id: 'clientes.documentos.visualizar',
        name: 'Visualizar Documentos',
        description: 'Acessar página de documentos',
        action: 'view',
        resource: 'cliente-documentos',
        category: 'Cliente: Documentos',
        enabled: true
      },
      {
        id: 'clientes.documentos.baixar',
        name: 'Baixar Documentos',
        description: 'Fazer download de documentos',
        action: 'export',
        resource: 'cliente-documentos',
        category: 'Cliente: Documentos',
        enabled: true
      }
    ]
  },
  {
    category: 'Cliente: Dashboard',
    icon: 'BarChart3',
    description: 'Dashboard e visão geral do cliente',
    permissions: [
      {
        id: 'clientes.dashboard.visualizar',
        name: 'Visualizar Dashboard',
        description: 'Acesso ao dashboard do painel de cliente',
        action: 'view',
        resource: 'cliente-dashboard',
        category: 'Cliente: Dashboard',
        enabled: true
      },
      {
        id: 'clientes.dashboard.fretes',
        name: 'Visualizar Fretes',
        description: 'Visualizar fretes dos últimos 7, 15 e 30 dias no dashboard',
        action: 'view',
        resource: 'cliente-dashboard',
        category: 'Cliente: Dashboard',
        enabled: true
      }
    ]
  },
  {
    category: 'Cliente: Cotações',
    icon: 'FileText',
    description: 'Cotações e propostas do cliente',
    permissions: [
      {
        id: 'clientes.cotacoes.visualizar',
        name: 'Visualizar Minhas Cotações',
        description: 'Acessar página de cotações do cliente',
        action: 'view',
        resource: 'cliente-cotacoes',
        category: 'Cliente: Cotações',
        enabled: true
      },
      {
        id: 'clientes.cotacoes.criar',
        name: 'Criar Cotações',
        description: 'Criar novas cotações no painel do cliente',
        action: 'create',
        resource: 'cliente-cotacoes',
        category: 'Cliente: Cotações',
        enabled: true
      },
      {
        id: 'clientes.cotacoes.exportar',
        name: 'Exportar Cotações',
        description: 'Exportar dados das cotações do cliente',
        action: 'export',
        resource: 'cliente-cotacoes',
        category: 'Cliente: Cotações',
        enabled: true
      }
    ]
  },
  {
    category: 'Cliente: Coletas',
    icon: 'Package',
    description: 'Coletas e solicitações do cliente',
    permissions: [
      {
        id: 'clientes.coletas.visualizar',
        name: 'Visualizar Minhas Coletas',
        description: 'Acessar página de coletas do cliente',
        action: 'view',
        resource: 'cliente-coletas',
        category: 'Cliente: Coletas',
        enabled: true
      },
      {
        id: 'clientes.coletas.criar',
        name: 'Criar Coletas',
        description: 'Criar novas solicitações de coleta',
        action: 'create',
        resource: 'cliente-coletas',
        category: 'Cliente: Coletas',
        enabled: true
      },
      {
        id: 'clientes.coletas.exportar',
        name: 'Exportar Coletas',
        description: 'Exportar dados das coletas do cliente',
        action: 'export',
        resource: 'cliente-coletas',
        category: 'Cliente: Coletas',
        enabled: true
      }
    ]
  },
  {
    category: 'Cliente: Financeiro',
    icon: 'Receipt',
    description: 'Financeiro e faturas do cliente',
    permissions: [
      {
        id: 'clientes.financeiro.visualizar',
        name: 'Visualizar Financeiro',
        description: 'Acessar página de financeiro do cliente',
        action: 'view',
        resource: 'cliente-financeiro',
        category: 'Cliente: Financeiro',
        enabled: true
      },
      {
        id: 'clientes.financeiro.boletos',
        name: 'Visualizar Boletos',
        description: 'Visualizar e baixar boletos',
        action: 'view',
        resource: 'cliente-financeiro',
        category: 'Cliente: Financeiro',
        enabled: true
      },
      {
        id: 'clientes.financeiro.faturas',
        name: 'Visualizar Faturas',
        description: 'Visualizar faturas e histórico',
        action: 'view',
        resource: 'cliente-financeiro',
        category: 'Cliente: Financeiro',
        enabled: true
      },
      {
        id: 'clientes.financeiro.exportar',
        name: 'Exportar Financeiro',
        description: 'Exportar dados financeiros do cliente',
        action: 'export',
        resource: 'cliente-financeiro',
        category: 'Cliente: Financeiro',
        enabled: true
      }
    ]
  },
  {
    category: 'DRE',
    icon: 'BarChart3',
    description: 'Demonstrativo de Resultado do Exercício',
    permissions: [
      {
        id: 'admin.dre.visualizar',
        name: 'Visualizar DRE',
        description: 'Acessar página de DRE',
        action: 'view',
        resource: 'dre',
        category: 'DRE',
        enabled: true
      },
      {
        id: 'admin.dre.exportar',
        name: 'Exportar DRE',
        description: 'Exportar dados do DRE (CSV/PDF)',
        action: 'export',
        resource: 'dre',
        category: 'DRE',
        enabled: true
      },
      {
        id: 'admin.dre.analise-ia',
        name: 'Análise com IA',
        description: 'Usar análise com inteligência artificial',
        action: 'manage',
        resource: 'dre',
        category: 'DRE',
        enabled: true
      }
    ]
  },
  {
    category: 'Calendário Financeiro',
    icon: 'Receipt',
    description: 'Calendário de receitas e despesas',
    permissions: [
      {
        id: 'admin.calendario-financeiro.visualizar',
        name: 'Visualizar Calendário Financeiro',
        description: 'Acessar página do calendário financeiro',
        action: 'view',
        resource: 'calendario-financeiro',
        category: 'Calendário Financeiro',
        enabled: true
      },
      {
        id: 'admin.calendario-financeiro.exportar',
        name: 'Exportar Calendário Financeiro',
        description: 'Exportar dados do calendário (CSV/PDF)',
        action: 'export',
        resource: 'calendario-financeiro',
        category: 'Calendário Financeiro',
        enabled: true
      }
    ]
  },
  // ==================== LOGS E MONITORAMENTO ====================
  {
    category: 'Central de Logs',
    icon: 'Activity',
    description: 'Acesso geral ao sistema de logs',
    permissions: [
      {
        id: 'admin.logs-central.visualizar',
        name: 'Visualizar Central de Logs',
        description: 'Acessar página central de logs',
        action: 'view',
        resource: 'logs-central',
        category: 'Central de Logs',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Autenticação',
    icon: 'KeyRound',
    description: 'Logs de logins e logouts',
    permissions: [
      {
        id: 'admin.logs-autenticacao.visualizar',
        name: 'Visualizar Logs de Autenticação',
        description: 'Acessar página de logs de autenticação',
        action: 'view',
        resource: 'logs-autenticacao',
        category: 'Logs Autenticação',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.logs-autenticacao.exportar',
        name: 'Exportar Logs de Autenticação',
        description: 'Exportar logs de autenticação',
        action: 'export',
        resource: 'logs-autenticacao',
        category: 'Logs Autenticação',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Email',
    icon: 'MailOpen',
    description: 'Logs de envios de email',
    permissions: [
      {
        id: 'admin.logs-email.visualizar',
        name: 'Visualizar Logs de Email',
        description: 'Acessar página de logs de email',
        action: 'view',
        resource: 'logs-email',
        category: 'Logs Email',
        enabled: true
      },
      {
        id: 'admin.logs-email.exportar',
        name: 'Exportar Logs de Email',
        description: 'Exportar logs de email',
        action: 'export',
        resource: 'logs-email',
        category: 'Logs Email',
        enabled: true
      }
    ]
  },
  {
    category: 'Flow Logs',
    icon: 'GitBranch',
    description: 'Logs de execução de FlowBuilders',
    permissions: [
      {
        id: 'admin.flow-logs.visualizar',
        name: 'Visualizar Flow Logs',
        description: 'Acessar página de logs de FlowBuilders',
        action: 'view',
        resource: 'flow-logs',
        category: 'Flow Logs',
        enabled: true
      },
      {
        id: 'admin.flow-logs.exportar',
        name: 'Exportar Flow Logs',
        description: 'Exportar logs de FlowBuilders',
        action: 'export',
        resource: 'flow-logs',
        category: 'Flow Logs',
        enabled: true
      }
    ]
  },
  // ==================== LOGS POR MÓDULO ====================
  {
    category: 'Logs Usuários',
    icon: 'Users',
    description: 'Logs de CRUD de usuários',
    permissions: [
      {
        id: 'admin.logs-usuarios.visualizar',
        name: 'Visualizar Logs de Usuários',
        description: 'Acessar página de logs de usuários',
        action: 'view',
        resource: 'logs-usuarios',
        category: 'Logs Usuários',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.logs-usuarios.exportar',
        name: 'Exportar Logs de Usuários',
        description: 'Exportar logs de usuários',
        action: 'export',
        resource: 'logs-usuarios',
        category: 'Logs Usuários',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Cargos',
    icon: 'Briefcase',
    description: 'Logs de gestão de cargos',
    permissions: [
      {
        id: 'admin.logs-cargos.visualizar',
        name: 'Visualizar Logs de Cargos',
        description: 'Acessar página de logs de cargos',
        action: 'view',
        resource: 'logs-cargos',
        category: 'Logs Cargos',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.logs-cargos.exportar',
        name: 'Exportar Logs de Cargos',
        description: 'Exportar logs de cargos',
        action: 'export',
        resource: 'logs-cargos',
        category: 'Logs Cargos',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Contatos',
    icon: 'Contact',
    description: 'Logs de CRUD de contatos',
    permissions: [
      {
        id: 'admin.logs-contatos.visualizar',
        name: 'Visualizar Logs de Contatos',
        description: 'Acessar página de logs de contatos',
        action: 'view',
        resource: 'logs-contatos',
        category: 'Logs Contatos',
        enabled: true
      },
      {
        id: 'admin.logs-contatos.exportar',
        name: 'Exportar Logs de Contatos',
        description: 'Exportar logs de contatos',
        action: 'export',
        resource: 'logs-contatos',
        category: 'Logs Contatos',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Configurações',
    icon: 'Settings',
    description: 'Logs de alterações de configurações',
    permissions: [
      {
        id: 'admin.logs-configuracoes.visualizar',
        name: 'Visualizar Logs de Configurações',
        description: 'Acessar página de logs de configurações',
        action: 'view',
        resource: 'logs-configuracoes',
        category: 'Logs Configurações',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.logs-configuracoes.exportar',
        name: 'Exportar Logs de Configurações',
        description: 'Exportar logs de configurações',
        action: 'export',
        resource: 'logs-configuracoes',
        category: 'Logs Configurações',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Chat Interno',
    icon: 'MessagesSquare',
    description: 'Logs de mensagens internas',
    permissions: [
      {
        id: 'admin.logs-chat-interno.visualizar',
        name: 'Visualizar Logs de Chat Interno',
        description: 'Acessar página de logs de chat interno',
        action: 'view',
        resource: 'logs-chat-interno',
        category: 'Logs Chat Interno',
        enabled: true
      },
      {
        id: 'admin.logs-chat-interno.exportar',
        name: 'Exportar Logs de Chat Interno',
        description: 'Exportar logs de chat interno',
        action: 'export',
        resource: 'logs-chat-interno',
        category: 'Logs Chat Interno',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Malotes',
    icon: 'Briefcase',
    description: 'Logs de gestão de malotes',
    permissions: [
      {
        id: 'admin.logs-malotes.visualizar',
        name: 'Visualizar Logs de Malotes',
        description: 'Acessar página de logs de malotes',
        action: 'view',
        resource: 'logs-malotes',
        category: 'Logs Malotes',
        enabled: true
      },
      {
        id: 'admin.logs-malotes.exportar',
        name: 'Exportar Logs de Malotes',
        description: 'Exportar logs de malotes',
        action: 'export',
        resource: 'logs-malotes',
        category: 'Logs Malotes',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Conexões',
    icon: 'Plug',
    description: 'Logs de API e integrações',
    permissions: [
      {
        id: 'admin.logs-conexoes.visualizar',
        name: 'Visualizar Logs de Conexões',
        description: 'Acessar página de logs de conexões',
        action: 'view',
        resource: 'logs-conexoes',
        category: 'Logs Conexões',
        enabled: true
      },
      {
        id: 'admin.logs-conexoes.exportar',
        name: 'Exportar Logs de Conexões',
        description: 'Exportar logs de conexões',
        action: 'export',
        resource: 'logs-conexoes',
        category: 'Logs Conexões',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Tags',
    icon: 'Tag',
    description: 'Logs de CRUD de tags',
    permissions: [
      {
        id: 'admin.logs-tags.visualizar',
        name: 'Visualizar Logs de Tags',
        description: 'Acessar página de logs de tags',
        action: 'view',
        resource: 'logs-tags',
        category: 'Logs Tags',
        enabled: true
      },
      {
        id: 'admin.logs-tags.exportar',
        name: 'Exportar Logs de Tags',
        description: 'Exportar logs de tags',
        action: 'export',
        resource: 'logs-tags',
        category: 'Logs Tags',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Documentos',
    icon: 'FileCheck',
    description: 'Logs de gestão de documentos',
    permissions: [
      {
        id: 'admin.logs-documentos.visualizar',
        name: 'Visualizar Logs de Documentos',
        description: 'Acessar página de logs de documentos',
        action: 'view',
        resource: 'logs-documentos',
        category: 'Logs Documentos',
        enabled: true
      },
      {
        id: 'admin.logs-documentos.exportar',
        name: 'Exportar Logs de Documentos',
        description: 'Exportar logs de documentos',
        action: 'export',
        resource: 'logs-documentos',
        category: 'Logs Documentos',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Filas WhatsApp',
    icon: 'ListOrdered',
    description: 'Logs de filas de atendimento',
    permissions: [
      {
        id: 'admin.logs-filas.visualizar',
        name: 'Visualizar Logs de Filas',
        description: 'Acessar página de logs de filas WhatsApp',
        action: 'view',
        resource: 'logs-filas',
        category: 'Logs Filas WhatsApp',
        enabled: true
      },
      {
        id: 'admin.logs-filas.exportar',
        name: 'Exportar Logs de Filas',
        description: 'Exportar logs de filas WhatsApp',
        action: 'export',
        resource: 'logs-filas',
        category: 'Logs Filas WhatsApp',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Sistema',
    icon: 'AlertTriangle',
    description: 'Logs gerais do sistema',
    permissions: [
      {
        id: 'admin.logs-sistema.visualizar',
        name: 'Visualizar Logs de Sistema',
        description: 'Acessar página de logs de sistema',
        action: 'view',
        resource: 'logs-sistema',
        category: 'Logs Sistema',
        enabled: true,
        critical: true
      },
      {
        id: 'admin.logs-sistema.exportar',
        name: 'Exportar Logs de Sistema',
        description: 'Exportar logs de sistema',
        action: 'export',
        resource: 'logs-sistema',
        category: 'Logs Sistema',
        enabled: true
      }
    ]
  },
  {
    category: 'Campanhas WhatsApp',
    icon: 'Megaphone',
    description: 'Gerenciamento de campanhas de disparo em massa',
    permissions: [
      {
        id: 'admin.campanhas.visualizar',
        name: 'Visualizar Campanhas',
        description: 'Acessar página de campanhas WhatsApp',
        action: 'view',
        resource: 'campanhas-whatsapp',
        category: 'Campanhas WhatsApp',
        enabled: true
      },
      {
        id: 'admin.campanhas.criar',
        name: 'Criar Campanhas',
        description: 'Criar novas campanhas de disparo',
        action: 'create',
        resource: 'campanhas-whatsapp',
        category: 'Campanhas WhatsApp',
        enabled: true
      },
      {
        id: 'admin.campanhas.editar',
        name: 'Editar Campanhas',
        description: 'Editar campanhas existentes',
        action: 'edit',
        resource: 'campanhas-whatsapp',
        category: 'Campanhas WhatsApp',
        enabled: true
      },
      {
        id: 'admin.campanhas.excluir',
        name: 'Excluir Campanhas',
        description: 'Excluir campanhas',
        action: 'delete',
        resource: 'campanhas-whatsapp',
        category: 'Campanhas WhatsApp',
        enabled: true
      },
      {
        id: 'admin.campanhas.executar',
        name: 'Executar Campanhas',
        description: 'Iniciar, pausar e cancelar campanhas',
        action: 'manage',
        resource: 'campanhas-whatsapp',
        category: 'Campanhas WhatsApp',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Campanhas',
    icon: 'Megaphone',
    description: 'Logs de envios de campanhas WhatsApp',
    permissions: [
      {
        id: 'admin.logs-campanhas.visualizar',
        name: 'Visualizar Logs Campanhas',
        description: 'Visualizar logs de campanhas WhatsApp',
        action: 'view',
        resource: 'logs-campanhas',
        category: 'Logs Campanhas',
        enabled: true
      },
      {
        id: 'admin.logs-campanhas.exportar',
        name: 'Exportar Logs Campanhas',
        description: 'Exportar logs de campanhas',
        action: 'export',
        resource: 'logs-campanhas',
        category: 'Logs Campanhas',
        enabled: true
      }
    ]
  },
  {
    category: 'Vagas de Emprego',
    icon: 'UserCircle',
    description: 'Gerenciamento de vagas de emprego',
    permissions: [
      {
        id: 'admin.vagas.visualizar',
        name: 'Visualizar Vagas',
        description: 'Acessar página de vagas de emprego',
        action: 'view',
        resource: 'vagas',
        category: 'Vagas de Emprego',
        enabled: true
      },
      {
        id: 'admin.vagas.criar',
        name: 'Criar Vagas',
        description: 'Criar novas vagas de emprego',
        action: 'create',
        resource: 'vagas',
        category: 'Vagas de Emprego',
        enabled: true
      },
      {
        id: 'admin.vagas.editar',
        name: 'Editar Vagas',
        description: 'Editar vagas existentes',
        action: 'edit',
        resource: 'vagas',
        category: 'Vagas de Emprego',
        enabled: true
      },
      {
        id: 'admin.vagas.excluir',
        name: 'Excluir Vagas',
        description: 'Excluir vagas de emprego',
        action: 'delete',
        resource: 'vagas',
        category: 'Vagas de Emprego',
        enabled: true
      }
    ]
  },
  {
    category: 'Logs Vagas',
    icon: 'Briefcase',
    description: 'Visualização de logs de vagas de emprego',
    permissions: [
      {
        id: 'admin.logs-vagas.visualizar',
        name: 'Visualizar Logs Vagas',
        description: 'Acessar logs de vagas de emprego',
        action: 'view',
        resource: 'logs-vagas',
        category: 'Logs Vagas',
        enabled: true
      },
      {
        id: 'admin.logs-vagas.exportar',
        name: 'Exportar Logs Vagas',
        description: 'Exportar logs de vagas',
        action: 'export',
        resource: 'logs-vagas',
        category: 'Logs Vagas',
        enabled: true
      }
    ]
  }
];
