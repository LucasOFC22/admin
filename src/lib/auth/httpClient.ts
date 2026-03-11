/**
 * HttpClient - Cliente HTTP com interceptor automático de 401.
 *
 * Fluxo:
 * 1. Toda requisição inclui `Authorization: Bearer <access_token>` do tokenStore.
 * 2. Se a API retorna 401 "token expired", o client faz refresh silencioso
 *    via POST https://api.fptranscargas.com.br/auth/refresh (com credentials: include).
 * 3. O backend valida o httpOnly refresh token cookie e retorna novo access_token.
 * 4. O client armazena o novo token em memória e retenta a requisição original.
 * 5. Se o refresh falhar (401 "invalid refresh token"), redireciona para login.
 */

import { tokenStore } from './tokenStore';
import { cookieStorage } from './cookieStorage';
import { BACKEND_CONFIG, getBackendUrl } from '@/config/backend.config';
import { devLog } from '@/utils/logger';
import { getOrCreateDeviceId } from '@/utils/deviceInfo';

const REFRESH_URL = `${BACKEND_CONFIG.baseUrl.replace(/\/$/, '')}/auth/refresh`;

// Controle de concorrência: apenas 1 refresh por vez
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Controle anti-loop: bloquear refresh após falha definitiva
let refreshBlocked = false;
let lastRefreshFailure = 0;
const REFRESH_BLOCK_DURATION_MS = 30_000; // Bloquear por 30s após falha

// Callbacks registrados para eventos de sessão
let onSessionExpiredCallback: (() => void) | null = null;
let onTokenRefreshedCallback: ((accessToken: string, expiresIn: number) => void) | null = null;

/**
 * Registra callback para sessão expirada (redirect para login).
 */
export function onSessionExpired(callback: () => void): void {
  onSessionExpiredCallback = callback;
}

/**
 * Registra callback para token renovado com sucesso.
 */
export function onTokenRefreshed(callback: (accessToken: string, expiresIn: number) => void): void {
  onTokenRefreshedCallback = callback;
}

/**
 * Reseta o bloqueio de refresh (chamar após login bem-sucedido).
 */
export function resetRefreshBlock(): void {
  refreshBlocked = false;
  lastRefreshFailure = 0;
}

/**
 * Tenta renovar o access token via endpoint /auth/refresh.
 * O refresh token é enviado automaticamente pelo browser (httpOnly cookie).
 * 
 * @returns true se o refresh foi bem-sucedido
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  // Anti-loop: se refresh foi bloqueado recentemente, não tentar
  if (refreshBlocked) {
    const elapsed = Date.now() - lastRefreshFailure;
    if (elapsed < REFRESH_BLOCK_DURATION_MS) {
      devLog.log(`[HttpClient] ⏳ Refresh bloqueado (aguardar ${Math.ceil((REFRESH_BLOCK_DURATION_MS - elapsed) / 1000)}s)`);
      return false;
    }
    // Tempo de bloqueio passou, liberar
    refreshBlocked = false;
  }

  // Se já está fazendo refresh, aguardar o resultado
  if (isRefreshing && refreshPromise) {
    devLog.log('[HttpClient] Refresh já em andamento, aguardando...');
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      devLog.log('[HttpClient] 🔄 Tentando refresh token...');

      // Enviar device_id + refresh_token do cookie fp_supabase_session como fallback
      const bodyPayload: Record<string, string> = {
        device_id: getOrCreateDeviceId(),
      };
      try {
        const rawSession = cookieStorage.getItem('fp_supabase_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          const token = parsed.device_refresh_token || parsed.refresh_token;
          if (token) {
            bodyPayload.refresh_token = token;
            devLog.log('[HttpClient] 📦 Enviando refresh_token + device_id no body');
          }
        }
      } catch {
        // Silencioso
      }

      const response = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'fp-transcargas-admin',
        },
        credentials: 'include', // Envia httpOnly cookie automaticamente
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        devLog.warn('[HttpClient] ❌ Refresh falhou:', response.status, errorData);

        if (response.status === 401) {
          // Refresh token inválido/expirado → sessão morta, BLOQUEAR futuras tentativas
          refreshBlocked = true;
          lastRefreshFailure = Date.now();
          handleSessionExpired();
          return false;
        }

        return false;
      }

      const data = await response.json();
      
      // Se a edge function indica que precisa de refresh Supabase
      if (data.needs_supabase_refresh) {
        devLog.log('[HttpClient] 🔄 Edge function pede refresh via Supabase client...');
        // Atualizar device_refresh_token no cookie
        try {
          const rawSession = cookieStorage.getItem('fp_supabase_session');
          const currentSession = rawSession ? JSON.parse(rawSession) : {};
          currentSession.device_refresh_token = data.refresh_token;
          cookieStorage.setItem('fp_supabase_session', JSON.stringify(currentSession));
        } catch { /* silent */ }
        
        // Tentar refresh via Supabase client
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const rawSession = cookieStorage.getItem('fp_supabase_session');
          if (rawSession) {
            const parsed = JSON.parse(rawSession);
            if (parsed.refresh_token) {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
              const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa3BwdWNkbm12eWZzbmFycHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDEzNTQsImV4cCI6MjA4ODgxNzM1NH0.MCR1rdDr9CNgfzlpqPFp2sfLMpyfxFKeEcgFOFdTXVs';
              const tempClient = createClient(supabaseUrl, supabaseAnonKey);
              const { data: refreshData } = await tempClient.auth.setSession({
                access_token: parsed.access_token || '',
                refresh_token: parsed.refresh_token,
              });
              if (refreshData?.session?.access_token) {
                tokenStore.setToken(refreshData.session.access_token, refreshData.session.expires_in || 3600);
                onTokenRefreshedCallback?.(refreshData.session.access_token, refreshData.session.expires_in || 3600);
                devLog.log('[HttpClient] ✅ Token renovado via Supabase client');
                return true;
              }
            }
          }
        } catch {
          devLog.warn('[HttpClient] ⚠️ Erro no refresh via Supabase client');
        }
        return false;
      }

      const { access_token, expires_in, refresh_token: new_refresh_token, supabase_refresh_token } = data;

      if (!access_token || !expires_in) {
        devLog.warn('[HttpClient] ❌ Resposta de refresh inválida:', data);
        return false;
      }

      // Armazenar novo token em memória
      tokenStore.setToken(access_token, expires_in);

      // CRÍTICO: Atualizar fp_supabase_session cookie com os novos tokens
      try {
        const rawSession = cookieStorage.getItem('fp_supabase_session');
        const currentSession = rawSession ? JSON.parse(rawSession) : {};
        const updatedSession = {
          ...currentSession,
          access_token,
          expires_in,
          expires_at: Math.floor(Date.now() / 1000) + expires_in,
          ...(new_refresh_token ? { device_refresh_token: new_refresh_token } : {}),
          ...(supabase_refresh_token ? { refresh_token: supabase_refresh_token } : {}),
        };
        cookieStorage.setItem('fp_supabase_session', JSON.stringify(updatedSession));
        devLog.log('[HttpClient] ✅ Cookie fp_supabase_session atualizado com novos tokens');
      } catch (cookieError) {
        devLog.warn('[HttpClient] ⚠️ Erro ao atualizar cookie de sessão:', cookieError);
      }

      // Sincronizar sessão Supabase para manter RLS funcionando
      if (supabase_refresh_token) {
        try {
          const { supabase } = await import('@/config/supabase');
          await supabase.auth.setSession({
            access_token,
            refresh_token: supabase_refresh_token,
          });
          devLog.log('[HttpClient] ✅ Sessão Supabase sincronizada após refresh');
        } catch {
          devLog.warn('[HttpClient] ⚠️ Erro ao sincronizar sessão Supabase');
        }
      }

      // Notificar callback
      onTokenRefreshedCallback?.(access_token, expires_in);

      devLog.log(`[HttpClient] ✅ Token renovado (expira em ${expires_in}s)`);
      return true;
    } catch (error) {
      devLog.error('[HttpClient] ❌ Erro no refresh:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Trata sessão expirada: limpa token e notifica callbacks.
 * NÃO redireciona automaticamente — isso é responsabilidade do callback.
 */
function handleSessionExpired(): void {
  tokenStore.clearToken();
  devLog.warn('[HttpClient] 🔒 Sessão expirada');
  onSessionExpiredCallback?.();
}

/**
 * Faz uma requisição HTTP autenticada com interceptor de 401.
 * 
 * - Injeta Bearer token do tokenStore
 * - Se receber 401, tenta refresh e retenta UMA vez
 * - Se refresh falhar, redireciona para login
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<Response> {
  const makeRequest = (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    
    if (token && !skipAuth) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Sempre enviar cookies (refresh token httpOnly)
    });
  };

  // Primeira tentativa
  const token = tokenStore.getToken();
  let response = await makeRequest(token);

  // Se 401, tentar refresh e retentar
  if (response.status === 401 && !skipAuth) {
    devLog.log('[HttpClient] 🔄 Recebeu 401, tentando refresh...');

    const refreshSuccess = await attemptTokenRefresh();

    if (refreshSuccess) {
      // Retentar com novo token
      const newToken = tokenStore.getToken();
      devLog.log('[HttpClient] 🔄 Retentando requisição com novo token...');
      response = await makeRequest(newToken);
    } else {
      devLog.warn('[HttpClient] ❌ Refresh falhou, requisição não pode ser retentada');
    }
  }

  return response;
}

/**
 * Wrapper para requisições ao backend Node.js com payload JSON.
 * Adiciona headers padrão, timeout e interceptor de 401.
 */
export async function backendFetch<T = any>(
  endpoint: string,
  payload: any,
  timeoutMs: number = BACKEND_CONFIG.timeout
): Promise<{ response: Response; data: T }> {
  const url = getBackendUrl(endpoint);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        ...BACKEND_CONFIG.headers,
        'X-Request-ID': crypto.randomUUID(),
        'X-Timestamp': new Date().toISOString(),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();

    if (!text || text.trim() === '') {
      return { response, data: { success: true } as any };
    }

    let result = JSON.parse(text);

    // Normalizar resposta N8N
    if (Array.isArray(result) && result.length > 0 && result[0]?.json !== undefined) {
      result = result.map((item: any) => item.json);
    }

    return { response, data: result };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
