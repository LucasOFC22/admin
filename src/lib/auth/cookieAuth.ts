/**
 * CookieAuth - Sistema de autenticação baseado em cookies HTTP Cross-Domain
 * Gerencia cookies persistentes válidos em todos os subdomínios *.fptranscargas.com.br
 * Compatível com o sistema de autenticação em auth.fptranscargas.com.br
 */

export interface AuthCookieData {
  user_id: string;
  email: string;
  token?: string; // Legado - JWT agora vem do fp_supabase_session
  expires_at: number; // timestamp em milissegundos
  supabase_id: string;
  access_areas?: {
    admin: boolean;
    cliente: boolean;
    motorista: boolean;
  };
}

export interface SupabaseSessionCookie {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  device_refresh_token?: string;
  device_id?: string;
  user: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
}

// Configuração de domínio para cookies cross-domain
const getCookieDomain = (): string => {
  const hostname = window.location.hostname;
  
  // Em produção, usar domínio raiz para compartilhar entre subdomínios
  if (hostname.includes('fptranscargas.com.br')) {
    return '.fptranscargas.com.br';
  }
  
  // Em desenvolvimento/preview, não especificar domínio
  return '';
};

export class CookieAuth {
  private static readonly COOKIE_NAME = 'fp_auth_session';
  private static readonly SUPABASE_SESSION_COOKIE = 'fp_supabase_session';
  private static readonly REFRESH_TOKEN_COOKIE = 'fp_refresh_token';
  private static readonly MAX_AGE = 2592000; // 30 dias em segundos
  
  /**
   * Lê um cookie pelo nome e retorna o valor decodificado
   * Quando há múltiplos cookies com o mesmo nome (diferentes domínios/paths),
   * tenta encontrar o mais válido
   */
  private static readCookie(name: string): string | null {
    try {
      const cookies = document.cookie.split(';');
      const prefix = `${name}=`;
      
      // Coletar TODOS os cookies com esse nome
      const matches: string[] = [];
      for (const c of cookies) {
        const trimmed = c.trim();
        if (trimmed.startsWith(prefix)) {
          try {
            matches.push(decodeURIComponent(trimmed.substring(prefix.length)));
          } catch {
            // Skip cookies com encoding inválido
          }
        }
      }
      
      if (matches.length === 0) return null;
      
      if (matches.length > 1) {
        console.warn(`[CookieAuth] Múltiplos cookies "${name}" encontrados (${matches.length}). Selecionando o mais válido.`);
        
        // Para cookies de sessão, priorizar o que tem access_token válido
        if (name === this.SUPABASE_SESSION_COOKIE) {
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed?.access_token) return match;
            } catch { /* skip */ }
          }
        }
        
        // Para fp_auth_session, priorizar o que tem user_id e não expirou
        if (name === this.COOKIE_NAME) {
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed?.user_id && parsed?.expires_at > Date.now()) return match;
            } catch { /* skip */ }
          }
        }
      }
      
      return matches[0];
    } catch {
      return null;
    }
  }

  /**
   * Lê o cookie fp_supabase_session e retorna os dados da sessão Supabase
   */
  static getSupabaseSession(): SupabaseSessionCookie | null {
    try {
      const raw = this.readCookie(this.SUPABASE_SESSION_COOKIE);
      if (!raw) return null;
      
      const data = JSON.parse(raw) as SupabaseSessionCookie;
      if (!data.access_token) return null;
      
      return data;
    } catch (error) {
      console.error('[CookieAuth] Error reading fp_supabase_session:', error);
      return null;
    }
  }

  /**
   * Cria um cookie de autenticação persistente cross-domain
   */
  static setAuthCookie(
    userId: string, 
    email: string, 
    token: string, 
    supabaseId: string,
    accessAreas?: { admin: boolean; cliente: boolean; motorista: boolean }
  ): void {
    const expiresAt = Date.now() + (this.MAX_AGE * 1000);
    
    const cookieData: AuthCookieData = {
      user_id: userId,
      email,
      token,
      expires_at: expiresAt,
      supabase_id: supabaseId,
      access_areas: accessAreas
    };

    const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
    const isSecure = window.location.protocol === 'https:';
    const domain = getCookieDomain();
    
    // Construir cookie string com domínio cross-domain
    let cookieString = `${this.COOKIE_NAME}=${cookieValue}; max-age=${this.MAX_AGE}; path=/; SameSite=Lax`;
    
    if (domain) {
      cookieString += `; domain=${domain}`;
    }
    
    if (isSecure) {
      cookieString += '; Secure';
    }
    
    document.cookie = cookieString;
  }

  /**
   * Lê o cookie de autenticação
   */
  static getAuthCookie(): AuthCookieData | null {
    try {
      const raw = this.readCookie(this.COOKIE_NAME);
      if (!raw) return null;
      
      const cookieData: AuthCookieData = JSON.parse(raw);
      return cookieData;
    } catch (error) {
      console.error('[CookieAuth] Error reading cookie:', error);
      return null;
    }
  }

  /**
   * Valida se o cookie existe e não está expirado
   * Aceita fp_auth_session com ou sem token (JWT vem do fp_supabase_session)
   */
  static validateAuthCookie(): AuthCookieData | null {
    const cookieData = this.getAuthCookie();

    if (!cookieData) {
      return null;
    }

    // Verificar estrutura mínima do cookie (token não é mais obrigatório aqui)
    if (!cookieData.user_id || !cookieData.email || !cookieData.expires_at) {
      this.clearAuthCookie();
      return null;
    }

    // Verificar expiração
    if (Date.now() >= cookieData.expires_at) {
      this.clearAuthCookie();
      return null;
    }

    return cookieData;
  }

  /**
   * Remove todos os cookies de autenticação (cross-domain)
   * Limpa: fp_auth_session, fp_supabase_session, fp_refresh_token
   */
  static clearAuthCookie(): void {
    const domain = getCookieDomain();
    const cookiesToClear = [
      this.COOKIE_NAME,              // fp_auth_session
      this.SUPABASE_SESSION_COOKIE,  // fp_supabase_session
      this.REFRESH_TOKEN_COOKIE,     // fp_refresh_token
    ];
    
    for (const cookieName of cookiesToClear) {
      // Limpar cookie no domínio atual
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      
      // Limpar também no domínio raiz se aplicável
      if (domain) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; SameSite=Lax`;
      }
    }
    
    console.log('[CookieAuth] All auth cookies cleared: fp_auth_session, fp_supabase_session, fp_refresh_token');
  }

  /**
   * Verifica se existe um cookie válido
   */
  static hasValidAuthCookie(): boolean {
    return this.validateAuthCookie() !== null;
  }

  /**
   * Atualiza o tempo de expiração do cookie fp_auth_session
   */
  static refreshAuthCookie(): boolean {
    const cookieData = this.validateAuthCookie();
    
    if (!cookieData) {
      return false;
    }

    // Recriar cookie com novo tempo de expiração
    this.setAuthCookie(
      cookieData.user_id,
      cookieData.email,
      cookieData.token || '', // token pode estar vazio pois JWT vem do fp_supabase_session
      cookieData.supabase_id,
      cookieData.access_areas
    );

    return true;
  }

  /**
   * Retorna as áreas de acesso do usuário autenticado
   * Busca do fp_auth_session ou fallback do fp_supabase_session
   */
  static getAccessAreas(): { admin: boolean; cliente: boolean; motorista: boolean } | null {
    const cookieData = this.validateAuthCookie();
    if (cookieData?.access_areas) {
      return cookieData.access_areas;
    }
    return null;
  }

  /**
   * Verifica se o usuário tem acesso admin
   */
  static hasAdminAccess(): boolean {
    const accessAreas = this.getAccessAreas();
    return accessAreas?.admin === true;
  }

  /**
   * Retorna o token JWT - prioridade: fp_supabase_session.access_token > fp_auth_session.token
   */
  static getToken(): string | null {
    // Prioridade 1: JWT do fp_supabase_session
    const supabaseSession = this.getSupabaseSession();
    if (supabaseSession?.access_token) {
      return supabaseSession.access_token;
    }
    
    // Fallback: token legado do fp_auth_session
    const cookieData = this.validateAuthCookie();
    return cookieData?.token || null;
  }

  /**
   * Retorna o ID do usuário
   */
  static getUserId(): string | null {
    const cookieData = this.validateAuthCookie();
    return cookieData?.user_id || null;
  }

  /**
   * Retorna o supabase_id do usuário (do fp_auth_session ou fp_supabase_session)
   */
  static getSupabaseId(): string | null {
    const cookieData = this.validateAuthCookie();
    if (cookieData?.supabase_id) return cookieData.supabase_id;
    
    const session = this.getSupabaseSession();
    return session?.user?.id || null;
  }

  /**
   * Verifica se há sessão válida (fp_auth_session + fp_supabase_session com JWT)
   */
  static hasValidSession(): boolean {
    return this.hasValidAuthCookie() && this.getToken() !== null;
  }
}

/**
 * Utilitário para redirecionamento cross-domain
 */
export class CrossDomainRedirect {
  private static readonly SUBDOMAIN_URLS = {
    auth: 'https://auth.fptranscargas.com.br',
    admin: 'https://admin.fptranscargas.com.br',
    clientes: 'https://clientes.fptranscargas.com.br',
    motorista: 'https://motorista.fptranscargas.com.br',
    site: 'https://fptranscargas.com.br'
  };

  /**
   * Redireciona para o subdomínio de autenticação
   */
  static redirectToAuth(): void {
    const returnUrl = encodeURIComponent(window.location.href);
    const authUrl = `${this.SUBDOMAIN_URLS.auth}?returnUrl=${returnUrl}`;
    
    // Em desenvolvimento/preview, não redirecionar
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovableproject.com')) {
      console.log(`[CrossDomainRedirect] DEV mode - would redirect to: ${authUrl}`);
      // Em dev, apenas logar - não redirecionar
      return;
    }
    
    window.location.href = authUrl;
  }

  /**
   * Redireciona para um subdomínio específico
   */
  static redirectTo(subdomain: 'admin' | 'clientes' | 'motorista' | 'site'): void {
    const url = this.SUBDOMAIN_URLS[subdomain];
    
    // Em desenvolvimento/preview, simular com query param
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovableproject.com')) {
      console.log(`[CrossDomainRedirect] DEV mode - would redirect to: ${url}`);
      return;
    }
    
    window.location.href = url;
  }

  /**
   * Verifica em qual subdomínio estamos
   */
  static getCurrentSubdomain(): 'auth' | 'admin' | 'clientes' | 'motorista' | 'site' | 'dev' {
    const hostname = window.location.hostname;
    
    if (hostname.startsWith('auth.')) return 'auth';
    if (hostname.startsWith('admin.')) return 'admin';
    if (hostname.startsWith('clientes.')) return 'clientes';
    if (hostname.startsWith('motorista.')) return 'motorista';
    if (hostname === 'fptranscargas.com.br' || hostname === 'www.fptranscargas.com.br') return 'site';
    
    return 'dev'; // localhost ou preview
  }

  /**
   * Retorna a URL do subdomínio de autenticação
   */
  static getAuthUrl(): string {
    return this.SUBDOMAIN_URLS.auth;
  }

  /**
   * Verifica se estamos em ambiente de desenvolvimento
   */
  static isDev(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname.includes('lovable.app') || hostname.includes('lovableproject.com');
  }
}

/**
 * Cookie de Consentimento Simples (LGPD)
 */
export class CookieConsent {
  private static readonly COOKIE_NAME = 'fp_cookie_consent';
  private static readonly MAX_AGE = 15552000; // 180 dias em segundos

  static setCookieConsent(): void {
    const domain = getCookieDomain();
    let cookieString = `${this.COOKIE_NAME}=accepted; max-age=${this.MAX_AGE}; path=/`;
    
    if (domain) {
      cookieString += `; domain=${domain}`;
    }
    
    document.cookie = cookieString;
  }

  static hasCookieConsent(): boolean {
    return document.cookie.includes(`${this.COOKIE_NAME}=accepted`);
  }

  static clearCookieConsent(): void {
    const domain = getCookieDomain();
    document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    
    if (domain) {
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    }
  }
}
