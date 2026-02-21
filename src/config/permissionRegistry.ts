import { Permission, PermissionCategory, PermissionAction } from '@/types/permissions';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  action: PermissionAction;
  resource: string;
  critical: boolean;
}

/**
 * Registry centralizado de todas as permissões do sistema
 * Novas funcionalidades devem registrar suas permissões aqui
 */
class PermissionRegistry {
  private permissions: Map<string, PermissionDefinition> = new Map();

  constructor() {
    this.registerDefaultPermissions();
  }

  private registerDefaultPermissions() {
    // Admin permissions
    this.register({
      id: 'admin.view',
      name: 'Visualizar Admin',
      description: 'Acesso ao painel administrativo',
      category: 'admin',
      action: 'view',
      resource: 'admin-panel',
      critical: true
    });

    this.register({
      id: 'admin.config',
      name: 'Configurações',
      description: 'Alterar configurações do sistema',
      category: 'admin',
      action: 'edit',
      resource: 'system-config',
      critical: true
    });

    // Dashboard
    this.register({
      id: 'admin.dashboard.visualizar',
      name: 'Visualizar Dashboard',
      description: 'Acesso à página de dashboard',
      category: 'Dashboard',
      action: 'view',
      resource: 'dashboard',
      critical: false
    });

    // Cotações
    this.register({
      id: 'admin.cotacoes.visualizar',
      name: 'Visualizar Cotações',
      description: 'Acessar página de cotações',
      category: 'Cotações',
      action: 'view',
      resource: 'cotacoes',
      critical: false
    });

    this.register({
      id: 'admin.cotacoes.criar',
      name: 'Criar Cotações',
      description: 'Criar novas cotações',
      category: 'Cotações',
      action: 'create',
      resource: 'cotacoes',
      critical: false
    });

    this.register({
      id: 'admin.cotacoes.editar',
      name: 'Editar Cotações',
      description: 'Editar cotações existentes',
      category: 'Cotações',
      action: 'edit',
      resource: 'cotacoes',
      critical: false
    });

    this.register({
      id: 'admin.cotacoes.excluir',
      name: 'Excluir Cotações',
      description: 'Excluir cotações',
      category: 'Cotações',
      action: 'delete',
      resource: 'cotacoes',
      critical: false
    });

    this.register({
      id: 'admin.cotacoes.exportar',
      name: 'Exportar Cotações',
      description: 'Exportar dados de cotações',
      category: 'Cotações',
      action: 'export',
      resource: 'cotacoes',
      critical: false
    });

    // Coletas
    this.register({
      id: 'admin.coletas.visualizar',
      name: 'Visualizar Coletas',
      description: 'Acessar página de coletas',
      category: 'Coletas',
      action: 'view',
      resource: 'coletas',
      critical: false
    });

    this.register({
      id: 'admin.coletas.criar',
      name: 'Criar Coletas',
      description: 'Criar novas coletas',
      category: 'Coletas',
      action: 'create',
      resource: 'coletas',
      critical: false
    });

    this.register({
      id: 'admin.coletas.editar',
      name: 'Editar Coletas',
      description: 'Editar coletas existentes',
      category: 'Coletas',
      action: 'edit',
      resource: 'coletas',
      critical: false
    });

    this.register({
      id: 'admin.coletas.excluir',
      name: 'Excluir Coletas',
      description: 'Excluir coletas',
      category: 'Coletas',
      action: 'delete',
      resource: 'coletas',
      critical: false
    });

    this.register({
      id: 'admin.coletas.pdf',
      name: 'Baixar PDF',
      description: 'Baixar PDF das coletas',
      category: 'Coletas',
      action: 'export',
      resource: 'coletas',
      critical: false
    });

    this.register({
      id: 'admin.manifestos.pdf',
      name: 'Baixar PDF Manifestos',
      description: 'Baixar PDF dos manifestos',
      category: 'Manifestos',
      action: 'export',
      resource: 'manifestos',
      critical: false
    });

    this.register({
      id: 'admin.manifestos.todas-empresas',
      name: 'Ver Todas Empresas',
      description: 'Visualizar manifestos de todas as empresas',
      category: 'Manifestos',
      action: 'view',
      resource: 'manifestos',
      critical: false
    });

    // Ranking
    this.register({
      id: 'admin.ranking.visualizar',
      name: 'Visualizar Ranking',
      description: 'Acessar página de ranking de clientes',
      category: 'Ranking',
      action: 'view',
      resource: 'ranking',
      critical: false
    });

    this.register({
      id: 'admin.ranking.exportar',
      name: 'Exportar Ranking',
      description: 'Exportar dados do ranking',
      category: 'Ranking',
      action: 'export',
      resource: 'ranking',
      critical: false
    });

    // Contatos
    this.register({
      id: 'admin.contatos.visualizar',
      name: 'Visualizar Contatos',
      description: 'Acessar página de contatos',
      category: 'Contatos',
      action: 'view',
      resource: 'contatos',
      critical: false
    });

    this.register({
      id: 'admin.contatos.responder',
      name: 'Responder Contatos',
      description: 'Responder mensagens de contato',
      category: 'Contatos',
      action: 'edit',
      resource: 'contatos',
      critical: false
    });

    this.register({
      id: 'admin.contatos.excluir',
      name: 'Excluir Contatos',
      description: 'Excluir mensagens de contato',
      category: 'Contatos',
      action: 'delete',
      resource: 'contatos',
      critical: false
    });

    // Solicitações de Documentos
    this.register({
      id: 'admin.solicitacoes-documentos.visualizar',
      name: 'Visualizar Solicitações',
      description: 'Acessar página de solicitações de documentos',
      category: 'Contatos',
      action: 'view',
      resource: 'solicitacoes-documentos',
      critical: false
    });

    this.register({
      id: 'admin.solicitacoes-documentos.criar',
      name: 'Criar Solicitações',
      description: 'Criar novas solicitações de documentos',
      category: 'Contatos',
      action: 'create',
      resource: 'solicitacoes-documentos',
      critical: false
    });

    this.register({
      id: 'admin.solicitacoes-documentos.editar',
      name: 'Editar Solicitações',
      description: 'Editar solicitações existentes',
      category: 'Contatos',
      action: 'edit',
      resource: 'solicitacoes-documentos',
      critical: false
    });

    this.register({
      id: 'admin.solicitacoes-documentos.excluir',
      name: 'Excluir Solicitações',
      description: 'Excluir solicitações de documentos',
      category: 'Contatos',
      action: 'delete',
      resource: 'solicitacoes-documentos',
      critical: false
    });

    // Erros de Envio
    this.register({
      id: 'admin.erros-envio.visualizar',
      name: 'Visualizar Erros',
      description: 'Acessar página de erros de envio',
      category: 'Comunicação',
      action: 'view',
      resource: 'erros-envio',
      critical: false
    });

    // WhatsApp Chat - Chat Principal
    this.register({
      id: 'admin.whatsapp.visualizar',
      name: 'Visualizar WhatsApp',
      description: 'Acessar página de chat WhatsApp',
      category: 'WhatsApp Chat',
      action: 'view',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.enviar',
      name: 'Enviar Mensagens',
      description: 'Enviar mensagens no WhatsApp',
      category: 'WhatsApp Chat',
      action: 'create',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.ver_conversas_outros',
      name: 'Ver Conversas de Outros',
      description: 'Visualizar conversas de outros atendentes',
      category: 'WhatsApp Chat',
      action: 'view',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.transferir',
      name: 'Transferir Conversas',
      description: 'Transferir conversas entre atendentes',
      category: 'WhatsApp Chat',
      action: 'edit',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.finalizar',
      name: 'Finalizar Atendimento',
      description: 'Finalizar atendimentos de conversas',
      category: 'WhatsApp Chat',
      action: 'edit',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.finalizar-silencioso',
      name: 'Encerrar Silenciosamente',
      description: 'Encerrar tickets sem enviar mensagem de encerramento ao cliente',
      category: 'WhatsApp Chat',
      action: 'edit',
      resource: 'whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.historico',
      name: 'Ver Histórico',
      description: 'Visualizar histórico completo de conversas',
      category: 'WhatsApp Chat',
      action: 'view',
      resource: 'whatsapp',
      critical: false
    });


    this.register({
      id: 'admin.whatsapp.exportar',
      name: 'Exportar Conversas',
      description: 'Exportar conversas e histórico',
      category: 'WhatsApp Chat',
      action: 'export',
      resource: 'whatsapp',
      critical: false
    });

    // WhatsApp Notas Internas
    this.register({
      id: 'admin.whatsapp.notas.visualizar',
      name: 'Visualizar Notas',
      description: 'Visualizar notas internas do chat',
      category: 'WhatsApp Notas',
      action: 'view',
      resource: 'notas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.notas.criar',
      name: 'Criar Notas',
      description: 'Criar notas internas para a equipe',
      category: 'WhatsApp Notas',
      action: 'create',
      resource: 'notas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.notas.editar',
      name: 'Editar Notas de Outros',
      description: 'Editar notas internas criadas por outros usuários',
      category: 'WhatsApp Notas',
      action: 'edit',
      resource: 'notas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.notas.excluir',
      name: 'Excluir Notas de Outros',
      description: 'Excluir notas internas criadas por outros usuários',
      category: 'WhatsApp Notas',
      action: 'delete',
      resource: 'notas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.notas.ver_historico_contato',
      name: 'Ver Histórico de Notas do Contato',
      description: 'Visualizar notas de outros chats do mesmo contato',
      category: 'WhatsApp Notas',
      action: 'view',
      resource: 'notas-whatsapp',
      critical: false
    });

    // WhatsApp Filas
    this.register({
      id: 'admin.whatsapp.filas.visualizar',
      name: 'Visualizar Filas',
      description: 'Acessar página de filas WhatsApp',
      category: 'WhatsApp Filas',
      action: 'view',
      resource: 'filas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.filas.criar',
      name: 'Criar Filas',
      description: 'Criar novas filas de atendimento',
      category: 'WhatsApp Filas',
      action: 'create',
      resource: 'filas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.filas.editar',
      name: 'Editar Filas',
      description: 'Editar filas existentes',
      category: 'WhatsApp Filas',
      action: 'edit',
      resource: 'filas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.filas.excluir',
      name: 'Excluir Filas',
      description: 'Excluir filas de atendimento',
      category: 'WhatsApp Filas',
      action: 'delete',
      resource: 'filas-whatsapp',
      critical: true
    });

    // WhatsApp Conexões/Instâncias
    this.register({
      id: 'admin.whatsapp.conexoes.visualizar',
      name: 'Visualizar Conexões',
      description: 'Visualizar instâncias/conexões WhatsApp',
      category: 'WhatsApp Conexões',
      action: 'view',
      resource: 'conexoes-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.conexoes.criar',
      name: 'Criar Conexões',
      description: 'Criar novas conexões WhatsApp',
      category: 'WhatsApp Conexões',
      action: 'create',
      resource: 'conexoes-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.conexoes.editar',
      name: 'Editar Conexões',
      description: 'Editar conexões existentes',
      category: 'WhatsApp Conexões',
      action: 'edit',
      resource: 'conexoes-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.conexoes.excluir',
      name: 'Excluir Conexões',
      description: 'Excluir conexões WhatsApp',
      category: 'WhatsApp Conexões',
      action: 'delete',
      resource: 'conexoes-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.conexoes.conectar',
      name: 'Conectar/Desconectar',
      description: 'Conectar e desconectar instâncias',
      category: 'WhatsApp Conexões',
      action: 'manage',
      resource: 'conexoes-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.conexoes.qrcode',
      name: 'Gerar QR Code',
      description: 'Gerar QR Code para conexão',
      category: 'WhatsApp Conexões',
      action: 'create',
      resource: 'conexoes-whatsapp',
      critical: false
    });

    // WhatsApp Etiquetas/Tags
    this.register({
      id: 'admin.whatsapp.etiquetas.visualizar',
      name: 'Visualizar Etiquetas',
      description: 'Visualizar etiquetas de conversas',
      category: 'WhatsApp Etiquetas',
      action: 'view',
      resource: 'etiquetas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.etiquetas.criar',
      name: 'Criar Etiquetas',
      description: 'Criar novas etiquetas',
      category: 'WhatsApp Etiquetas',
      action: 'create',
      resource: 'etiquetas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.etiquetas.editar',
      name: 'Editar Etiquetas',
      description: 'Editar etiquetas existentes',
      category: 'WhatsApp Etiquetas',
      action: 'edit',
      resource: 'etiquetas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.etiquetas.excluir',
      name: 'Excluir Etiquetas',
      description: 'Excluir etiquetas',
      category: 'WhatsApp Etiquetas',
      action: 'delete',
      resource: 'etiquetas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.etiquetas.aplicar',
      name: 'Aplicar Etiquetas',
      description: 'Aplicar etiquetas às conversas',
      category: 'WhatsApp Etiquetas',
      action: 'edit',
      resource: 'etiquetas-whatsapp',
      critical: false
    });

    // WhatsApp Departamentos
    this.register({
      id: 'admin.whatsapp.departamentos.visualizar',
      name: 'Visualizar Departamentos',
      description: 'Visualizar departamentos de atendimento',
      category: 'WhatsApp Departamentos',
      action: 'view',
      resource: 'departamentos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.departamentos.criar',
      name: 'Criar Departamentos',
      description: 'Criar novos departamentos',
      category: 'WhatsApp Departamentos',
      action: 'create',
      resource: 'departamentos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.departamentos.editar',
      name: 'Editar Departamentos',
      description: 'Editar departamentos existentes',
      category: 'WhatsApp Departamentos',
      action: 'edit',
      resource: 'departamentos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.departamentos.excluir',
      name: 'Excluir Departamentos',
      description: 'Excluir departamentos',
      category: 'WhatsApp Departamentos',
      action: 'delete',
      resource: 'departamentos-whatsapp',
      critical: true
    });

    // WhatsApp Chatbot/Automação
    this.register({
      id: 'admin.whatsapp.chatbot.visualizar',
      name: 'Visualizar Chatbot',
      description: 'Visualizar configurações do chatbot',
      category: 'WhatsApp Chatbot',
      action: 'view',
      resource: 'chatbot-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.chatbot.criar',
      name: 'Criar Fluxos',
      description: 'Criar fluxos de automação',
      category: 'WhatsApp Chatbot',
      action: 'create',
      resource: 'chatbot-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.chatbot.editar',
      name: 'Editar Chatbot',
      description: 'Editar configurações do chatbot',
      category: 'WhatsApp Chatbot',
      action: 'edit',
      resource: 'chatbot-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.chatbot.excluir',
      name: 'Excluir Fluxos',
      description: 'Excluir fluxos de automação',
      category: 'WhatsApp Chatbot',
      action: 'delete',
      resource: 'chatbot-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.chatbot.ativar',
      name: 'Ativar/Desativar Chatbot',
      description: 'Ativar e desativar chatbot',
      category: 'WhatsApp Chatbot',
      action: 'manage',
      resource: 'chatbot-whatsapp',
      critical: true
    });

    // WhatsApp Disparos em Massa
    this.register({
      id: 'admin.whatsapp.disparos.visualizar',
      name: 'Visualizar Disparos',
      description: 'Visualizar campanhas de disparo',
      category: 'WhatsApp Disparos',
      action: 'view',
      resource: 'disparos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.disparos.criar',
      name: 'Criar Disparos',
      description: 'Criar campanhas de disparo em massa',
      category: 'WhatsApp Disparos',
      action: 'create',
      resource: 'disparos-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.disparos.editar',
      name: 'Editar Disparos',
      description: 'Editar campanhas de disparo',
      category: 'WhatsApp Disparos',
      action: 'edit',
      resource: 'disparos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.disparos.excluir',
      name: 'Excluir Disparos',
      description: 'Excluir campanhas de disparo',
      category: 'WhatsApp Disparos',
      action: 'delete',
      resource: 'disparos-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.disparos.executar',
      name: 'Executar Disparos',
      description: 'Executar campanhas de disparo',
      category: 'WhatsApp Disparos',
      action: 'manage',
      resource: 'disparos-whatsapp',
      critical: true
    });

    // Campanhas WhatsApp
    this.register({
      id: 'admin.campanhas.visualizar',
      name: 'Visualizar Campanhas',
      description: 'Acessar página de campanhas WhatsApp',
      category: 'Campanhas WhatsApp',
      action: 'view',
      resource: 'campanhas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.campanhas.criar',
      name: 'Criar Campanhas',
      description: 'Criar novas campanhas de disparo',
      category: 'Campanhas WhatsApp',
      action: 'create',
      resource: 'campanhas-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.campanhas.editar',
      name: 'Editar Campanhas',
      description: 'Editar campanhas existentes',
      category: 'Campanhas WhatsApp',
      action: 'edit',
      resource: 'campanhas-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.campanhas.excluir',
      name: 'Excluir Campanhas',
      description: 'Excluir campanhas',
      category: 'Campanhas WhatsApp',
      action: 'delete',
      resource: 'campanhas-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.campanhas.executar',
      name: 'Executar Campanhas',
      description: 'Iniciar, pausar e cancelar campanhas',
      category: 'Campanhas WhatsApp',
      action: 'manage',
      resource: 'campanhas-whatsapp',
      critical: true
    });

    // Logs de Campanhas
    this.register({
      id: 'admin.logs-campanhas.visualizar',
      name: 'Visualizar Logs Campanhas',
      description: 'Visualizar logs de campanhas WhatsApp',
      category: 'Logs Campanhas',
      action: 'view',
      resource: 'logs-campanhas',
      critical: false
    });

    this.register({
      id: 'admin.logs-campanhas.exportar',
      name: 'Exportar Logs Campanhas',
      description: 'Exportar logs de campanhas',
      category: 'Logs Campanhas',
      action: 'export',
      resource: 'logs-campanhas',
      critical: false
    });

    // WhatsApp Configurações
    this.register({
      id: 'admin.whatsapp.config.visualizar',
      name: 'Visualizar Configurações',
      description: 'Visualizar configurações do WhatsApp',
      category: 'WhatsApp Configurações',
      action: 'view',
      resource: 'config-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.config.editar',
      name: 'Editar Configurações',
      description: 'Editar configurações do WhatsApp',
      category: 'WhatsApp Configurações',
      action: 'edit',
      resource: 'config-whatsapp',
      critical: true
    });

    // WhatsApp Webhooks
    this.register({
      id: 'admin.whatsapp.webhooks.visualizar',
      name: 'Visualizar Webhooks',
      description: 'Visualizar webhooks configurados',
      category: 'WhatsApp Webhooks',
      action: 'view',
      resource: 'webhooks-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.webhooks.criar',
      name: 'Criar Webhooks',
      description: 'Criar novos webhooks',
      category: 'WhatsApp Webhooks',
      action: 'create',
      resource: 'webhooks-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.webhooks.editar',
      name: 'Editar Webhooks',
      description: 'Editar webhooks existentes',
      category: 'WhatsApp Webhooks',
      action: 'edit',
      resource: 'webhooks-whatsapp',
      critical: true
    });

    this.register({
      id: 'admin.whatsapp.webhooks.excluir',
      name: 'Excluir Webhooks',
      description: 'Excluir webhooks',
      category: 'WhatsApp Webhooks',
      action: 'delete',
      resource: 'webhooks-whatsapp',
      critical: true
    });

    // WhatsApp Contatos
    this.register({
      id: 'admin.whatsapp.contatos.visualizar',
      name: 'Visualizar Contatos WhatsApp',
      description: 'Visualizar contatos do WhatsApp',
      category: 'WhatsApp Contatos',
      action: 'view',
      resource: 'contatos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.contatos.criar',
      name: 'Criar Contatos WhatsApp',
      description: 'Criar contatos no WhatsApp',
      category: 'WhatsApp Contatos',
      action: 'create',
      resource: 'contatos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.contatos.editar',
      name: 'Editar Contatos WhatsApp',
      description: 'Editar contatos do WhatsApp',
      category: 'WhatsApp Contatos',
      action: 'edit',
      resource: 'contatos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.contatos.importar',
      name: 'Importar Contatos',
      description: 'Importar contatos em massa',
      category: 'WhatsApp Contatos',
      action: 'import',
      resource: 'contatos-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.contatos.exportar',
      name: 'Exportar Contatos WhatsApp',
      description: 'Exportar contatos do WhatsApp',
      category: 'WhatsApp Contatos',
      action: 'export',
      resource: 'contatos-whatsapp',
      critical: false
    });

    // WhatsApp Relatórios/Estatísticas
    this.register({
      id: 'admin.whatsapp.relatorios.visualizar',
      name: 'Visualizar Relatórios WhatsApp',
      description: 'Visualizar relatórios e estatísticas',
      category: 'WhatsApp Relatórios',
      action: 'view',
      resource: 'relatorios-whatsapp',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp.relatorios.exportar',
      name: 'Exportar Relatórios WhatsApp',
      description: 'Exportar relatórios do WhatsApp',
      category: 'WhatsApp Relatórios',
      action: 'export',
      resource: 'relatorios-whatsapp',
      critical: false
    });

    // Mensagens Rápidas
    this.register({
      id: 'admin.mensagens-rapidas.visualizar',
      name: 'Visualizar Mensagens Rápidas',
      description: 'Acessar página de mensagens rápidas',
      category: 'Mensagens Rápidas',
      action: 'view',
      resource: 'mensagens-rapidas',
      critical: false
    });

    this.register({
      id: 'admin.mensagens-rapidas.criar',
      name: 'Criar Mensagens Rápidas',
      description: 'Criar novas mensagens rápidas',
      category: 'Mensagens Rápidas',
      action: 'create',
      resource: 'mensagens-rapidas',
      critical: false
    });

    this.register({
      id: 'admin.mensagens-rapidas.editar',
      name: 'Editar Mensagens Rápidas',
      description: 'Editar mensagens rápidas existentes',
      category: 'Mensagens Rápidas',
      action: 'edit',
      resource: 'mensagens-rapidas',
      critical: false
    });

    this.register({
      id: 'admin.mensagens-rapidas.excluir',
      name: 'Excluir Mensagens Rápidas',
      description: 'Excluir mensagens rápidas',
      category: 'Mensagens Rápidas',
      action: 'delete',
      resource: 'mensagens-rapidas',
      critical: false
    });

    // Clientes
    this.register({
      id: 'admin.clientes.visualizar',
      name: 'Visualizar Clientes',
      description: 'Acessar página de clientes',
      category: 'Clientes',
      action: 'view',
      resource: 'clientes',
      critical: false
    });

    this.register({
      id: 'admin.clientes.criar',
      name: 'Criar Clientes',
      description: 'Criar novos acessos de cliente',
      category: 'Clientes',
      action: 'create',
      resource: 'clientes',
      critical: false
    });

    this.register({
      id: 'admin.clientes.editar',
      name: 'Editar Clientes',
      description: 'Editar dados de clientes',
      category: 'Clientes',
      action: 'edit',
      resource: 'clientes',
      critical: false
    });

    this.register({
      id: 'admin.clientes.excluir',
      name: 'Excluir Clientes',
      description: 'Excluir acessos de cliente',
      category: 'Clientes',
      action: 'delete',
      resource: 'clientes',
      critical: true
    });

    // Repositório de Documentos (admin)
    this.register({
      id: 'admin.documentos-clientes.visualizar',
      name: 'Visualizar Repositório Docs',
      description: 'Acessar repositório de documentos dos clientes',
      category: 'Repositório Documentos',
      action: 'view',
      resource: 'documentos-clientes',
      critical: false
    });

    this.register({
      id: 'admin.documentos-clientes.criar',
      name: 'Criar Documentos',
      description: 'Fazer upload de novos documentos',
      category: 'Repositório Documentos',
      action: 'create',
      resource: 'documentos-clientes',
      critical: false
    });

    this.register({
      id: 'admin.documentos-clientes.editar',
      name: 'Editar Documentos',
      description: 'Editar informações de documentos',
      category: 'Repositório Documentos',
      action: 'edit',
      resource: 'documentos-clientes',
      critical: false
    });

    this.register({
      id: 'admin.documentos-clientes.excluir',
      name: 'Excluir Documentos',
      description: 'Excluir documentos do repositório',
      category: 'Repositório Documentos',
      action: 'delete',
      resource: 'documentos-clientes',
      critical: true
    });

    // NFe - Página e Ações
    this.register({
      id: 'admin.nfe.visualizar',
      name: 'Visualizar NF-e',
      description: 'Acesso à página de consulta NF-e',
      category: 'NFe',
      action: 'view',
      resource: 'nfe',
      critical: false
    });

    this.register({
      id: 'admin.nfe.pdf',
      name: 'Baixar PDF',
      description: 'Baixar arquivos PDF de CT-e',
      category: 'NFe',
      action: 'export',
      resource: 'nfe',
      critical: false
    });

    this.register({
      id: 'admin.nfe.xml',
      name: 'Baixar XML',
      description: 'Baixar arquivos XML de CT-e',
      category: 'NFe',
      action: 'export',
      resource: 'nfe',
      critical: false
    });

    this.register({
      id: 'admin.nfe.imprimir',
      name: 'Imprimir PDF',
      description: 'Imprimir documentos PDF de CT-e',
      category: 'NFe',
      action: 'export',
      resource: 'nfe',
      critical: false
    });

    this.register({
      id: 'admin.nfe.exportar',
      name: 'Exportar CSV',
      description: 'Exportar resultados em CSV',
      category: 'NFe',
      action: 'export',
      resource: 'nfe',
      critical: false
    });

    // Manifestos
    this.register({
      id: 'admin.manifestos.visualizar',
      name: 'Visualizar Manifestos',
      description: 'Acesso à página de manifestos',
      category: 'Manifestos',
      action: 'view',
      resource: 'manifestos',
      critical: false
    });

    // Relatórios
    this.register({
      id: 'admin.relatorios.visualizar',
      name: 'Visualizar Relatórios',
      description: 'Acessar página de relatórios',
      category: 'Relatórios',
      action: 'view',
      resource: 'relatorios',
      critical: false
    });

    this.register({
      id: 'admin.relatorios.exportar',
      name: 'Exportar Relatórios',
      description: 'Exportar dados de relatórios',
      category: 'Relatórios',
      action: 'export',
      resource: 'relatorios',
      critical: false
    });

    // Usuários
    this.register({
      id: 'admin.usuarios.visualizar',
      name: 'Visualizar Usuários',
      description: 'Acessar página de usuários',
      category: 'Usuários',
      action: 'view',
      resource: 'usuarios',
      critical: false
    });

    this.register({
      id: 'admin.usuarios.criar',
      name: 'Criar Usuários',
      description: 'Criar novos usuários',
      category: 'Usuários',
      action: 'create',
      resource: 'usuarios',
      critical: false
    });

    this.register({
      id: 'admin.usuarios.editar',
      name: 'Editar Usuários',
      description: 'Editar usuários existentes',
      category: 'Usuários',
      action: 'edit',
      resource: 'usuarios',
      critical: false
    });

    this.register({
      id: 'admin.usuarios.excluir',
      name: 'Excluir Usuários',
      description: 'Excluir usuários',
      category: 'Usuários',
      action: 'delete',
      resource: 'usuarios',
      critical: true
    });

    // Cargos
    this.register({
      id: 'admin.cargos.visualizar',
      name: 'Visualizar Cargos',
      description: 'Acessar página de cargos',
      category: 'Cargos',
      action: 'view',
      resource: 'cargos',
      critical: false
    });

    this.register({
      id: 'admin.cargos.criar',
      name: 'Criar Cargos',
      description: 'Criar novos cargos',
      category: 'Cargos',
      action: 'create',
      resource: 'cargos',
      critical: true
    });

    this.register({
      id: 'admin.cargos.editar',
      name: 'Editar Cargos',
      description: 'Editar cargos existentes',
      category: 'Cargos',
      action: 'edit',
      resource: 'cargos',
      critical: true
    });

    this.register({
      id: 'admin.cargos.excluir',
      name: 'Excluir Cargos',
      description: 'Excluir cargos',
      category: 'Cargos',
      action: 'delete',
      resource: 'cargos',
      critical: true
    });

    // Logs
    this.register({
      id: 'admin.logs.visualizar',
      name: 'Visualizar Logs',
      description: 'Acessar página de logs de atividade',
      category: 'Logs',
      action: 'view',
      resource: 'logs',
      critical: false
    });

    this.register({
      id: 'admin.logs.filtrar',
      name: 'Filtrar Logs',
      description: 'Filtrar logs por usuário, data e ação',
      category: 'Logs',
      action: 'view',
      resource: 'logs',
      critical: false
    });

    this.register({
      id: 'admin.logs.estatisticas',
      name: 'Estatísticas',
      description: 'Visualizar estatísticas e gráficos de logs',
      category: 'Logs',
      action: 'view',
      resource: 'logs',
      critical: false
    });

    this.register({
      id: 'admin.logs.exportar',
      name: 'Exportar Logs',
      description: 'Exportar logs do sistema',
      category: 'Logs',
      action: 'export',
      resource: 'logs',
      critical: false
    });

    // Erros
    this.register({
      id: 'admin.erros.visualizar',
      name: 'Visualizar Erros',
      description: 'Acessar página de logs de erros',
      category: 'Logs de Erros',
      action: 'view',
      resource: 'erros',
      critical: false
    });

    this.register({
      id: 'admin.erros.editar',
      name: 'Editar Erros',
      description: 'Editar status de erros (marcar como resolvido)',
      category: 'Logs de Erros',
      action: 'edit',
      resource: 'erros',
      critical: false
    });

    this.register({
      id: 'admin.erros.excluir',
      name: 'Excluir Erros',
      description: 'Excluir registros de erros',
      category: 'Logs de Erros',
      action: 'delete',
      resource: 'erros',
      critical: true
    });

    this.register({
      id: 'admin.erros.exportar',
      name: 'Exportar Erros',
      description: 'Exportar logs de erros',
      category: 'Logs de Erros',
      action: 'export',
      resource: 'erros',
      critical: false
    });

    // Configurações
    this.register({
      id: 'admin.configuracoes.visualizar',
      name: 'Visualizar Configurações',
      description: 'Acessar página de configurações',
      category: 'Configurações',
      action: 'view',
      resource: 'configuracoes',
      critical: false
    });

    this.register({
      id: 'admin.configuracoes.editar',
      name: 'Editar Configurações',
      description: 'Alterar configurações do sistema',
      category: 'Configurações',
      action: 'edit',
      resource: 'configuracoes',
      critical: true
    });

    // Empresas - Permissões específicas por empresa
    this.register({
      id: 'admin.empresas.fp-transcargas-190',
      name: 'FP TRANSCARGAS LTDA (190)',
      description: 'Acesso à empresa FP TRANSCARGAS LTDA - CNPJ 05805337000190',
      category: 'Empresas',
      action: 'view',
      resource: 'empresas',
      critical: false
    });

    this.register({
      id: 'admin.empresas.fp-transcargas-270',
      name: 'FP TRANSCARGAS LTDA (270)',
      description: 'Acesso à empresa FP TRANSCARGAS LTDA - CNPJ 05805337000270',
      category: 'Empresas',
      action: 'view',
      resource: 'empresas',
      critical: false
    });

    // Contas a Receber
    this.register({
      id: 'admin.contas-receber.visualizar',
      name: 'Visualizar Contas a Receber',
      description: 'Acessar página de contas a receber',
      category: 'Financeiro',
      action: 'view',
      resource: 'contas-receber',
      critical: false
    });

    this.register({
      id: 'admin.contas-receber.criar',
      name: 'Criar Contas',
      description: 'Criar novas contas a receber',
      category: 'Financeiro',
      action: 'create',
      resource: 'contas-receber',
      critical: false
    });

    this.register({
      id: 'admin.contas-receber.editar',
      name: 'Editar Contas',
      description: 'Editar contas a receber existentes',
      category: 'Financeiro',
      action: 'edit',
      resource: 'contas-receber',
      critical: false
    });

    this.register({
      id: 'admin.contas-receber.excluir',
      name: 'Excluir Contas',
      description: 'Excluir contas a receber',
      category: 'Financeiro',
      action: 'delete',
      resource: 'contas-receber',
      critical: false
    });

    this.register({
      id: 'admin.contas-receber.exportar',
      name: 'Exportar Contas',
      description: 'Exportar dados de contas a receber',
      category: 'Financeiro',
      action: 'export',
      resource: 'contas-receber',
      critical: false
    });

    // Malotes
    this.register({
      id: 'admin.malotes.visualizar',
      name: 'Visualizar Malotes',
      description: 'Acessar página de malotes',
      category: 'Financeiro',
      action: 'view',
      resource: 'malotes',
      critical: false
    });

    this.register({
      id: 'admin.malotes.criar',
      name: 'Criar Malotes',
      description: 'Criar novos malotes',
      category: 'Financeiro',
      action: 'create',
      resource: 'malotes',
      critical: false
    });

    this.register({
      id: 'admin.malotes.editar',
      name: 'Editar Malotes',
      description: 'Editar malotes existentes',
      category: 'Financeiro',
      action: 'edit',
      resource: 'malotes',
      critical: false
    });

    this.register({
      id: 'admin.malotes.excluir',
      name: 'Excluir Malotes',
      description: 'Excluir malotes',
      category: 'Financeiro',
      action: 'delete',
      resource: 'malotes',
      critical: false
    });

    // FlowBuilders
    this.register({
      id: 'admin.flowbuilders.visualizar',
      name: 'Visualizar FlowBuilders',
      description: 'Acessar página de flowbuilders',
      category: 'FlowBuilders',
      action: 'view',
      resource: 'flowbuilders',
      critical: false
    });

    this.register({
      id: 'admin.flowbuilders.criar',
      name: 'Criar Fluxos',
      description: 'Criar novos fluxos de automação',
      category: 'FlowBuilders',
      action: 'create',
      resource: 'flowbuilders',
      critical: false
    });

    this.register({
      id: 'admin.flowbuilders.editar',
      name: 'Editar Fluxos',
      description: 'Editar fluxos existentes',
      category: 'FlowBuilders',
      action: 'edit',
      resource: 'flowbuilders',
      critical: false
    });

    this.register({
      id: 'admin.flowbuilders.excluir',
      name: 'Excluir Fluxos',
      description: 'Excluir fluxos de automação',
      category: 'FlowBuilders',
      action: 'delete',
      resource: 'flowbuilders',
      critical: true
    });

    this.register({
      id: 'admin.flowbuilders.executar',
      name: 'Executar Fluxos',
      description: 'Executar fluxos de automação',
      category: 'FlowBuilders',
      action: 'manage',
      resource: 'flowbuilders',
      critical: false
    });

    // Chat Interno
    this.register({
      id: 'admin.chat-interno.visualizar',
      name: 'Visualizar Chat Interno',
      description: 'Acessar página de chat interno',
      category: 'Chat Interno',
      action: 'view',
      resource: 'chat-interno',
      critical: false
    });

    this.register({
      id: 'admin.chat-interno.enviar',
      name: 'Enviar Mensagens',
      description: 'Enviar mensagens no chat interno',
      category: 'Chat Interno',
      action: 'create',
      resource: 'chat-interno',
      critical: false
    });


    // Solicitações de Acesso
    this.register({
      id: 'admin.solicitacoes-acessos.visualizar',
      name: 'Visualizar Solicitações de Acesso',
      description: 'Acessar página de solicitações de acesso',
      category: 'Sistema',
      action: 'view',
      resource: 'solicitacoes-acessos',
      critical: false
    });

    this.register({
      id: 'admin.solicitacoes-acessos.excluir',
      name: 'Excluir Solicitações de Acesso',
      description: 'Excluir solicitações de acesso',
      category: 'Sistema',
      action: 'delete',
      resource: 'solicitacoes-acessos',
      critical: false
    });

    // Ocorrências
    this.register({
      id: 'admin.ocorrencias.visualizar',
      name: 'Visualizar Ocorrências',
      description: 'Acessar página de ocorrências',
      category: 'Ocorrências',
      action: 'view',
      resource: 'ocorrencias',
      critical: false
    });

    this.register({
      id: 'admin.ocorrencias.criar',
      name: 'Criar Ocorrências',
      description: 'Criar novas ocorrências',
      category: 'Ocorrências',
      action: 'create',
      resource: 'ocorrencias',
      critical: false
    });

    this.register({
      id: 'admin.ocorrencias.editar',
      name: 'Editar Ocorrências',
      description: 'Editar ocorrências existentes',
      category: 'Ocorrências',
      action: 'edit',
      resource: 'ocorrencias',
      critical: false
    });

    this.register({
      id: 'admin.ocorrencias.excluir',
      name: 'Excluir Ocorrências',
      description: 'Excluir ocorrências',
      category: 'Ocorrências',
      action: 'delete',
      resource: 'ocorrencias',
      critical: false
    });

    this.register({
      id: 'admin.ocorrencias.alterar_status',
      name: 'Alterar Status',
      description: 'Alterar status de ocorrências',
      category: 'Ocorrências',
      action: 'edit',
      resource: 'ocorrencias',
      critical: false
    });

    // WhatsApp Logs
    this.register({
      id: 'admin.whatsapp-logs.visualizar',
      name: 'Visualizar Logs WhatsApp',
      description: 'Acessar página de logs do WhatsApp',
      category: 'WhatsApp Logs',
      action: 'view',
      resource: 'whatsapp-logs',
      critical: false
    });

    this.register({
      id: 'admin.whatsapp-logs.exportar',
      name: 'Exportar Logs WhatsApp',
      description: 'Exportar logs do WhatsApp',
      category: 'WhatsApp Logs',
      action: 'export',
      resource: 'whatsapp-logs',
      critical: false
    });

    // Logs de Atividade
    this.register({
      id: 'admin.logs-atividades.visualizar',
      name: 'Visualizar Logs de Atividade',
      description: 'Acessar página de logs de atividade do sistema',
      category: 'Logs Atividade',
      action: 'view',
      resource: 'logs-atividades',
      critical: false
    });

    this.register({
      id: 'admin.logs-atividades.exportar',
      name: 'Exportar Logs de Atividade',
      description: 'Exportar logs de atividade',
      category: 'Logs Atividade',
      action: 'export',
      resource: 'logs-atividades',
      critical: false
    });

    // Logs de Mensagens Rápidas
    this.register({
      id: 'admin.logs-mensagens-rapidas.visualizar',
      name: 'Visualizar Logs Mensagens Rápidas',
      description: 'Acessar página de logs de mensagens rápidas',
      category: 'Logs Mensagens',
      action: 'view',
      resource: 'logs-mensagens-rapidas',
      critical: false
    });

    this.register({
      id: 'admin.logs-mensagens-rapidas.exportar',
      name: 'Exportar Logs Mensagens Rápidas',
      description: 'Exportar logs de mensagens rápidas',
      category: 'Logs Mensagens',
      action: 'export',
      resource: 'logs-mensagens-rapidas',
      critical: false
    });

    // Logs de Ocorrências
    this.register({
      id: 'admin.logs-ocorrencias.visualizar',
      name: 'Visualizar Logs de Ocorrências',
      description: 'Acessar página de logs de ocorrências',
      category: 'Logs Ocorrências',
      action: 'view',
      resource: 'logs-ocorrencias',
      critical: false
    });

    this.register({
      id: 'admin.logs-ocorrencias.exportar',
      name: 'Exportar Logs de Ocorrências',
      description: 'Exportar logs de ocorrências',
      category: 'Logs Ocorrências',
      action: 'export',
      resource: 'logs-ocorrencias',
      critical: false
    });

    // ==================== ÁREA DO CLIENTE ====================
    // Permissões para o painel de clientes

    // Cliente: Documentos
    this.register({
      id: 'clientes.documentos.visualizar',
      name: 'Visualizar Documentos',
      description: 'Acessar página de documentos no painel do cliente',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-documentos',
      critical: false
    });

    this.register({
      id: 'clientes.documentos.baixar',
      name: 'Baixar Documentos',
      description: 'Fazer download de documentos disponíveis',
      category: 'Área do Cliente',
      action: 'export',
      resource: 'cliente-documentos',
      critical: false
    });

    // Dashboard Cliente
    this.register({
      id: 'clientes.dashboard.visualizar',
      name: 'Visualizar Dashboard',
      description: 'Acesso ao dashboard do painel de cliente',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-dashboard',
      critical: false
    });

    this.register({
      id: 'clientes.dashboard.fretes',
      name: 'Visualizar Fretes',
      description: 'Visualizar fretes dos últimos 7, 15 e 30 dias no dashboard',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-dashboard',
      critical: false
    });

    // Minhas Cotações
    this.register({
      id: 'clientes.cotacoes.visualizar',
      name: 'Visualizar Minhas Cotações',
      description: 'Acessar página de cotações do cliente',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-cotacoes',
      critical: false
    });

    this.register({
      id: 'clientes.cotacoes.criar',
      name: 'Criar Cotações',
      description: 'Criar novas cotações no painel do cliente',
      category: 'Área do Cliente',
      action: 'create',
      resource: 'cliente-cotacoes',
      critical: false
    });

    this.register({
      id: 'clientes.cotacoes.exportar',
      name: 'Exportar Cotações',
      description: 'Exportar dados das cotações do cliente',
      category: 'Área do Cliente',
      action: 'export',
      resource: 'cliente-cotacoes',
      critical: false
    });

    // Minhas Coletas
    this.register({
      id: 'clientes.coletas.visualizar',
      name: 'Visualizar Minhas Coletas',
      description: 'Acessar página de coletas do cliente',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-coletas',
      critical: false
    });

    this.register({
      id: 'clientes.coletas.criar',
      name: 'Criar Coletas',
      description: 'Criar novas solicitações de coleta',
      category: 'Área do Cliente',
      action: 'create',
      resource: 'cliente-coletas',
      critical: false
    });

    this.register({
      id: 'clientes.coletas.exportar',
      name: 'Exportar Coletas',
      description: 'Exportar dados das coletas do cliente',
      category: 'Área do Cliente',
      action: 'export',
      resource: 'cliente-coletas',
      critical: false
    });

    // Financeiro Cliente
    this.register({
      id: 'clientes.financeiro.visualizar',
      name: 'Visualizar Financeiro',
      description: 'Acessar página de financeiro do cliente',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-financeiro',
      critical: false
    });

    this.register({
      id: 'clientes.financeiro.boletos',
      name: 'Visualizar Boletos',
      description: 'Visualizar e baixar boletos',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-financeiro',
      critical: false
    });

    this.register({
      id: 'clientes.financeiro.faturas',
      name: 'Visualizar Faturas',
      description: 'Visualizar faturas e histórico',
      category: 'Área do Cliente',
      action: 'view',
      resource: 'cliente-financeiro',
      critical: false
    });

    this.register({
      id: 'clientes.financeiro.exportar',
      name: 'Exportar Financeiro',
      description: 'Exportar dados financeiros do cliente',
      category: 'Área do Cliente',
      action: 'export',
      resource: 'cliente-financeiro',
      critical: false
    });

    // DRE - Demonstrativo de Resultado do Exercício
    this.register({
      id: 'admin.dre.visualizar',
      name: 'Visualizar DRE',
      description: 'Acessar página de DRE',
      category: 'DRE',
      action: 'view',
      resource: 'dre',
      critical: false
    });

    this.register({
      id: 'admin.dre.exportar',
      name: 'Exportar DRE',
      description: 'Exportar dados do DRE (CSV/PDF)',
      category: 'DRE',
      action: 'export',
      resource: 'dre',
      critical: false
    });

    this.register({
      id: 'admin.dre.analise-ia',
      name: 'Análise com IA',
      description: 'Usar análise com inteligência artificial',
      category: 'DRE',
      action: 'manage',
      resource: 'dre',
      critical: false
    });

    // Calendário Financeiro
    this.register({
      id: 'admin.calendario-financeiro.visualizar',
      name: 'Visualizar Calendário Financeiro',
      description: 'Acessar página do calendário financeiro',
      category: 'Calendário Financeiro',
      action: 'view',
      resource: 'calendario-financeiro',
      critical: false
    });

    this.register({
      id: 'admin.calendario-financeiro.exportar',
      name: 'Exportar Calendário Financeiro',
      description: 'Exportar dados do calendário (CSV/PDF)',
      category: 'Calendário Financeiro',
      action: 'export',
      resource: 'calendario-financeiro',
      critical: false
    });

    // Vagas de Emprego
    this.register({
      id: 'admin.vagas.visualizar',
      name: 'Visualizar Vagas',
      description: 'Acessar página de vagas de emprego',
      category: 'Vagas de Emprego',
      action: 'view',
      resource: 'vagas',
      critical: false
    });

    this.register({
      id: 'admin.vagas.criar',
      name: 'Criar Vagas',
      description: 'Criar novas vagas de emprego',
      category: 'Vagas de Emprego',
      action: 'create',
      resource: 'vagas',
      critical: false
    });

    this.register({
      id: 'admin.vagas.editar',
      name: 'Editar Vagas',
      description: 'Editar vagas existentes',
      category: 'Vagas de Emprego',
      action: 'edit',
      resource: 'vagas',
      critical: false
    });

    this.register({
      id: 'admin.vagas.excluir',
      name: 'Excluir Vagas',
      description: 'Excluir vagas de emprego',
      category: 'Vagas de Emprego',
      action: 'delete',
      resource: 'vagas',
      critical: false
    });

  }

  /**
   * Registra uma nova permissão no sistema
   */
  register(permission: PermissionDefinition): void {
    this.permissions.set(permission.id, permission);
  }

  /**
   * Remove uma permissão do registro
   */
  unregister(permissionId: string): void {
    this.permissions.delete(permissionId);
  }

  /**
   * Obtém uma permissão específica
   */
  get(permissionId: string): PermissionDefinition | undefined {
    return this.permissions.get(permissionId);
  }

  /**
   * Obtém todas as permissões registradas
   */
  getAll(): PermissionDefinition[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Obtém permissões por categoria
   */
  getByCategory(category: PermissionCategory): PermissionDefinition[] {
    return this.getAll().filter(p => p.category === category);
  }

  /**
   * Obtém permissões críticas
   */
  getCritical(): PermissionDefinition[] {
    return this.getAll().filter(p => p.critical);
  }

  /**
   * Verifica se uma permissão existe
   */
  exists(permissionId: string): boolean {
    return this.permissions.has(permissionId);
  }

  /**
   * Obtém o mapeamento de páginas para permissões
   */
  getSidebarPageMapping(): Record<string, string> {
    return {
      // Admin pages
      'dashboard': 'admin.dashboard.visualizar',
      'cotacoes': 'admin.cotacoes.visualizar',
      'coletas': 'admin.coletas.visualizar',
      'ranking': 'admin.ranking.visualizar',
      'contacts': 'admin.contatos.visualizar',
      'erros-envio': 'admin.erros-envio.visualizar',
      'whatsapp': 'admin.whatsapp.visualizar',
      'filas-whatsapp': 'admin.whatsapp.filas',
      'mensagens-rapidas': 'admin.mensagens-rapidas.visualizar',
      'cliente-acesso': 'admin.clientes.visualizar',
      'consultar-nfe': 'admin.nfe.visualizar',
      'manifestos': 'admin.manifestos.visualizar',
      'reports': 'admin.relatorios.visualizar',
      'usuarios': 'admin.usuarios.visualizar',
      'cargos': 'admin.cargos.visualizar',
      'logs': 'admin.logs-atividades.visualizar',
      'logs-atividades': 'admin.logs-atividades.visualizar',
      'erros': 'admin.erros.visualizar',
      'whatsapp-logs': 'admin.whatsapp-logs.visualizar',
      'logs-mensagens-rapidas': 'admin.logs-mensagens-rapidas.visualizar',
      'logs-ocorrencias': 'admin.logs-ocorrencias.visualizar',
      'configuracoes': 'admin.configuracoes.visualizar',
      'contas-receber': 'admin.contas-receber.visualizar',
      'solicitacoes-documentos': 'admin.solicitacoes-documentos.visualizar',
      'ocorrencias': 'admin.ocorrencias.visualizar',
      'dre': 'admin.dre.visualizar',
      'calendario-financeiro': 'admin.calendario-financeiro.visualizar',
      // Cliente pages
      'area-cliente-dashboard': 'clientes.dashboard.visualizar',
      'area-cliente-cotacoes': 'clientes.cotacoes.visualizar',
      'area-cliente-coletas': 'clientes.coletas.visualizar',
      'area-cliente-financeiro': 'clientes.financeiro.visualizar',
      // Campanhas
      'campanhas-whatsapp': 'admin.campanhas.visualizar',
      'logs-campanhas': 'admin.logs-campanhas.visualizar',
      // Vagas
      'vagas': 'admin.vagas.visualizar'
    };
  }
}

export const permissionRegistry = new PermissionRegistry();