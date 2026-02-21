import { supabaseAuthService, SupabaseUser } from '@/services/auth/supabaseAuthService';
import { CookieAuth, CookieConsent, CrossDomainRedirect, SupabaseSessionCookie } from './cookieAuth';

// Alias para compatibilidade
export type LoginResponse = {
  success: boolean;
  user: SupabaseUser | null;
  error?: string;
};

// Export cookie utilities
export { CookieAuth, CookieConsent, CrossDomainRedirect };
export type { SupabaseSessionCookie };

// Export types - manter compatibilidade com código existente
export type { SupabaseUser as User };
export type { SupabaseUser as JWTUser };
export type { SupabaseUser };

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = () => {
  return supabaseAuthService.isAuthenticated();
};

/**
 * Retorna o usuário atual (busca no banco se necessário)
 */
export const getCurrentUser = async () => {
  return await supabaseAuthService.getCurrentUser();
};

/**
 * Logout do usuário - limpa cookie e cache
 */
export const logoutUser = async () => {
  await supabaseAuthService.logout();
};

export const signOut = async () => {
  await supabaseAuthService.logout();
};

/**
 * Retorna o token JWT do cookie
 */
export const getToken = () => {
  return CookieAuth.getToken();
};

/**
 * Redireciona para a página de autenticação
 */
export const redirectToAuth = () => {
  CrossDomainRedirect.redirectToAuth();
};

/**
 * Verifica se o usuário tem acesso admin
 */
export const hasAdminAccess = () => {
  return CookieAuth.hasAdminAccess();
};

// Funções legadas - mantidas para compatibilidade
export const setToken = (token: string) => {
  console.warn('[Auth] setToken is deprecated - tokens are managed via cookies');
};

export const removeToken = () => {
  CookieAuth.clearAuthCookie();
};

// Cookie manager helpers
export const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/`;
};

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Funções de login removidas - autenticação é feita em auth.fptranscargas.com.br
export const loginUser = async () => {
  console.warn('[Auth] loginUser is deprecated - use auth.fptranscargas.com.br');
  CrossDomainRedirect.redirectToAuth();
  return { success: false, user: null, error: 'Login must be done via auth.fptranscargas.com.br' };
};

export const loginWithEmail = async () => {
  console.warn('[Auth] loginWithEmail is deprecated - use auth.fptranscargas.com.br');
  CrossDomainRedirect.redirectToAuth();
  return { success: false, user: null, error: 'Login must be done via auth.fptranscargas.com.br' };
};
