/**
 * Session Recovery Service
 * Cadeia de recuperação de sessão Supabase com 4 tentativas:
 * 1. getSession() → sessão válida em memória
 * 2. refreshSession() → refresh interno do Supabase
 * 3. setSession() com refresh_token do cookie fp_supabase_session
 * 4. Backend proxy com refresh_token no body + httpOnly cookie
 */

import { supabase } from '@/config/supabase';
import { CookieAuth } from '@/lib/auth/cookieAuth';
import { clearAuthenticatedClient, clearRealtimeClient } from '@/config/supabaseAuth';
import { tokenRefreshService } from './tokenRefreshService';

const REFRESH_API_URL = 'https://api.fptranscargas.com.br/auth/refresh';

export interface RecoveryResult {
  success: boolean;
  method: 'memory' | 'supabase_refresh' | 'set_session' | 'backend_proxy' | 'none';
  accessToken?: string;
}

class SessionRecoveryService {
  private recovering = false;
  private recoveryPromise: Promise<RecoveryResult> | null = null;

  /**
   * Tenta recuperar a sessão usando a cadeia de 4 tentativas.
   * Garante que apenas uma recuperação ocorre por vez (dedup).
   */
  async ensureValidSupabaseSession(): Promise<RecoveryResult> {
    if (this.recovering && this.recoveryPromise) {
      console.log('[SessionRecovery] Recuperação já em andamento, aguardando...');
      return this.recoveryPromise;
    }

    this.recovering = true;
    this.recoveryPromise = this._recover();

    try {
      return await this.recoveryPromise;
    } finally {
      this.recovering = false;
      this.recoveryPromise = null;
    }
  }

  private async _recover(): Promise<RecoveryResult> {
    console.log('[SessionRecovery] Iniciando cadeia de recuperação...');

    // === Tentativa 1: getSession() - sessão válida em memória ===
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session?.access_token) {
        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt > now) {
          console.log('[SessionRecovery] ✅ Tentativa 1: Sessão em memória válida');
          return { success: true, method: 'memory', accessToken: session.access_token };
        }
        console.log('[SessionRecovery] Tentativa 1: Sessão em memória expirada');
      } else {
        console.log('[SessionRecovery] Tentativa 1: Sem sessão em memória');
      }
    } catch (e) {
      console.warn('[SessionRecovery] Tentativa 1 falhou:', e);
    }

    // === Tentativa 2: refreshSession() - refresh interno do Supabase ===
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (!error && session?.access_token) {
        console.log('[SessionRecovery] ✅ Tentativa 2: refreshSession() do Supabase OK');
        this.syncCookieFromSession(session as any);
        clearAuthenticatedClient();
        clearRealtimeClient();
        return { success: true, method: 'supabase_refresh', accessToken: session.access_token };
      }
      console.log('[SessionRecovery] Tentativa 2: refreshSession falhou -', error?.message || 'sem sessão');
    } catch (e) {
      console.warn('[SessionRecovery] Tentativa 2 falhou:', e);
    }

    // === Tentativa 3: setSession() com refresh_token do cookie fp_supabase_session ===
    const cookieSession = CookieAuth.getSupabaseSession();
    const cookieRefreshToken = cookieSession?.refresh_token;

    if (cookieRefreshToken) {
      try {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: cookieSession.access_token || '',
          refresh_token: cookieRefreshToken,
        });
        if (!error && session?.access_token) {
          console.log('[SessionRecovery] ✅ Tentativa 3: setSession() com cookie OK');
          this.syncCookieFromSession(session as any);
          clearAuthenticatedClient();
          clearRealtimeClient();
          return { success: true, method: 'set_session', accessToken: session.access_token };
        }
        console.log('[SessionRecovery] Tentativa 3: setSession falhou -', error?.message || 'sem sessão');
      } catch (e) {
        console.warn('[SessionRecovery] Tentativa 3 falhou:', e);
      }
    } else {
      console.log('[SessionRecovery] Tentativa 3: Sem refresh_token no cookie - pulando');
    }

    // === Tentativa 4: Backend proxy /refresh com refresh_token no body + httpOnly cookie ===
    try {
      const success = await tokenRefreshService.refreshToken(true);
      if (success) {
        console.log('[SessionRecovery] ✅ Tentativa 4: Backend proxy /refresh OK');
        const updatedSession = CookieAuth.getSupabaseSession();
        return { success: true, method: 'backend_proxy', accessToken: updatedSession?.access_token };
      }
      console.log('[SessionRecovery] Tentativa 4: Backend proxy falhou');
    } catch (e) {
      console.warn('[SessionRecovery] Tentativa 4 falhou:', e);
    }

    // === Todas as tentativas falharam ===
    console.error('[SessionRecovery] ❌ Todas as 4 tentativas falharam - sessão irrecuperável');
    return { success: false, method: 'none' };
  }

  /**
   * Sincroniza o cookie fp_supabase_session com a sessão do Supabase SDK
   */
  private syncCookieFromSession(session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: Record<string, unknown> & { id: string; email?: string };
  }): void {
    try {
      const currentCookieSession = CookieAuth.getSupabaseSession();
      const cookieValue = encodeURIComponent(JSON.stringify({
        ...(currentCookieSession || {}),
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in,
        token_type: session.token_type,
        user: session.user,
      }));

      const isSecure = window.location.protocol === 'https:';
      const hostname = window.location.hostname;
      const domain = hostname.includes('fptranscargas.com.br') ? '.fptranscargas.com.br' : '';

      // Limpar cookies antigos/duplicados
      document.cookie = `fp_supabase_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      if (domain) {
        document.cookie = `fp_supabase_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; SameSite=Lax`;
      }

      let cookieString = `fp_supabase_session=${cookieValue}; max-age=2592000; path=/; SameSite=Lax`;
      if (domain) cookieString += `; domain=${domain}`;
      if (isSecure) cookieString += '; Secure';

      document.cookie = cookieString;
      console.log('[SessionRecovery] Cookie fp_supabase_session sincronizado');
    } catch (error) {
      console.error('[SessionRecovery] Erro ao sincronizar cookie:', error);
    }
  }
}

export const sessionRecoveryService = new SessionRecoveryService();
