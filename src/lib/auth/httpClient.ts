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
import { BACKEND_CONFIG, getBackendUrl } from '@/config/backend.config';
import { devLog } from '@/utils/logger';
import { tokenRefreshService } from '@/services/auth/tokenRefreshService';

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
      devLog.log('[HttpClient] 🔄 Delegando refresh ao TokenRefreshService...');

      const success = await tokenRefreshService.refreshToken(true);

      if (!success) {
        const status = tokenRefreshService.getLastFailureStatus();
        devLog.warn('[HttpClient] ❌ Refresh falhou via TokenRefreshService', { status });

        if (status === 401) {
          refreshBlocked = true;
          lastRefreshFailure = Date.now();
          handleSessionExpired();
        }

        return false;
      }

      const refreshedToken = tokenStore.getToken();
      if (refreshedToken) {
        onTokenRefreshedCallback?.(refreshedToken, tokenStore.getTimeToExpiry());
      }

      devLog.log('[HttpClient] ✅ Refresh concluído pelo TokenRefreshService');
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
