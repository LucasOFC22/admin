import { Permission, PermissionGroup, PermissionCategory, CargoPermission } from '@/types/permissions';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { permissionsMap } from '@/config/permissionsMap';
import { permissionSyncService } from './permissionSyncService';
import { logService } from './logger/logService';
/**
 * Novo serviço de permissões que trabalha diretamente com o banco de dados
 * Substitui o antigo advancedPermissionsService com funcionalidade automática
 */
class DatabasePermissionsService {
  private permissionsCache: Permission[] = [];
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos
  private lastCacheUpdate = 0;

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    try {
      // 1. Sincronizar permissões do registry com o banco
      await permissionSyncService.initialize();
      
      // 2. Carregar permissões em cache
      await this.loadPermissions();
      
    } catch (error) {
      console.error('Erro ao inicializar Database Permissions Service:', error);
    }
  }

  /**
   * Carrega permissões do banco de dados
   */
  async loadPermissions() {
    const client = requireAuthenticatedClient();
    const { data, error } = await client
      .schema('public')
      .from('permissions')
      .select('*')
      .order('category', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Erro ao carregar permissões:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Fallback para permissões do permissionsMap (quando banco não está disponível)
   */
  private getFallbackPermissions(): Permission[] {
    const mapPermissions = permissionsMap.flatMap(group => 
      group.permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        action: p.action,
        resource: p.resource,
        active: p.enabled ?? true,
        critical: p.critical ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    );
    return mapPermissions;
  }

  /**
   * Obtém grupos de permissões usando permissionsMap na ordem e estrutura original
   */
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    // SEMPRE usar permissionsMap como fonte principal para manter ordem e estrutura
    return permissionsMap.map(group => ({
      category: group.category,
      label: group.category,
      description: group.description,
      icon: group.icon,
      permissions: group.permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        action: p.action,
        resource: p.resource,
        active: p.enabled ?? true,
        critical: p.critical ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    }));
  }

  /**
   * Obtém permissões de um cargo específico
   */
  async getCargoPermissions(cargoId: number): Promise<string[]> {
    try {
      const client = requireAuthenticatedClient();
      
      // Usar maybeSingle() para evitar erro PGRST116 quando cargo não existe
      const { data, error } = await client
        .schema('public')
        .from('cargos')
        .select('permissoes')
        .eq('id', cargoId)
        .maybeSingle();

      if (error) {
        console.warn('[DatabasePermissions] Erro ao buscar permissões do cargo:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      return data.permissoes || [];
    } catch (error) {
      console.warn('[DatabasePermissions] Falha ao carregar permissões do cargo:', error);
      return [];
    }
  }

  /**
   * Atualiza permissões de um cargo
   */
  async updateCargoPermissions(cargoId: number, permissionIds: string[]): Promise<void> {
    try {
      // Validar se todas as permissões existem
      const permissions = await this.loadPermissions();
      const validPermissionIds = new Set(permissions.map(p => p.id));
      const invalidIds = permissionIds.filter(id => !validPermissionIds.has(id));
      
      if (invalidIds.length > 0) {
        throw new Error(`Permissões inválidas: ${invalidIds.join(', ')}`);
      }

      // Buscar dados anteriores do cargo para log (incluindo permissões)
      const client = requireAuthenticatedClient();
      const { data: cargoAnterior } = await client
        .schema('public')
        .from('cargos')
        .select('nome, permissoes, departamento')
        .eq('id', cargoId)
        .single();

      const permissoesAnteriores = cargoAnterior?.permissoes || [];

      // Atualizar permissões do cargo
      const { error } = await client
        .schema('public')
        .from('cargos')
        .update({ 
          permissoes: permissionIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', cargoId);

      if (error) {
        throw error;
      }

      // Calcular diferenças para log detalhado
      const permissoesAdicionadas = permissionIds.filter(p => !permissoesAnteriores.includes(p));
      const permissoesRemovidas = permissoesAnteriores.filter((p: string) => !permissionIds.includes(p));

      // Registrar log de alteração de permissões
      await logService.logCargo({
        tipo_de_acao: 'editar_permissoes',
        cargo_id: cargoId.toString(),
        departamento_id: cargoAnterior?.departamento?.toString() || null,
        dados_anteriores: {
          cargo_nome: cargoAnterior?.nome,
          permissoes: permissoesAnteriores,
          total_permissoes: permissoesAnteriores.length
        },
        dados_novos: {
          cargo_nome: cargoAnterior?.nome,
          permissoes: permissionIds,
          total_permissoes: permissionIds.length,
          permissoes_adicionadas: permissoesAdicionadas,
          permissoes_removidas: permissoesRemovidas
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem uma permissão específica
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Verifica se usuário tem alguma das permissões especificadas
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Verifica se usuário tem todas as permissões especificadas
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Verifica se uma permissão é crítica
   */
  async isCriticalPermission(permissionId: string): Promise<boolean> {
    const permissions = await this.loadPermissions();
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.critical || false;
  }

  /**
   * Obtém o mapeamento de páginas do sidebar para permissões
   * Mapeamento explícito entre IDs do sidebar e permissões de visualização
   */
  getSidebarTabPermissionMapping(): Record<string, string> {
    return {
      // Principal
      'dashboard': 'admin.dashboard.visualizar',
      
      // Operacional
      'cotacoes': 'admin.cotacoes.visualizar',
      'coletas': 'admin.coletas.visualizar',
      'manifestos': 'admin.manifestos.visualizar',
      'rastreamento': 'admin.rastreamento.visualizar',
      'consultar-nfe': 'admin.nfe.visualizar',
      'avarias': 'admin.avarias.visualizar',
      'baixa-rapida-cte': 'admin.baixa_rapida.visualizar',
      
      // Comunicação / WhatsApp
      'whatsapp': 'admin.whatsapp.visualizar',
      'whatsapp-kanban': 'admin.whatsapp-kanban.visualizar',
      'mensagens-rapidas': 'admin.mensagens-rapidas.visualizar',
      'whatsapp-contatos': 'admin.whatsapp.contatos.visualizar',
      'tags-kanban': 'admin.tags-kanban.visualizar',
      'chat-interno': 'admin.chat-interno.visualizar',
      'whatsapp-filas': 'admin.whatsapp.filas.visualizar',
      'filas-whatsapp': 'admin.whatsapp.filas.visualizar',
      
      // Clientes
      'contacts': 'admin.contatos.visualizar',
      'solicitacoes-documentos': 'admin.solicitacoes-documentos.visualizar',
      'ocorrencias': 'admin.ocorrencias.visualizar',
      
      // Financeiro
      'contas-receber': 'admin.contas-receber.visualizar',
      'calendario-financeiro': 'admin.calendario-financeiro.visualizar',
      'dre': 'admin.dre.visualizar',
      'malotes': 'admin.malotes.visualizar',
      
      // Sistema
      'gerenciar-usuarios': 'admin.usuarios.visualizar',
      'cargos': 'admin.cargos.visualizar',
      'solicitacoes-acessos': 'admin.solicitacoes-acessos.visualizar',
      'flowbuilders': 'admin.flowbuilders.visualizar',
      'conexoes': 'admin.whatsapp.conexoes.visualizar',
      'configuracoes': 'admin.configuracoes.visualizar',
      
      // Programador
      'erros': 'admin.erros.visualizar',
      'error-logs': 'admin.erros.visualizar',
      'backups': 'admin.backups.visualizar',
      
      // Campanhas WhatsApp
      'campanhas-whatsapp': 'admin.campanhas.visualizar',
      'logs-campanhas': 'admin.logs-campanhas.visualizar',
      
      // Logs e Monitoramento - Central
      'logs-central': 'admin.logs-central.visualizar',
      'logs': 'admin.logs-atividades.visualizar',
      'logs-atividades': 'admin.logs-atividades.visualizar',
      'logs-autenticacao': 'admin.logs-autenticacao.visualizar',
      'logs-email': 'admin.logs-email.visualizar',
      'whatsapp-logs': 'admin.whatsapp-logs.visualizar',
      'logs-mensagens-rapidas': 'admin.logs-mensagens-rapidas.visualizar',
      'logs-ocorrencias': 'admin.logs-ocorrencias.visualizar',
      'flow-logs': 'admin.flow-logs.visualizar',
      
      // Logs por Módulo
      'logs-usuarios': 'admin.logs-usuarios.visualizar',
      'logs-cargos': 'admin.logs-cargos.visualizar',
      'logs-contatos': 'admin.logs-contatos.visualizar',
      'logs-configuracoes': 'admin.logs-configuracoes.visualizar',
      'logs-chat-interno': 'admin.logs-chat-interno.visualizar',
      'logs-malotes': 'admin.logs-malotes.visualizar',
      'logs-conexoes': 'admin.logs-conexoes.visualizar',
      'logs-tags': 'admin.logs-tags.visualizar',
      'logs-documentos': 'admin.logs-documentos.visualizar',
      'logs-filas': 'admin.logs-filas.visualizar',
      'logs-sistema': 'admin.logs-sistema.visualizar',
      'logs-coleta': 'admin.logs-coleta.visualizar',
      'vagas': 'admin.vagas.visualizar',
      'logs-vagas': 'admin.logs-vagas.visualizar',
      
      // Documentos Clientes
      'documentos-clientes': 'admin.documentos-clientes.visualizar',
      'auditoria-seguranca': 'admin.auditoria.visualizar'
    };
  }

  /**
   * Invalida o cache de permissões
   */
  invalidateCache(): void {
    this.permissionsCache = [];
    this.lastCacheUpdate = 0;
  }

  /**
   * Força recarregamento das permissões
   */
  async refreshPermissions(): Promise<Permission[]> {
    this.invalidateCache();
    return this.loadPermissions();
  }

  /**
   * Obtém estatísticas do sistema de permissões
   */
  async getSystemStats() {
    const [syncStats, permissions] = await Promise.all([
      permissionSyncService.getSyncStats(),
      this.loadPermissions()
    ]);

    return {
      sync: syncStats,
      permissions: {
        total: permissions.length,
        byCategory: permissions.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        critical: permissions.filter(p => p.critical).length
      }
    };
  }
}

export const databasePermissionsService = new DatabasePermissionsService();
