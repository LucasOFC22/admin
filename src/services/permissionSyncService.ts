import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { permissionsMap } from '@/config/permissionsMap';
import { Permission } from '@/types/permissions';

export interface SyncResult {
  added: string[];
  updated: string[];
  deactivated: string[];
  errors: string[];
}

/**
 * Serviço responsável por sincronizar permissões do código com o banco de dados
 */
class PermissionSyncService {
  private isInitialized = false;
  private syncPromise: Promise<SyncResult> | null = null;

  /**
   * Inicializa o serviço e executa a sincronização automática
   */
  async initialize(): Promise<SyncResult> {
    if (this.isInitialized) {
      return this.syncPromise || Promise.resolve({ added: [], updated: [], deactivated: [], errors: [] });
    }

    this.syncPromise = this.syncPermissions();
    const result = await this.syncPromise;
    this.isInitialized = true;
    
    return result;
  }

  /**
   * Sincroniza permissões do registry with o banco de dados
   */
  async syncPermissions(): Promise<SyncResult> {
    const result: SyncResult = {
      added: [],
      updated: [],
      deactivated: [],
      errors: []
    };

    try {
      const supabase = requireAuthenticatedClient();
      // 1. Buscar permissões existentes no banco
      const { data: existingPermissions, error: fetchError } = await supabase
        .schema('public')
        .from('permissions')
        .select('*');

      if (fetchError) {
        result.errors.push(`Erro ao buscar permissões: ${fetchError.message}`);
        return result;
      }

      const existingPermissionsTyped = (existingPermissions || []) as unknown as Permission[];
      const existingMap = new Map(existingPermissionsTyped.map(p => [p.id, p]));

      // 2. Obter permissões do permissionsMap
      const registryPermissions = permissionsMap.flatMap(group => 
        group.permissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          action: p.action,
          resource: p.resource,
          critical: p.critical ?? false
        }))
      );

      // 3. Identificar permissões para adicionar/atualizar
      const permissionsToUpsert: Permission[] = [];

      for (const regPerm of registryPermissions) {
        const existing = existingMap.get(regPerm.id);
        
        if (!existing) {
          // Nova permissão
          permissionsToUpsert.push({
            id: regPerm.id,
            name: regPerm.name,
            description: regPerm.description,
            category: regPerm.category,
            action: regPerm.action,
            resource: regPerm.resource,
            active: true,
            critical: regPerm.critical,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          result.added.push(regPerm.id);
        } else {
          // Verificar se precisa atualizar
          const needsUpdate = 
            existing.name !== regPerm.name ||
            existing.description !== regPerm.description ||
            existing.category !== regPerm.category ||
            existing.action !== regPerm.action ||
            existing.resource !== regPerm.resource ||
            existing.critical !== regPerm.critical ||
            !existing.active; // Reativar se estava desativada

          if (needsUpdate) {
            permissionsToUpsert.push({
              ...existing,
              name: regPerm.name,
              description: regPerm.description,
              category: regPerm.category,
              action: regPerm.action,
              resource: regPerm.resource,
              critical: regPerm.critical,
              active: true,
              updated_at: new Date().toISOString()
            });
            result.updated.push(regPerm.id);
          }
        }
      }

      // 4. Upsert permissões (adicionar/atualizar)
      if (permissionsToUpsert.length > 0) {
        const supabaseUpsert = requireAuthenticatedClient();
        const { error: upsertError } = await supabaseUpsert
          .schema('public')
          .from('permissions')
          .upsert(permissionsToUpsert as any, { onConflict: 'id' });

        if (upsertError) {
          result.errors.push(`Erro ao sincronizar permissões: ${upsertError.message}`);
        }
      }

      // 5. Desativar permissões que não existem mais no registry
      const registryIds = new Set(registryPermissions.map(p => p.id));
      const permissionsToDeactivate = existingPermissionsTyped
        .filter(p => !registryIds.has(p.id) && p.active)
        .map(p => p.id);

      if (permissionsToDeactivate.length > 0) {
        const supabaseDeact = requireAuthenticatedClient();
        const { error: deactivateError } = await supabaseDeact
          .schema('public')
          .from('permissions')
          .update({ 
            active: false, 
            updated_at: new Date().toISOString() 
          })
          .in('id', permissionsToDeactivate);

        if (deactivateError) {
          result.errors.push(`Erro ao desativar permissões: ${deactivateError.message}`);
        } else {
          result.deactivated.push(...permissionsToDeactivate);
        }
      }

    } catch (error) {
      result.errors.push(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  /**
   * Força uma nova sincronização
   */
  async forcSync(): Promise<SyncResult> {
    this.isInitialized = false;
    this.syncPromise = null;
    return this.initialize();
  }

  /**
   * Verifica se as permissões estão sincronizadas
   */
  async checkSyncStatus(): Promise<boolean> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data: dbPermissions } = await supabase
        .schema('public')
        .from('permissions')
        .select('id, active')
        .eq('active', true);

      const registryPermissions = permissionsMap.flatMap(group => 
        group.permissions.map(p => ({ id: p.id }))
      );
      
      if (!dbPermissions) return false;
      
      const dbPermissionsTyped = (dbPermissions || []) as unknown as Array<Pick<Permission, 'id' | 'active'>>;
      const dbIds = new Set(dbPermissionsTyped.map(p => p.id));
      const registryIds = new Set(registryPermissions.map(p => p.id));

      // Verifica se todos os IDs do registry estão no banco
      for (const id of registryIds) {
        if (!dbIds.has(id)) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtém estatísticas de sincronização
   */
  async getSyncStats() {
    try {
      const supabase = requireAuthenticatedClient();
      const [{ data: totalDb }, { data: activeDb }] = await Promise.all([
        supabase.schema('public').from('permissions').select('id', { count: 'exact', head: true }),
        supabase.schema('public').from('permissions').select('id', { count: 'exact', head: true }).eq('active', true)
      ]);

      const registryPermissions = permissionsMap.flatMap(group => 
        group.permissions.map(p => ({ id: p.id }))
      );
      const registryCount = registryPermissions.length;

      return {
        registry: registryCount,
        database: {
          total: totalDb?.length || 0,
          active: activeDb?.length || 0,
          inactive: (totalDb?.length || 0) - (activeDb?.length || 0)
        },
        synchronized: await this.checkSyncStatus()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

export const permissionSyncService = new PermissionSyncService();