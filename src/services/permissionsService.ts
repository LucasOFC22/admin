export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  type?: string;
  created_at?: string;
}

class PermissionsService {
  private permissions: Permission[] = [];

  private getDefaultPermissions(): Permission[] {
    return [
      // Permissões administrativas
      { id: 'admin.full', name: 'Acesso Total', description: 'Acesso completo ao sistema', category: 'admin', type: 'system' },
      { id: 'users.read', name: 'Visualizar Usuários', description: 'Visualizar lista de usuários', category: 'users', type: 'system' },
      { id: 'users.write', name: 'Gerenciar Usuários', description: 'Criar, editar e excluir usuários', category: 'users', type: 'system' },
      { id: 'quotes.read', name: 'Visualizar Cotações', description: 'Visualizar cotações', category: 'quotes', type: 'system' },
      { id: 'quotes.write', name: 'Gerenciar Cotações', description: 'Criar e editar cotações', category: 'quotes', type: 'system' },
      { id: 'contacts.read', name: 'Visualizar Contatos', description: 'Visualizar contatos', category: 'contacts', type: 'system' },
      { id: 'contacts.write', name: 'Gerenciar Contatos', description: 'Responder e gerenciar contatos', category: 'contacts', type: 'system' },
      { id: 'reports.read', name: 'Visualizar Relatórios', description: 'Acessar relatórios', category: 'reports', type: 'system' },
      { id: 'cargos.read', name: 'Visualizar Cargos', description: 'Visualizar cargos e permissões', category: 'admin', type: 'system' },
      { id: 'cargos.write', name: 'Gerenciar Cargos', description: 'Criar, editar e excluir cargos', category: 'admin', type: 'system' },
      { id: 'logs.read', name: 'Visualizar Logs', description: 'Acessar logs do sistema', category: 'admin', type: 'system' },
      { id: 'config.write', name: 'Configurações', description: 'Alterar configurações do sistema', category: 'admin', type: 'system' },
      
      // Permissões padrão do WhatsApp (serão sincronizadas com as categorias)
      { id: 'whatsapp.novo', name: 'Novo', description: 'Mensagens não lidas', category: 'whatsapp', type: 'kanban' },
      { id: 'whatsapp.em_atendimento', name: 'Em Atendimento', description: 'Conversas em andamento', category: 'whatsapp', type: 'kanban' },
      { id: 'whatsapp.aguardando', name: 'Aguardando', description: 'Aguardando resposta do cliente', category: 'whatsapp', type: 'kanban' },
      { id: 'whatsapp.finalizado', name: 'Finalizado', description: 'Atendimento concluído', category: 'whatsapp', type: 'kanban' }
    ];
  }

  private generateWhatsAppPermissions(categories: any[]): Permission[] {
    return categories.map(category => ({
      id: `whatsapp.${category.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: category.name,
      description: category.description || `Categoria ${category.name}`,
      category: 'whatsapp',
      type: 'kanban'
    }));
  }

  async getPermissions(): Promise<Permission[]> {
    if (this.permissions.length === 0) {
      this.permissions = this.getDefaultPermissions();
    }
    return this.permissions;
  }

  async syncPermissions(): Promise<void> {
    try {
      // Importar o serviço do kanban para buscar categorias do Supabase
      const { kanbanWhatsAppService } = await import('./kanbanWhatsAppService');
      const whatsappCategories = await kanbanWhatsAppService.getCategories();

      // Gerar permissões do WhatsApp baseadas nas categorias
      const whatsappPermissions = this.generateWhatsAppPermissions(whatsappCategories);
      
      // Combinar com permissões do sistema
      const systemPermissions = this.getDefaultPermissions().filter(p => p.type === 'system');
      
      this.permissions = [...systemPermissions, ...whatsappPermissions];
    } catch (error) {
      console.error('❌ Erro na sincronização de permissões:', error);
      this.permissions = this.getDefaultPermissions();
    }
  }

  async updateWhatsAppPermissions(): Promise<void> {
    try {
      // Regenerar permissões baseadas nas categorias do Supabase
      await this.syncPermissions();
    } catch (error) {
      console.error('❌ Erro ao atualizar permissões do WhatsApp:', error);
    }
  }

  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(p => p.category === category);
  }

  getWhatsAppPermissions(): Permission[] {
    return this.getPermissionsByCategory('whatsapp');
  }
}

export const permissionsService = new PermissionsService();