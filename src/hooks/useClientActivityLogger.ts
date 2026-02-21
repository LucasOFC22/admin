import { useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export type ClientActivityAction =
  // Autenticação
  | 'cliente_login_tentativa'
  | 'cliente_login_sucesso'
  | 'cliente_login_falha'
  | 'cliente_logout'
  | 'cliente_acesso_negado'
  | 'cliente_trocar_documento'
  // Navegação
  | 'cliente_acesso_dashboard'
  | 'cliente_acesso_cotacoes'
  | 'cliente_acesso_coletas'
  | 'cliente_acesso_propostas'
  | 'cliente_navegacao'
  // Dashboard
  | 'cliente_stats_carregar'
  // Cotações
  | 'cliente_cotacao_criar'
  | 'cliente_cotacao_visualizar'
  | 'cliente_cotacao_filtrar'
  | 'cliente_cotacao_mudar_visualizacao'
  | 'cliente_cotacao_exportar'
  | 'cliente_cotacoes_buscar'
  | 'cliente_cotacoes_filtrar'
  | 'cliente_cotacoes_exportar'
  | 'cliente_cotacoes_visualizar'
  | 'cliente_cotacoes_refresh'
  // Coletas
  | 'cliente_coleta_solicitar'
  | 'cliente_coletas_buscar'
  | 'cliente_coletas_filtrar'
  | 'cliente_coletas_exportar'
  | 'cliente_coletas_visualizar'
  | 'cliente_coletas_mudar_visualizacao'
  | 'cliente_coletas_refresh'
  | 'cliente_acesso_solicitar_cotacao'
  // Propostas
  | 'cliente_proposta_visualizar'
  | 'cliente_proposta_acao'
  | 'cliente_propostas_buscar'
  // Chat/Mensagens
  | 'cliente_chat_enviar_mensagem'
  | 'cliente_chat_ler_mensagens'
  // Perfil
  | 'cliente_perfil_visualizar'
  | 'cliente_perfil_editar'
  // Fretes e Financeiro
  | 'cliente_fretes_buscar'
  | 'cliente_fretes_visualizar'
  | 'cliente_fretes_filtrar_periodo'
  | 'cliente_financeiro_buscar'
  | 'cliente_financeiro_visualizar'
  | 'cliente_financeiro_filtrar_periodo'
  | 'cliente_financeiro_download'
  // Quick Actions no Dashboard
  | 'cliente_quick_action_nova_cotacao'
  | 'cliente_quick_action_cotacoes'
  | 'cliente_quick_action_coletas'
  | 'cliente_quick_action_rastrear'
  | 'cliente_quick_action_financeiro'
  // Menu e navegação
  | 'cliente_menu_abrir'
  | 'cliente_menu_item_click'
  | 'cliente_perfil_dropdown_abrir';

export type ClientActivityModule =
  | 'cliente-auth'
  | 'cliente-dashboard'
  | 'cliente-cotacoes'
  | 'cliente-coletas'
  | 'cliente-propostas'
  | 'cliente-chat'
  | 'cliente-perfil'
  | 'cliente-fretes'
  | 'cliente-financeiro'
  | 'cliente-navegacao';

interface ActivityLogData {
  acao: ClientActivityAction;
  modulo: ClientActivityModule;
  detalhes?: Record<string, any>;
}

/**
 * Hook para logging de atividades do painel cliente
 * 
 * - Verifica sessão Supabase antes de inserir log
 * - Usa supabase_id (UUID) do usuário
 * - Silencia erros para não interromper fluxo principal
 */
export const useClientActivityLogger = () => {
  const { user } = useUnifiedAuth();

  const logActivity = useCallback(async (data: ActivityLogData): Promise<void> => {
    try {
      const supabase = requireAuthenticatedClient();
      // Verificar se há sessão Supabase ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Sem sessão Supabase - não registrar log
        return;
      }

      // Usar o id da tabela usuarios (não o supabase_id do auth)
      // A FK logs_atividade_usuario_id_fkey referencia usuarios(id)
      const userId = user?.id;
      
      if (!userId) {
        // Sem id do usuário na tabela usuarios - não registrar log
        return;
      }

      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      const ipAddress = 'client';

      const logEntry = {
        usuario_id: userId,
        acao: data.acao,
        modulo: data.modulo,
        detalhes: JSON.stringify({
          ...data.detalhes,
          timestamp: new Date().toISOString(),
          pathname: window.location.pathname,
          usuario_nome: user?.nome || user?.email || 'Anônimo',
          usuario_email: user?.email || null,
        }),
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('logs_atividade')
        .insert(logEntry);

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Log de atividade não registrado:', error.message);
      }
    } catch {
      // Silenciar erros - logging não deve quebrar fluxo principal
    }
  }, [user]);

  return { logActivity };
};
