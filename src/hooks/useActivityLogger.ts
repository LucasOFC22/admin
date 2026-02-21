import { useCallback } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { authActivityLogService } from '@/services/auth/activityLogService';

export type ActivityAction = 
  | 'cargo_criado' | 'cargo_atualizado' | 'cargo_excluido'
  | 'cotacao_visualizada' | 'cotacao_atualizada' | 'cotacoes_pesquisadas' | 'proposta_enviada'
  | 'usuario_criado' | 'usuario_atualizado' | 'usuario_excluido'
  | 'coletas_atualizadas' | 'configuracao_sistema_alterada'
  | 'cliente_acesso_atualizado' | 'acesso_cliente_reativado' | 'acesso_cliente_suspenso' | 'acesso_cliente_removido'
  | 'status_cotacao_atualizado'
  | string; // Permitir valores customizados

export type ActivityModule = 
  | 'cargos' | 'cotacoes' | 'usuarios' | 'coletas' 
  | 'clientes-acesso' | 'configuracoes'
  | string; // Permitir valores customizados

interface LogActivityParams {
  acao: ActivityAction;
  modulo: ActivityModule;
  detalhes?: Record<string, any>;
}

/**
 * Hook para logging de atividades com usuário autenticado
 * 
 * - Verifica sessão Supabase antes de inserir log
 * - Usa supabase_id (UUID) do usuário
 * - Silencia erros para não interromper fluxo principal
 */
export const useActivityLogger = () => {
  const { user } = useUnifiedAuth();

  const logActivity = useCallback(async (params: LogActivityParams): Promise<void> => {
    try {
      // Verificar se há sessão Supabase ativa
      const supabase = requireAuthenticatedClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Sem sessão Supabase - não registrar log
        return;
      }

      // Usar id da tabela usuarios (compatível com FK logs_atividade_usuario_id_fkey)
      const userId = user?.id;
      
      if (!userId) {
        return;
      }

      await authActivityLogService.logActivity({
        usuario_id: userId,
        ...params
      });
    } catch {
      // Silenciar erros - logging não deve quebrar fluxo principal
    }
  }, [user?.id]);

  return { logActivity };
};
