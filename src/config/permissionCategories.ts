/**
 * Agrupamento de permissões por categoria do sidebar
 * Segue a mesma estrutura do adminSidebarConfig.ts
 */

export interface SidebarPermissionCategory {
  id: string;
  label: string;
  pages: {
    id: string;
    label: string;
    permissionPrefix: string;
  }[];
}

export const sidebarPermissionCategories: SidebarPermissionCategory[] = [
  {
    id: 'principal',
    label: 'Principal',
    pages: [
      { id: 'dashboard', label: 'Dashboard', permissionPrefix: 'admin.dashboard' }
    ]
  },
  {
    id: 'db-frete',
    label: 'DB Frete',
    pages: [
      { id: 'cotacoes', label: 'Cotações', permissionPrefix: 'admin.cotacoes' },
      { id: 'coletas', label: 'Coletas', permissionPrefix: 'admin.coletas' },
      { id: 'manifestos', label: 'Manifestos', permissionPrefix: 'admin.manifestos' },
      { id: 'consultar-nfe', label: 'Consultar NF-e', permissionPrefix: 'admin.nfe' },
      { id: 'rastreamento', label: 'Rastreamento', permissionPrefix: 'admin.rastreamento' }
    ]
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    pages: [
      { id: 'whatsapp', label: 'Atendimento', permissionPrefix: 'admin.whatsapp' },
      { id: 'whatsapp-kanban', label: 'Kanban', permissionPrefix: 'admin.whatsapp.kanban' },
      { id: 'whatsapp-filas', label: 'Filas', permissionPrefix: 'admin.whatsapp.filas' },
      { id: 'campanhas-whatsapp', label: 'Campanhas', permissionPrefix: 'admin.campanhas' },
      { id: 'mensagens-rapidas', label: 'Mensagens rápidas', permissionPrefix: 'admin.mensagens-rapidas' },
      { id: 'whatsapp-contatos', label: 'Contatos', permissionPrefix: 'admin.whatsapp.contatos' },
      { id: 'tags-kanban', label: 'Tags', permissionPrefix: 'admin.whatsapp.etiquetas' },
      { id: 'chat-interno', label: 'Chat Interno', permissionPrefix: 'admin.chat-interno' }
    ]
  },
  {
    id: 'clientes',
    label: 'Clientes',
    pages: [
      { id: 'contacts', label: 'Contatos', permissionPrefix: 'admin.contatos' },
      { id: 'solicitacoes-documentos', label: 'Solicitação Documentos', permissionPrefix: 'admin.solicitacoes-documentos' },
      { id: 'documentos-clientes', label: 'Repositório Docs', permissionPrefix: 'admin.documentos-clientes' },
      { id: 'ocorrencias', label: 'Ocorrências', permissionPrefix: 'admin.ocorrencias' }
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    pages: [
      { id: 'contas-receber', label: 'Contas a Receber', permissionPrefix: 'admin.contas-receber' },
      { id: 'malotes', label: 'Malotes', permissionPrefix: 'admin.malotes' }
    ]
  },
  {
    id: 'rh',
    label: 'Recursos Humanos',
    pages: [
      { id: 'vagas', label: 'Vagas de Emprego', permissionPrefix: 'admin.vagas' }
    ]
  },
  {
    id: 'sistema',
    label: 'Sistema',
    pages: [
      { id: 'gerenciar-usuarios', label: 'Gerenciar Usuários', permissionPrefix: 'admin.usuarios' },
      { id: 'cargos', label: 'Cargos', permissionPrefix: 'admin.cargos' },
      { id: 'solicitacoes-acessos', label: 'Solicitações de Acesso', permissionPrefix: 'admin.solicitacoes-acessos' },
      { id: 'flowbuilders', label: 'FlowBuilders', permissionPrefix: 'admin.flowbuilders' },
      { id: 'conexoes', label: 'Conexões', permissionPrefix: 'admin.conexoes' },
      { id: 'configuracoes', label: 'Configurações', permissionPrefix: 'admin.config' }
    ]
  },
  {
    id: 'programador',
    label: 'Programador',
    pages: [
      { id: 'erros', label: 'Erros do Sistema', permissionPrefix: 'admin.erros' },
      { id: 'backups', label: 'Backups', permissionPrefix: 'admin.backups' }
    ]
  },
  {
    id: 'monitoramento',
    label: 'Monitoramento',
    pages: [
      { id: 'logs-central', label: 'Central de Logs', permissionPrefix: 'admin.logs-central' },
      { id: 'logs-atividades', label: 'Atividades', permissionPrefix: 'admin.logs-atividades' },
      { id: 'logs-autenticacao', label: 'Autenticação', permissionPrefix: 'admin.logs-autenticacao' },
      { id: 'logs-email', label: 'Email', permissionPrefix: 'admin.logs-email' },
      { id: 'whatsapp-logs', label: 'WhatsApp', permissionPrefix: 'admin.whatsapp-logs' },
      { id: 'logs-campanhas', label: 'Campanhas', permissionPrefix: 'admin.logs-campanhas' },
      { id: 'logs-mensagens-rapidas', label: 'Mensagens', permissionPrefix: 'admin.logs-mensagens-rapidas' },
      { id: 'logs-ocorrencias', label: 'Ocorrências', permissionPrefix: 'admin.logs-ocorrencias' },
      { id: 'flow-logs', label: 'FlowBuilders', permissionPrefix: 'admin.flow-logs' }
    ]
  },
  {
    id: 'logs-modulos',
    label: 'Logs por Módulo',
    pages: [
      { id: 'logs-usuarios', label: 'Usuários', permissionPrefix: 'admin.logs-usuarios' },
      { id: 'logs-cargos', label: 'Cargos', permissionPrefix: 'admin.logs-cargos' },
      { id: 'logs-contatos', label: 'Contatos', permissionPrefix: 'admin.logs-contatos' },
      { id: 'logs-configuracoes', label: 'Configurações', permissionPrefix: 'admin.logs-configuracoes' },
      { id: 'logs-chat-interno', label: 'Chat Interno', permissionPrefix: 'admin.logs-chat-interno' },
      { id: 'logs-malotes', label: 'Malotes', permissionPrefix: 'admin.logs-malotes' },
      { id: 'logs-conexoes', label: 'Conexões', permissionPrefix: 'admin.logs-conexoes' },
      { id: 'logs-tags', label: 'Tags', permissionPrefix: 'admin.logs-tags' },
      { id: 'logs-documentos', label: 'Documentos', permissionPrefix: 'admin.logs-documentos' },
      { id: 'logs-filas', label: 'Filas WhatsApp', permissionPrefix: 'admin.logs-filas' },
      { id: 'logs-sistema', label: 'Sistema', permissionPrefix: 'admin.logs-sistema' }
    ]
  },
  {
    id: 'area-cliente',
    label: 'Área do Cliente',
    pages: [
      { id: 'cliente-documentos', label: 'Documentos', permissionPrefix: 'clientes.documentos' },
      { id: 'cliente-dashboard', label: 'Dashboard', permissionPrefix: 'clientes.dashboard' },
      { id: 'cliente-cotacoes', label: 'Minhas Cotações', permissionPrefix: 'clientes.cotacoes' },
      { id: 'cliente-coletas', label: 'Minhas Coletas', permissionPrefix: 'clientes.coletas' },
      { id: 'cliente-financeiro', label: 'Financeiro', permissionPrefix: 'clientes.financeiro' }
    ]
  }
];

/**
 * Mapeamento de página do sidebar para prefixo de permissão
 */
export const pageToPermissionPrefix: Record<string, string> = {
  // Principal
  'dashboard': 'admin.dashboard',
  
  // DB Frete
  'cotacoes': 'admin.cotacoes',
  'coletas': 'admin.coletas',
  'manifestos': 'admin.manifestos',
  'consultar-nfe': 'admin.nfe',
  'rastreamento': 'admin.rastreamento',
  
  // Comunicação
  'whatsapp': 'admin.whatsapp',
  'whatsapp-kanban': 'admin.whatsapp.kanban',
  'whatsapp-filas': 'admin.whatsapp.filas',
  'mensagens-rapidas': 'admin.mensagens-rapidas',
  'whatsapp-contatos': 'admin.whatsapp.contatos',
  'tags-kanban': 'admin.whatsapp.etiquetas',
  'campanhas-whatsapp': 'admin.campanhas',
  'chat-interno': 'admin.chat-interno',
  
  // Clientes
  'contacts': 'admin.contatos',
  'solicitacoes-documentos': 'admin.solicitacoes-documentos',
  'documentos-clientes': 'admin.documentos-clientes',
  'ocorrencias': 'admin.ocorrencias',
  
  // Financeiro
  'contas-receber': 'admin.contas-receber',
  'malotes': 'admin.malotes',
  
  // RH
  'vagas': 'admin.vagas',
  
  // Sistema
  'gerenciar-usuarios': 'admin.usuarios',
  'cargos': 'admin.cargos',
  'solicitacoes-acessos': 'admin.solicitacoes-acessos',
  'flowbuilders': 'admin.flowbuilders',
  'conexoes': 'admin.conexoes',
  'configuracoes': 'admin.config',
  
  // Programador
  'erros': 'admin.erros',
  'backups': 'admin.backups',
  
  // Monitoramento
  'logs-central': 'admin.logs-central',
  'logs': 'admin.logs-atividades',
  'logs-atividades': 'admin.logs-atividades',
  'logs-autenticacao': 'admin.logs-autenticacao',
  'logs-email': 'admin.logs-email',
  'whatsapp-logs': 'admin.whatsapp-logs',
  'logs-campanhas': 'admin.logs-campanhas',
  'logs-mensagens-rapidas': 'admin.logs-mensagens-rapidas',
  'logs-ocorrencias': 'admin.logs-ocorrencias',
  'flow-logs': 'admin.flow-logs',
  
  // Logs por Módulo
  'logs-usuarios': 'admin.logs-usuarios',
  'logs-cargos': 'admin.logs-cargos',
  'logs-contatos': 'admin.logs-contatos',
  'logs-configuracoes': 'admin.logs-configuracoes',
  'logs-chat-interno': 'admin.logs-chat-interno',
  'logs-malotes': 'admin.logs-malotes',
  'logs-conexoes': 'admin.logs-conexoes',
  'logs-tags': 'admin.logs-tags',
  'logs-documentos': 'admin.logs-documentos',
  'logs-filas': 'admin.logs-filas',
  'logs-sistema': 'admin.logs-sistema',
  
  // Área do Cliente
  'cliente-documentos': 'clientes.documentos',
  'cliente-dashboard': 'clientes.dashboard',
  'cliente-cotacoes': 'clientes.cotacoes',
  'cliente-coletas': 'clientes.coletas',
  'cliente-financeiro': 'clientes.financeiro'
};

/**
 * Obtém a categoria do sidebar para uma página
 */
export function getCategoryForPage(pageId: string): string | null {
  for (const category of sidebarPermissionCategories) {
    if (category.pages.some(page => page.id === pageId)) {
      return category.id;
    }
  }
  return null;
}

/**
 * Obtém todas as páginas de uma categoria
 */
export function getPagesForCategory(categoryId: string): string[] {
  const category = sidebarPermissionCategories.find(c => c.id === categoryId);
  return category ? category.pages.map(p => p.id) : [];
}
