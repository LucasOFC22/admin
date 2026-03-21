/**
 * Token Refresh Service (Consolidado)
 * Renova automaticamente o JWT usando o endpoint /auth/refresh da API
 * Envia device_id + refresh_token para validação de dispositivo.
 * 
 * Integra com tokenStore.onTokenExpiring para refresh proativo ~30s antes da expiração.
 * 
 * Fluxo:
 * 1. Chama POST api.fptranscargas.com.br/auth/refresh (com cookie httpOnly + device_id)
 * 2. A API valida dispositivo, rotaciona tokens, retorna novo access_token + supabase_refresh_token
 * 3. Atualiza o cookie fp_supabase_session com os novos tokens
 * 4. Atualiza o tokenStore em memória com o novo access_token
 * 5. Sincroniza sessão Supabase para manter RLS funcionando
 * 6. Limpa o cache do cliente Supabase para usar o novo token
 */

import { CookieAuth } from '@/lib/auth/cookieAuth';
import { clearAuthenticatedClient, clearRealtimeClient } from '@/config/supabaseAuth';
import { getOrCreateDeviceId } from '@/utils/deviceInfo';
import { tokenStore } from '@/lib/auth/tokenStore';

const REFRESH_API_URL = 'https://api.fptranscargas.com.br/auth/refresh';

// Margem de segurança: renovar 2 minutos antes de expirar
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

// Intervalo mínimo entre tentativas de refresh (evita loop)
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;

interface RefreshResponse {
  access_token: string;
  expires_in: number; // em segundos
  refresh_token?: string; // device_refresh_token rotacionado
  supabase_refresh_token?: string; // token do Supabase para sincronizar sessão
  needs_supabase_refresh?: boolean; // indica necessidade de refresh via Supabase client
}

class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private lastRefreshAttempt: number = 0;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private lastFailureStatus: number | null = null;

  getLastFailureStatus(): number | null {
    return this.lastFailureStatus;
  }

  /**
   * Chama o endpoint /refresh para obter um novo access_token
   * O refresh_token httpOnly cookie é enviado automaticamente
   */
  async refreshToken(force: boolean = false): Promise<boolean> {
    // Se já está fazendo refresh, retorna a promise existente
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[TokenRefresh] Refresh já em andamento, aguardando resultado...');
      return this.refreshPromise;
    }

    // Evitar refresh muito frequente (bypass com force=true para erros 401/JWT expired)
    const now = Date.now();
    if (!force && now - this.lastRefreshAttempt < MIN_REFRESH_INTERVAL_MS) {
      console.log('[TokenRefresh] Refresh muito recente, aguardando intervalo mínimo');
      return false;
    }

    this.isRefreshing = true;
    this.lastRefreshAttempt = now;

    this.refreshPromise = this._doRefresh();
    const result = await this.refreshPromise;
    
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    return result;
  }

  private async _doRefresh(): Promise<boolean> {
    try {
      this.lastFailureStatus = null;
      console.log('[TokenRefresh] ========== INÍCIO DO REFRESH ==========');

      // Extrair refresh_token do cookie fp_supabase_session como fallback
      const session = CookieAuth.getSupabaseSession();
      const refreshTokenFromCookie = session?.device_refresh_token || '';
      const deviceId = getOrCreateDeviceId();

      console.log('[TokenRefresh] Session encontrada no cookie:', !!session);
      console.log('[TokenRefresh] device_id:', deviceId);
      console.log('[TokenRefresh] refresh_token presente:', !!refreshTokenFromCookie);
      console.log('[TokenRefresh] refresh_token (primeiros 20 chars):', refreshTokenFromCookie ? refreshTokenFromCookie.substring(0, 20) + '...' : 'VAZIO');
      console.log('[TokenRefresh] access_token presente:', !!session?.access_token);
      console.log('[TokenRefresh] expires_at:', session?.expires_at, '| agora:', Math.floor(Date.now() / 1000));

      if (!refreshTokenFromCookie && session?.refresh_token) {
        console.warn('[TokenRefresh] Cookie não possui device_refresh_token; refresh vai depender apenas do cookie httpOnly');
      }

      console.log('[TokenRefresh] Enviando POST para:', REFRESH_API_URL);

      const bodyPayload: Record<string, string> = {
        device_id: deviceId,
      };

      if (refreshTokenFromCookie) {
        bodyPayload.refresh_token = refreshTokenFromCookie;
      }

      const response = await fetch(REFRESH_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'admin-frontend',
        },
        body: JSON.stringify(bodyPayload),
      });

      console.log('[TokenRefresh] Response status:', response.status);
      console.log('[TokenRefresh] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      if (!response.ok) {
        this.lastFailureStatus = response.status;
        const errorData = await response.json().catch(() => ({}));
        console.error('[TokenRefresh] ❌ Falha ao renovar token:', response.status, JSON.stringify(errorData));
        
        if (response.status === 401) {
          console.warn('[TokenRefresh] Refresh token inválido - sessão expirada. Code:', errorData?.code);
          return false;
        }
        
        return false;
      }

      const data: RefreshResponse = await response.json();

      console.log('[TokenRefresh] ✅ Resposta OK');
      console.log('[TokenRefresh] access_token recebido:', !!data.access_token);
      console.log('[TokenRefresh] device_refresh_token recebido:', !!data.refresh_token);
      console.log('[TokenRefresh] supabase_refresh_token recebido:', !!data.supabase_refresh_token);
      console.log('[TokenRefresh] expires_in:', data.expires_in);

      if (!data.access_token) {
        console.error('[TokenRefresh] ❌ Resposta sem access_token');
        return false;
      }

      // Atualizar tokenStore em memória com o novo access_token
      tokenStore.setToken(data.access_token, data.expires_in || 3600);

      // Atualizar o cookie fp_supabase_session com os novos tokens
      this.updateSupabaseSessionCookie(
        data.access_token, 
        data.expires_in, 
        data.refresh_token, // device_refresh_token rotacionado
        data.supabase_refresh_token // supabase refresh_token para sincronização
      );

      // Sincronizar sessão Supabase para manter RLS funcionando
      if (data.supabase_refresh_token) {
        try {
          const { supabase } = await import('@/config/supabase');
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.supabase_refresh_token,
          });
          console.log('[TokenRefresh] ✅ Sessão Supabase sincronizada após refresh');
        } catch (e) {
          console.warn('[TokenRefresh] ⚠️ Erro ao sincronizar sessão Supabase:', e);
        }
      }

      // Limpar cache dos clientes Supabase para usar o novo token
      clearAuthenticatedClient();
      clearRealtimeClient();

      console.log('[TokenRefresh] ✅ Token renovado com sucesso. Expira em:', data.expires_in, 'segundos');

      // Agendar próximo refresh
      this.scheduleRefresh(data.expires_in);

      // Disparar evento para notificar o sistema
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
        detail: { expires_in: data.expires_in }
      }));

      console.log('[TokenRefresh] ========== FIM DO REFRESH ==========');

      return true;
    } catch (error) {
      console.error('[TokenRefresh] 💥 Erro ao renovar token:', error);
      return false;
    }
  }

  /**
   * Atualiza o cookie fp_supabase_session com o novo access_token
   */
  private updateSupabaseSessionCookie(
    newAccessToken: string, 
    expiresIn: number, 
    newDeviceRefreshToken?: string,
    newSupabaseRefreshToken?: string
  ): void {
    try {
      // Ler o cookie atual para manter os outros dados
      const currentSession = CookieAuth.getSupabaseSession();
      
      const updatedSession = {
        ...(currentSession || {}),
        access_token: newAccessToken,
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
        token_type: currentSession?.token_type || 'bearer',
        device_id: currentSession?.device_id || getOrCreateDeviceId(),
        ...(newDeviceRefreshToken ? { device_refresh_token: newDeviceRefreshToken } : {}),
        ...(newSupabaseRefreshToken ? { refresh_token: newSupabaseRefreshToken } : {}),
      };

      const cookieValue = encodeURIComponent(JSON.stringify(updatedSession));
      const isSecure = window.location.protocol === 'https:';
      const hostname = window.location.hostname;
      const domain = hostname.includes('fptranscargas.com.br') ? '.fptranscargas.com.br' : '';

      // Limpar cookies antigos/duplicados antes de escrever o novo
      // Limpa no path local (sem domínio)
      document.cookie = `fp_supabase_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      // Limpa no domínio raiz se aplicável
      if (domain) {
        document.cookie = `fp_supabase_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; SameSite=Lax`;
      }

      // Escrever o cookie atualizado (apenas no domínio raiz se disponível)
      let cookieString = `fp_supabase_session=${cookieValue}; max-age=2592000; path=/; SameSite=Lax`;
      
      if (domain) {
        cookieString += `; domain=${domain}`;
      }
      
      if (isSecure) {
        cookieString += '; Secure';
      }

      document.cookie = cookieString;

      console.log('[TokenRefresh] Cookie fp_supabase_session atualizado (duplicatas removidas)');
    } catch (error) {
      console.error('[TokenRefresh] Erro ao atualizar cookie:', error);
    }
  }

  /**
   * Agenda o próximo refresh automático
   * Renova REFRESH_MARGIN_MS antes do token expirar
   */
  scheduleRefresh(expiresInSeconds?: number): void {
    // Cancelar timer anterior
    this.cancelScheduledRefresh();

    let delayMs: number;

    if (expiresInSeconds) {
      // Agendar com base no expires_in recebido
      delayMs = Math.max((expiresInSeconds * 1000) - REFRESH_MARGIN_MS, MIN_REFRESH_INTERVAL_MS);
    } else {
      // Tentar calcular com base no cookie atual
      const session = CookieAuth.getSupabaseSession();
      if (session?.expires_at) {
        const expiresAtMs = session.expires_at * 1000;
        const remaining = expiresAtMs - Date.now();
        delayMs = Math.max(remaining - REFRESH_MARGIN_MS, MIN_REFRESH_INTERVAL_MS);
      } else if (session?.expires_in) {
        delayMs = Math.max((session.expires_in * 1000) - REFRESH_MARGIN_MS, MIN_REFRESH_INTERVAL_MS);
      } else {
        // Sem info de expiração, agendar para 50 minutos (default Supabase é 1h)
        delayMs = 50 * 60 * 1000;
      }
    }

    const minutesUntilRefresh = Math.round(delayMs / 60000);
    console.log(`[TokenRefresh] Próximo refresh agendado em ${minutesUntilRefresh} minutos`);

    this.refreshTimer = setTimeout(async () => {
      console.log('[TokenRefresh] ⏰ Timer disparado - renovando token...');
      const success = await this.refreshToken();
      
      if (!success) {
        console.warn('[TokenRefresh] Falha no refresh automático - tentando novamente em 1 minuto');
        // Tentar novamente em 1 minuto
        this.refreshTimer = setTimeout(async () => {
          const retrySuccess = await this.refreshToken();
          if (!retrySuccess) {
            console.warn('[TokenRefresh] Retry também falhou - limpando cookies para forçar re-login');
            CookieAuth.clearAuthCookie();
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
        }, 60 * 1000);
      }
    }, delayMs);
  }

  /**
   * Cancela o refresh agendado
   */
  cancelScheduledRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Inicializa o serviço - verifica se há token e agenda refresh
   */
  initialize(): void {
    const session = CookieAuth.getSupabaseSession();
    
    if (!session?.access_token) {
      console.log('[TokenRefresh] Sem sessão ativa - refresh não agendado');
      return;
    }

    // Registrar callback no tokenStore para refresh proativo ~30s antes da expiração em memória
    tokenStore.onTokenExpiring(async () => {
      console.log('[TokenRefresh] ⏰ tokenStore.onTokenExpiring disparado - renovando...');
      const success = await this.refreshToken();
      if (!success) {
        console.warn('[TokenRefresh] ❌ Refresh proativo via tokenStore falhou');
      }
    });

    // Verificar se o token já expirou
    if (session.expires_at) {
      const expiresAtMs = session.expires_at * 1000;
      const now = Date.now();
      
      if (now >= expiresAtMs) {
        // Token já expirou - tentar refresh imediato
        console.log('[TokenRefresh] Token já expirado - tentando refresh imediato');
        this.refreshToken().then(success => {
          if (!success) {
            console.warn('[TokenRefresh] Refresh falhou com token expirado - limpando cookies para forçar re-login');
            CookieAuth.clearAuthCookie();
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
        });
        return;
      }
    }

    // Agendar refresh normal
    this.scheduleRefresh();
  }

  /**
   * Inicia o auto-refresh (chamado após login bem-sucedido).
   * Registra callback no tokenStore e agenda refresh baseado no cookie.
   */
  startAutoRefresh(): void {
    tokenStore.onTokenExpiring(async () => {
      console.log('[TokenRefresh] ⏰ tokenStore.onTokenExpiring disparado (auto-refresh) - renovando...');
      const success = await this.refreshToken();
      if (!success) {
        console.warn('[TokenRefresh] ❌ Auto-refresh via tokenStore falhou');
      }
    });
    console.log('[TokenRefresh] Auto-refresh iniciado via tokenStore');
  }

  /**
   * Para o auto-refresh.
   */
  stopAutoRefresh(): void {
    this.cancelScheduledRefresh();
    console.log('[TokenRefresh] Auto-refresh parado');
  }

  /**
   * Revoga o refresh token (o logout endpoint já faz isso).
   */
  async revokeCurrentToken(): Promise<void> {
    console.log('[TokenRefresh] Token revogado (via logout endpoint)');
  }

  /**
   * Para o serviço e cancela timers
   */
  destroy(): void {
    this.cancelScheduledRefresh();
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}

export const tokenRefreshService = new TokenRefreshService();
