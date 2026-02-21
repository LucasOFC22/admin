/**
 * Serviço de log de atividades de autenticação
 * Usa logs_autenticacao para eventos de auth e logs_atividade para ações genéricas
 */

import { requireAuthenticatedClient, getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { supabase as supabaseAnon } from '@/config/supabase';
import { getUserIP as getClientIP } from '@/utils/deviceInfo';
import { logService } from '@/services/logger/logService';

export interface CreateActivityLogData {
  usuario_id: string | null; // UUID (supabase_id da tabela usuarios)
  acao: string;
  modulo?: string;
  detalhes?: any;
  ip_address?: string;
  user_agent?: string;
}

class AuthActivityLogService {
  /**
   * Verifica se há uma sessão Supabase ativa
   * @returns true se há sessão válida, false caso contrário
   */
  private async hasActiveSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabaseAnon.auth.getSession();
      return !!session?.user;
    } catch {
      return false;
    }
  }

  private async getUserIP(): Promise<string> {
    return await getClientIP();
  }

  private getUserAgent(): string {
    return navigator.userAgent || 'unknown';
  }

  /**
   * Log genérico de atividade (para ações não relacionadas a auth)
   * Salva em logs_atividade
   */
  async logActivity(data: CreateActivityLogData): Promise<void> {
    try {
      // Verificar sessão Supabase antes de inserir log
      const hasSession = await this.hasActiveSession();
      if (!hasSession) {
        // Silenciosamente ignorar log quando não há sessão Supabase
        return;
      }

      const ip_address = data.ip_address || await this.getUserIP();
      const user_agent = data.user_agent || this.getUserAgent();

      const logData = {
        usuario_id: data.usuario_id,
        acao: data.acao,
        modulo: data.modulo || 'auth',
        detalhes: JSON.stringify(data.detalhes || {}),
        ip_address,
        user_agent,
        created_at: new Date().toISOString()
      };

      const client = requireAuthenticatedClient();
      const { error } = await client
        .from('logs_atividade')
        .insert(logData);

      if (error) {
        // Log silencioso - não exibir erro 404 no console
        if (error.code !== 'PGRST116') {
          console.warn('⚠️ Log de atividade não registrado:', error.message);
        }
      }
    } catch (error) {
      // Silenciar erros de logging - não deve interromper fluxo
    }
  }

  // ========================================
  // MÉTODOS DE AUTENTICAÇÃO
  // Usam logs_autenticacao (tabela específica)
  // ========================================

  async logLogin(userId: string | null, email: string, loginType: 'success' | 'failed', details?: any): Promise<void> {
    await logService.logAutenticacao({
      usuario_id: userId,
      tipo_de_acao: loginType === 'success' ? 'login' : 'erro',
      sucesso: loginType === 'success',
      detalhes: {
        email,
        tipo_login: 'email_password',
        ...details
      },
      erro: loginType === 'failed' ? details?.error : undefined
    });
  }

  async logLogout(userId: string | null, email: string): Promise<void> {
    await logService.logAutenticacao({
      usuario_id: userId,
      tipo_de_acao: 'logout',
      sucesso: true,
      detalhes: {
        email,
        tipo_logout: 'manual'
      }
    });
  }

  async logAccessDenied(email: string, reason: string): Promise<void> {
    try {
      // Verificar sessão antes de tentar buscar usuário
      const hasSession = await this.hasActiveSession();
      
      let userId: string | null = null;
      
      // Tentar buscar usuário apenas se houver sessão
      if (hasSession) {
        const client = requireAuthenticatedClient();
        const { data: userData } = await client
          .from('usuarios')
          .select('supabase_id')
          .eq('email', email)
          .maybeSingle();
        
        userId = userData?.supabase_id || null;
      }

      await logService.logAutenticacao({
        usuario_id: userId,
        tipo_de_acao: 'acesso_negado',
        sucesso: false,
        detalhes: {
          email,
          motivo: reason,
          tentativa_acesso: true,
          usuario_encontrado: !!userId
        },
        erro: reason
      });
    } catch {
      // Silenciar erros de logging
    }
  }

  async logPanelAccess(userId: string | null, email: string, panel: 'admin' | 'client'): Promise<void> {
    await logService.logAutenticacao({
      usuario_id: userId,
      tipo_de_acao: 'acesso_painel',
      sucesso: true,
      detalhes: {
        email,
        painel: panel,
        tipo_acesso: 'redirect'
      }
    });
  }

  async logSessionExpired(userId: string | null, email?: string): Promise<void> {
    await logService.logAutenticacao({
      usuario_id: userId,
      tipo_de_acao: 'sessao_expirada',
      sucesso: false,
      detalhes: {
        email,
        motivo: 'Sessão expirada automaticamente'
      }
    });
  }

  async logSessionRefresh(userId: string | null, email?: string): Promise<void> {
    await logService.logAutenticacao({
      usuario_id: userId,
      tipo_de_acao: 'refresh_token',
      sucesso: true,
      detalhes: {
        email
      }
    });
  }
}

export const authActivityLogService = new AuthActivityLogService();
