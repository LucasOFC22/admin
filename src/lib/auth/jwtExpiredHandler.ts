/**
 * JWT Expired Handler - Detecta erros 401 com JWT expirado
 * Em vez de fazer logout imediato, tenta renovar o token via tokenRefreshService
 * Só faz logout se o refresh falhar
 */

import { CookieAuth, CrossDomainRedirect } from './cookieAuth';
import { clearAuthenticatedClient, clearRealtimeClient } from '@/config/supabaseAuth';
import { tokenRefreshService } from '@/services/auth/tokenRefreshService';

/**
 * Verifica se o erro é especificamente um JWT expirado (não qualquer 401)
 */
export function isJwtExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as Record<string, unknown>;
  
  // Verificar mensagem de erro específica de JWT expirado
  const message = String(err.message || err.error || err.error_description || '').toLowerCase();
  if (message.includes('jwt expired') || message.includes('token expired') || message.includes('token is expired')) {
    return true;
  }
  
  // Verificar hint do Supabase/PostgREST para JWT
  const hint = String(err.hint || '').toLowerCase();
  if (hint.includes('jwt') && hint.includes('expired')) {
    return true;
  }

  // Verificar código específico de JWT expirado do Supabase
  const code = String(err.code || '').toLowerCase();
  if (code === 'pgrst301' || code === 'jwt_expired') {
    return true;
  }
  
  // NÃO tratar qualquer 401 como JWT expirado - pode ser RLS ou permissão
  return false;
}

/**
 * Verifica headers da resposta para JWT expirado
 */
export function checkResponseForJwtExpired(response: Response): boolean {
  if (response.status !== 401) return false;
  
  const wwwAuthenticate = response.headers.get('www-authenticate');
  if (wwwAuthenticate) {
    const lowerHeader = wwwAuthenticate.toLowerCase();
    if (lowerHeader.includes('jwt expired') || lowerHeader.includes('token expired')) {
      return true;
    }
  }
  
  // Não assumir que qualquer 401 é JWT expirado
  return false;
}

/**
 * Handler central para JWT expirado
 * PRIMEIRO tenta renovar o token via /refresh
 * Só faz logout se o refresh falhar
 */
export async function handleJwtExpired(reason?: string): Promise<boolean> {
  console.warn('[JWTExpiredHandler] JWT expirado detectado:', reason || 'Sessão inválida');
  console.log('[JWTExpiredHandler] Tentando renovar token antes de fazer logout...');

  // Tentar renovar o token
  try {
    const refreshed = await tokenRefreshService.refreshToken();
    
    if (refreshed) {
      console.log('[JWTExpiredHandler] ✅ Token renovado com sucesso! Sessão mantida.');
      return true; // Token renovado, não precisa fazer logout
    }
  } catch (error) {
    console.error('[JWTExpiredHandler] Erro ao tentar refresh:', error);
  }

  // Refresh falhou - agora sim fazer logout
  console.warn('[JWTExpiredHandler] ❌ Refresh falhou. Encerrando sessão.');
  forceLogout(reason);
  return false;
}

/**
 * Força o logout sem tentar refresh (usado quando refresh já falhou)
 */
export function forceLogout(reason?: string): void {
  console.warn('[JWTExpiredHandler] Forçando logout:', reason);
  
  // Limpar todos os caches e cookies
  clearAuthenticatedClient();
  clearRealtimeClient();
  CookieAuth.clearAuthCookie();
  
  // Cancelar qualquer refresh agendado
  tokenRefreshService.destroy();
  
  // Redirecionar para autenticação
  if (!CrossDomainRedirect.isDev()) {
    CrossDomainRedirect.redirectToAuth();
  } else {
    // Em dev, mostrar alerta e recarregar
    console.error('[JWTExpiredHandler] DEV MODE - Sessão expirada. Faça login novamente.');
    window.dispatchEvent(new CustomEvent('auth:session-expired', { 
      detail: { reason: reason || 'JWT expired - refresh failed' } 
    }));
  }
}

/**
 * Wrapper para requisições que verifica JWT expirado na resposta
 * Se detectar expiração, tenta refresh antes de falhar
 */
export async function withJwtExpiredCheck<T>(
  requestFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  const result = await requestFn();
  
  if (result.error && isJwtExpiredError(result.error)) {
    // Tentar renovar o token
    const refreshed = await handleJwtExpired('Erro na requisição');
    
    if (refreshed) {
      // Token renovado - tentar a requisição novamente
      console.log('[JWTExpiredHandler] Retentando requisição após refresh...');
      return await requestFn();
    }
    
    return { data: null, error: result.error };
  }
  
  return result;
}
