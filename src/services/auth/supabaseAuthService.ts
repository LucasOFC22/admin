import { supabase } from '@/config/supabase';
import { getOrCreateDeviceId } from '@/utils/deviceInfo';
import { authActivityLogService } from './activityLogService';
import { devLog } from '@/utils/logger';
import { CookieAuth } from '@/lib/auth/cookieAuth';
import { cookieStorage } from '@/lib/auth/cookieStorage';
import { CnpjCpfData, extractCnpjCpfArray, extractCnpjCpfAtual } from '@/types/cnpjcpf';
import { tokenRefreshService } from './tokenRefreshService';
import { tokenStore } from '@/lib/auth/tokenStore';
import { attemptTokenRefresh, resetRefreshBlock } from '@/lib/auth/httpClient';
import { BACKEND_CONFIG } from '@/config/backend.config';
import { deviceService } from '@/services/deviceService';

export interface SupabaseUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cnpjcpf?: CnpjCpfData | string[];
  cnpjcpfArray?: string[];
  cnpjcpfAtual?: string;
  cargo: string;
  acesso_area_cliente: boolean;
  acesso_area_admin?: boolean;
  acessoAreaCliente?: boolean;
  ativo: boolean;
  supabase_id: string;
  data_criacao: string;
  data_ultima_atividade: string;
  atualizado_em: string;
  hasAdminAccess?: boolean;
  hasClientAccess?: boolean;
  uid?: string;
  displayName?: string;
  empresa?: string;
  nivel_hierarquico?: number;
  filas?: number[];
  tags?: number[];
  som?: boolean;
  tipo?: 'admin' | 'cliente';
  permissions?: string[];
}

export interface SupabaseLoginResponse {
  user: SupabaseUser;
  token: string;
  hasAdminAccess: boolean;
  hasClientAccess: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class SupabaseAuthService {
  private currentUser: SupabaseUser | null = null;
  private sessionValidatedAt: number = 0;
  private readonly SESSION_CACHE_MS = 30000;

  async login(credentials: LoginCredentials, rememberMe: boolean = false): Promise<SupabaseLoginResponse> {
    try {
      resetRefreshBlock();

      const loginResponse = await fetch(`${BACKEND_CONFIG.baseUrl.replace(/\/$/, '')}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'fp-transcargas-admin',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          device_info: {
            user_agent: navigator.userAgent,
            device_id: getOrCreateDeviceId(),
          },
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
        const errorMessage = errorData.error || 'Email ou senha incorretos';
        console.error('[Auth] ❌ Login falhou:', loginResponse.status, errorMessage);
        await authActivityLogService.logAccessDenied(credentials.email, errorMessage).catch(() => {});
        throw new Error(errorMessage);
      }

      const responseText = await loginResponse.text();
      console.log('[Auth] 📦 Resposta bruta do /auth/login:', responseText.substring(0, 500));
      
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('[Auth] ❌ Resposta não é JSON válido');
        throw new Error('Resposta inválida do servidor');
      }

      const { access_token, expires_in, refresh_token: deviceRefreshToken, supabase_refresh_token, user: userFromEdge } = data;

      console.log('[Auth] 🔑 access_token presente:', !!access_token);
      console.log('[Auth] 👤 user presente:', !!userFromEdge);
      console.log('[Auth] 🔄 supabase_refresh_token presente:', !!supabase_refresh_token);

      if (!access_token || !userFromEdge) {
        console.error('[Auth] ❌ Dados faltando na resposta:', { hasToken: !!access_token, hasUser: !!userFromEdge });
        throw new Error('Resposta inválida do servidor');
      }

      tokenStore.setToken(access_token, expires_in || 3600);

      if (supabase_refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: supabase_refresh_token,
        });
        if (sessionError) {
          console.warn('[Auth] ⚠️ Erro ao setar sessão Supabase (não crítico):', sessionError.message);
        } else {
          console.log('[Auth] ✅ Sessão Supabase estabelecida via setSession');
        }
      }

      const hasAdminAccess = userFromEdge.acesso_area_admin === true;
      const hasClientAccess = userFromEdge.acesso_area_cliente === true;

      const user: SupabaseUser = {
        id: userFromEdge.id,
        nome: userFromEdge.nome,
        email: userFromEdge.email,
        telefone: userFromEdge.telefone,
        cnpjcpf: userFromEdge.cnpjcpf,
        cnpjcpfArray: extractCnpjCpfArray(userFromEdge.cnpjcpf),
        cnpjcpfAtual: extractCnpjCpfAtual(userFromEdge.cnpjcpf) || undefined,
        cargo: userFromEdge.cargo?.toString(),
        acesso_area_cliente: hasClientAccess,
        acesso_area_admin: hasAdminAccess,
        acessoAreaCliente: hasClientAccess,
        ativo: userFromEdge.ativo,
        supabase_id: userFromEdge.supabase_id,
        data_criacao: userFromEdge.data_criacao || new Date().toISOString(),
        data_ultima_atividade: new Date().toISOString(),
        atualizado_em: userFromEdge.atualizado_em || new Date().toISOString(),
        hasAdminAccess,
        hasClientAccess,
        uid: userFromEdge.supabase_id,
        displayName: userFromEdge.nome,
        empresa: userFromEdge.empresa,
        nivel_hierarquico: userFromEdge.nivel_hierarquico || 1,
        filas: userFromEdge.filas || [],
        tags: userFromEdge.tags || [],
        tipo: hasAdminAccess ? 'admin' : 'cliente'
      };

      this.currentUser = user;
      this.sessionValidatedAt = Date.now();

      const token = access_token;

      try {
        const rawSession = cookieStorage.getItem('fp_supabase_session');
        const currentSession = rawSession ? JSON.parse(rawSession) : {};
        const updatedSession = {
          ...currentSession,
          access_token,
          expires_in,
          expires_at: Math.floor(Date.now() / 1000) + (expires_in || 3600),
          device_refresh_token: deviceRefreshToken,
          refresh_token: supabase_refresh_token || currentSession.refresh_token,
        };
        cookieStorage.setItem('fp_supabase_session', JSON.stringify(updatedSession));
      } catch {
        // Silencioso
      }

      CookieAuth.setAuthCookie(
        user.id,
        user.email,
        '',
        user.supabase_id,
        {
          admin: hasAdminAccess,
          cliente: hasClientAccess,
          motorista: false
        }
      );

      tokenRefreshService.startAutoRefresh();

      await authActivityLogService.logLogin(
        user.id, 
        user.email, 
        'success',
        {
          has_admin_access: hasAdminAccess,
          has_client_access: hasClientAccess,
          user_type: user.tipo
        }
      );

      return { user, token, hasAdminAccess, hasClientAccess };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Erro no login com Google:', error);
        throw new Error('Não foi possível iniciar o login com Google. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro no login com Google:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentUser) {
        await authActivityLogService.logLogout(
          this.currentUser.id, 
          this.currentUser.email
        );
      }

      try {
        let deviceRefreshToken: string | null = null;
        try {
          const rawSession = cookieStorage.getItem('fp_supabase_session');
          if (rawSession) {
            const parsed = JSON.parse(rawSession);
            deviceRefreshToken = parsed.device_refresh_token || null;
          }
        } catch {}

        const currentToken = tokenStore.getRawToken();
        await fetch(`${BACKEND_CONFIG.baseUrl.replace(/\/$/, '')}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'fp-transcargas-admin',
            ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            refresh_token: deviceRefreshToken,
            revoke_all: true,
          }),
        });
      } catch (logoutError) {
        console.warn('[Auth] ⚠️ Erro ao chamar auth-logout (não crítico):', logoutError);
      }

      await tokenRefreshService.revokeCurrentToken();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('⚠️ Erro no logout Supabase:', error);
      }
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
    } finally {
      this.currentUser = null;
      CookieAuth.clearAuthCookie();
      cookieStorage.removeItem('fp_supabase_session');
      tokenStore.destroy();
      tokenRefreshService.stopAutoRefresh();
    }
  }

  private async ensureValidSupabaseSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session) {
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        if (expiresAt > Date.now()) {
          if (!tokenStore.isTokenValid() && session.access_token) {
            const expiresIn = session.expires_in || Math.floor((expiresAt - Date.now()) / 1000);
            tokenStore.setToken(session.access_token, expiresIn);
            devLog.log('[Auth] ✅ Token restaurado em memória a partir da sessão Supabase');
          }
          return true;
        }
        devLog.log('[Auth] ⚠️ Sessão Supabase expirada, tentando refresh...');
      }

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData?.session) {
        devLog.log('[Auth] ✅ Sessão Supabase renovada via refreshSession');
        if (refreshData.session.access_token) {
          const expiresIn = refreshData.session.expires_in || 3600;
          tokenStore.setToken(refreshData.session.access_token, expiresIn);
        }
        return true;
      }

      devLog.warn('[Auth] ⚠️ refreshSession falhou:', refreshError?.message);

      try {
        const rawSession = cookieStorage.getItem('fp_supabase_session');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed.refresh_token) {
            devLog.log('[Auth] 🔄 Tentando setSession com refresh_token do cookie...');
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: parsed.access_token,
              refresh_token: parsed.refresh_token,
            });
            
            if (!setError && setData?.session) {
              devLog.log('[Auth] ✅ Sessão restaurada via setSession com refresh_token do cookie');
              if (setData.session.access_token) {
                const expiresIn = setData.session.expires_in || 3600;
                tokenStore.setToken(setData.session.access_token, expiresIn);
              }
              return true;
            }
            devLog.warn('[Auth] ⚠️ setSession falhou:', setError?.message);
          }
        }
      } catch (parseError) {
        devLog.warn('[Auth] ⚠️ Erro ao ler refresh_token do cookie:', parseError);
      }

      devLog.log('[Auth] 🔄 Tentando refresh via backend proxy...');
      const backendRefresh = await attemptTokenRefresh();
      if (backendRefresh) {
        try {
          const updatedRaw = cookieStorage.getItem('fp_supabase_session');
          if (updatedRaw) {
            const updatedSession = JSON.parse(updatedRaw);
            if (updatedSession.access_token && updatedSession.refresh_token) {
              const { data: setData, error: setError } = await supabase.auth.setSession({
                access_token: updatedSession.access_token,
                refresh_token: updatedSession.refresh_token,
              });
              if (!setError && setData?.session) {
                devLog.log('[Auth] ✅ Sessão Supabase sincronizada após backend refresh');
                return true;
              }
              devLog.warn('[Auth] ⚠️ setSession após backend refresh falhou:', setError?.message);
            }
          }
        } catch (syncError) {
          devLog.warn('[Auth] ⚠️ Erro ao sincronizar sessão após backend refresh:', syncError);
        }
        
        devLog.log('[Auth] ✅ Backend refresh OK (tokenStore atualizado)');
        return true;
      }

      return false;
    } catch (error) {
      devLog.warn('[Auth] ❌ Erro ao garantir sessão válida:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      if (this.currentUser && (Date.now() - this.sessionValidatedAt) < this.SESSION_CACHE_MS) {
        devLog.log('✅ Sessão em cache válida, retornando imediatamente');
        return this.currentUser;
      }
      
      devLog.log('🔍 Verificando usuário atual...');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      await this.ensureValidSupabaseSession();
      
      const cookieData = CookieAuth.validateAuthCookie();
      if (cookieData && !this.currentUser) {
        devLog.log('🍪 Cookie válido encontrado, recuperando sessão...');
        
        try {
          let userData = null;
          let userError = null;
          
          const isValidUUID = uuidRegex.test(cookieData.user_id);
          
          if (isValidUUID) {
            const result = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', cookieData.user_id)
              .eq('ativo', true)
              .single();
            userData = result.data;
            userError = result.error;
            
            if (userError && (userError.message?.includes('JWT expired') || userError.code === 'PGRST301')) {
              devLog.log('[Auth] 🔄 JWT expirado na query, forçando refresh...');
              const refreshed = await this.ensureValidSupabaseSession();
              if (refreshed) {
                const retry = await supabase
                  .from('usuarios')
                  .select('*')
                  .eq('id', cookieData.user_id)
                  .eq('ativo', true)
                  .single();
                userData = retry.data;
                userError = retry.error;
              }
            }
          }
          
          if (!userData && cookieData.email) {
            devLog.warn('⚠️ Cookie com ID antigo ou inválido, buscando por email...');
            const result = await supabase
              .from('usuarios')
              .select('*')
              .eq('email', cookieData.email)
              .eq('ativo', true)
              .single();
            userData = result.data;
            userError = result.error;
            
            if (userError && (userError.message?.includes('JWT expired') || userError.code === 'PGRST301')) {
              devLog.log('[Auth] 🔄 JWT expirado na query por email, forçando refresh...');
              const refreshed = await this.ensureValidSupabaseSession();
              if (refreshed) {
                const retry = await supabase
                  .from('usuarios')
                  .select('*')
                  .eq('email', cookieData.email)
                  .eq('ativo', true)
                  .single();
                userData = retry.data;
                userError = retry.error;
              }
            }
          }

          if (!userError && userData) {
            const hasAdminAccess = userData.acesso_area_admin === true;
            const hasClientAccess = userData.acesso_area_cliente === true;

            const recoveredUser: SupabaseUser = {
              id: userData.id?.toString(),
              nome: userData.nome,
              email: userData.email,
              telefone: userData.telefone,
              cnpjcpf: userData.cnpjcpf,
              cnpjcpfArray: extractCnpjCpfArray(userData.cnpjcpf),
              cnpjcpfAtual: extractCnpjCpfAtual(userData.cnpjcpf) || undefined,
              cargo: userData.cargo?.toString(),
              acesso_area_cliente: hasClientAccess,
              acesso_area_admin: hasAdminAccess,
              acessoAreaCliente: hasClientAccess,
              ativo: userData.ativo,
              supabase_id: cookieData.supabase_id,
              data_criacao: userData.data_criacao,
              data_ultima_atividade: userData.data_ultima_atividade,
              atualizado_em: userData.atualizado_em,
              hasAdminAccess,
              hasClientAccess,
              uid: cookieData.supabase_id,
              displayName: userData.nome,
              empresa: userData.empresa,
              nivel_hierarquico: userData.nivel_hierarquico || 1,
              filas: userData.filas || [],
              tags: userData.tags || [],
              tipo: hasAdminAccess ? 'admin' : 'cliente'
            };

            this.currentUser = recoveredUser;
            this.sessionValidatedAt = Date.now();
            
            if (cookieData.user_id !== userData.id?.toString()) {
              devLog.log('🔄 Atualizando cookie com novo UUID...');
              CookieAuth.setAuthCookie(
                userData.id?.toString(),
                userData.email,
                '',
                cookieData.supabase_id
              );
            }
            
            devLog.log('✅ Usuário recuperado do cookie:', recoveredUser.email);
            return recoveredUser;
          }
        } catch (error) {
          devLog.warn('⚠️ Erro ao recuperar usuário do cookie:', error);
          CookieAuth.clearAuthCookie();
        }
      }
      
      if (this.currentUser) {
        devLog.log('✅ Usuário já em memória:', this.currentUser.email);
        return this.currentUser;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session && session.user) {
          devLog.log('🔄 Tentando recuperar dados do usuário via sessão Supabase (cookie)...');
          
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('supabase_id', session.user.id)
            .eq('ativo', true)
            .single();

          if (!userError && userData) {
            const hasAdminAccess = userData.acesso_area_admin === true;
            const hasClientAccess = userData.acesso_area_cliente === true;

            const recoveredUser: SupabaseUser = {
              id: userData.id?.toString() || session.user.id,
              nome: userData.nome,
              email: userData.email,
              telefone: userData.telefone,
              cnpjcpf: userData.cnpjcpf,
              cnpjcpfArray: extractCnpjCpfArray(userData.cnpjcpf),
              cnpjcpfAtual: extractCnpjCpfAtual(userData.cnpjcpf) || undefined,
              cargo: userData.cargo?.toString(),
              acesso_area_cliente: userData.acesso_area_cliente || hasClientAccess,
              acesso_area_admin: userData.acesso_area_admin || hasAdminAccess,
              acessoAreaCliente: userData.acesso_area_cliente || hasClientAccess,
              ativo: userData.ativo,
              supabase_id: session.user.id,
              data_criacao: userData.data_criacao || new Date().toISOString(),
              data_ultima_atividade: new Date().toISOString(),
              atualizado_em: userData.atualizado_em || new Date().toISOString(),
              hasAdminAccess,
              hasClientAccess,
              uid: session.user.id,
              displayName: userData.nome,
              empresa: userData.empresa,
              nivel_hierarquico: userData.nivel_hierarquico || 1,
              filas: userData.filas || [],
              tags: userData.tags || [],
              tipo: hasAdminAccess ? 'admin' : 'cliente'
            };

            this.currentUser = recoveredUser;
            this.sessionValidatedAt = Date.now();
            devLog.log('✅ Usuário recuperado da sessão Supabase (cookie):', recoveredUser.email);
            return recoveredUser;
          }
        }
      } catch (sessionError) {
        devLog.warn('⚠️ Erro ao recuperar sessão do Supabase:', sessionError);
      }

      const hasCookieIndication = document.cookie.includes('fp_auth');
      if (!hasCookieIndication) {
        devLog.log('🚫 Nenhuma indicação de sessão prévia, pulando refresh token');
        return null;
      }

      devLog.log('🔄 Tentando renovar sessão via refresh token...');
      const refreshSuccess = await attemptTokenRefresh();
      
      if (refreshSuccess) {
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.user) {
          const { data: refreshedUserData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('supabase_id', newSession.user.id)
            .eq('ativo', true)
            .maybeSingle();

          if (refreshedUserData) {
            const hasAdminAccess = refreshedUserData.acesso_area_admin === true;
            const hasClientAccess = refreshedUserData.acesso_area_cliente === true;

            const refreshedUser: SupabaseUser = {
              id: refreshedUserData.id?.toString() || newSession.user.id,
              nome: refreshedUserData.nome,
              email: refreshedUserData.email,
              telefone: refreshedUserData.telefone,
              cnpjcpf: refreshedUserData.cnpjcpf,
              cnpjcpfArray: extractCnpjCpfArray(refreshedUserData.cnpjcpf),
              cnpjcpfAtual: extractCnpjCpfAtual(refreshedUserData.cnpjcpf) || undefined,
              cargo: refreshedUserData.cargo?.toString(),
              acesso_area_cliente: refreshedUserData.acesso_area_cliente || hasClientAccess,
              acesso_area_admin: refreshedUserData.acesso_area_admin || hasAdminAccess,
              acessoAreaCliente: refreshedUserData.acesso_area_cliente || hasClientAccess,
              ativo: refreshedUserData.ativo,
              supabase_id: newSession.user.id,
              data_criacao: refreshedUserData.data_criacao || new Date().toISOString(),
              data_ultima_atividade: new Date().toISOString(),
              atualizado_em: refreshedUserData.atualizado_em || new Date().toISOString(),
              hasAdminAccess,
              hasClientAccess,
              uid: newSession.user.id,
              displayName: refreshedUserData.nome,
              empresa: refreshedUserData.empresa,
              nivel_hierarquico: refreshedUserData.nivel_hierarquico || 1,
              filas: refreshedUserData.filas || [],
              tags: refreshedUserData.tags || [],
              tipo: hasAdminAccess ? 'admin' : 'cliente'
            };

            this.currentUser = refreshedUser;
            this.sessionValidatedAt = Date.now();
            devLog.log('✅ Usuário recuperado via refresh token:', refreshedUser.email);
            return refreshedUser;
          }
        }
      }

      devLog.log('❌ Nenhum usuário encontrado (cookie, sessão ou refresh token)');
      return null;

    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  }

  async refreshUserData(userId: string): Promise<SupabaseUser | null> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .single();

      if (userError || !userData) {
        console.error('❌ Erro ao buscar dados atualizados do usuário:', userError);
        return null;
      }

      const hasAdminAccess = userData.acesso_area_admin === true;
      const hasClientAccess = userData.acesso_area_cliente === true;

      const updatedUser: SupabaseUser = {
        id: userData.id?.toString(),
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone,
        cnpjcpf: userData.cnpjcpf,
        cnpjcpfArray: extractCnpjCpfArray(userData.cnpjcpf),
        cnpjcpfAtual: extractCnpjCpfAtual(userData.cnpjcpf) || undefined,
        cargo: userData.cargo?.toString(),
        acesso_area_cliente: userData.acesso_area_cliente || hasClientAccess,
        acesso_area_admin: userData.acesso_area_admin || hasAdminAccess,
        acessoAreaCliente: userData.acesso_area_cliente || hasClientAccess,
        ativo: userData.ativo,
        supabase_id: userData.supabase_id,
        data_criacao: userData.data_criacao,
        data_ultima_atividade: userData.data_ultima_atividade,
        atualizado_em: userData.atualizado_em,
        hasAdminAccess,
        hasClientAccess,
        uid: userData.supabase_id,
        displayName: userData.nome,
        empresa: userData.empresa,
        nivel_hierarquico: userData.nivel_hierarquico || 1,
        filas: userData.filas || [],
        tags: userData.tags || [],
        tipo: hasAdminAccess ? 'admin' : 'cliente'
      };

      CookieAuth.setAuthCookie(
        updatedUser.id,
        updatedUser.email,
        '',
        updatedUser.supabase_id
      );
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Limpa o cache do usuário (força nova busca no banco)
   */
  clearCache(): void {
    this.currentUser = null;
    this.sessionValidatedAt = 0;
  }

  isAuthenticated(): boolean {
    if (tokenStore.isTokenValid()) return true;
    if (CookieAuth.hasValidAuthCookie()) return true;
    if (this.currentUser) return true;
    return false;
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return !error && !!session;
    } catch (error) {
      console.error('❌ Erro ao atualizar sessão:', error);
      return false;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
