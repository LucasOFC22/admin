/**
 * Cliente Supabase Autenticado
 * Retorna um cliente Supabase configurado com o JWT do cookie cross-domain
 * para passar nas verificações RLS como usuário autenticado
 * 
 * IMPORTANTE: Todo o sistema WhatsApp deve usar requireAuthenticatedClient()
 * para garantir que as requisições passem com JWT válido.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CookieAuth } from '@/lib/auth/cookieAuth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa3BwdWNkbm12eWZzbmFycHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDEzNTQsImV4cCI6MjA4ODgxNzM1NH0.MCR1rdDr9CNgfzlpqPFp2sfLMpyfxFKeEcgFOFdTXVs';

let authenticatedClient: SupabaseClient | null = null;
let lastToken: string | null = null;

// Cliente dedicado para Realtime com accessToken configurado
let realtimeClient: SupabaseClient | null = null;
let lastRealtimeToken: string | null = null;

/**
 * Retorna um cliente Supabase autenticado usando o token JWT do cookie
 * O token é passado como Bearer header para satisfazer as políticas RLS
 * @returns SupabaseClient | null - null se não houver token
 */
export function getAuthenticatedSupabaseClient(): SupabaseClient | null {
  const token = CookieAuth.getToken();
  
  if (!token) {
    console.warn('[SupabaseAuth] No JWT token found in cookie fp_auth_session');
    return null;
  }

  // Se o token mudou ou não temos cliente, criar novo
  if (token !== lastToken || !authenticatedClient) {
    authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    lastToken = token;
  }

  return authenticatedClient;
}

/**
 * Retorna um cliente Supabase autenticado ou lança erro
 * Use este método em todos os serviços do WhatsApp para garantir autenticação
 * @throws Error se não houver token JWT válido
 */
export function requireAuthenticatedClient(): SupabaseClient {
  const client = getAuthenticatedSupabaseClient();
  
  if (!client) {
    const error = new Error('[SupabaseAuth] JWT ausente - usuário não autenticado. Cookie fp_auth_session não encontrado ou expirado.');
    console.error(error.message);
    throw error;
  }
  
  return client;
}

/**
 * Limpa o cliente autenticado em cache (usar ao fazer logout)
 */
export function clearAuthenticatedClient(): void {
  authenticatedClient = null;
  lastToken = null;
  // Também limpa o cliente Realtime
  clearRealtimeClientInternal();
}

// Função interna para evitar dependência circular
function clearRealtimeClientInternal(): void {
  realtimeClient = null;
  lastRealtimeToken = null;
}

/**
 * Verifica se temos um token JWT válido disponível
 */
export function hasValidToken(): boolean {
  return CookieAuth.getToken() !== null;
}

/**
 * Retorna cliente para subscriptions Realtime com accessToken configurado
 * Este cliente usa a opção accessToken que o supabase-js v2 usa para autenticar
 * o websocket do Realtime (não só REST headers).
 * IMPORTANTE: Usar este helper para TODAS as subscriptions Realtime no admin
 */
export function getRealtimeClient(): SupabaseClient {
  const token = CookieAuth.getToken();
  
  // Se não há token, retorna cliente anônimo
  if (!token) {
    console.warn('[Realtime:Auth] Sem token, usando cliente anônimo');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { supabase } = require('@/config/supabase');
    return supabase;
  }
  
  // Se token mudou ou não temos cliente, criar novo com accessToken
  if (token !== lastRealtimeToken || !realtimeClient) {
    realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      // accessToken callback é a forma correta de autenticar o Realtime no supabase-js v2
      // Isso faz o RealtimeClient incluir o token no join payload dos canais
      accessToken: async () => token,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        timeout: 30000
      }
    });
    lastRealtimeToken = token;
  }
  
  return realtimeClient;
}

/**
 * Limpa o cliente Realtime em cache (usar ao fazer logout ou quando token mudar)
 */
export function clearRealtimeClient(): void {
  clearRealtimeClientInternal();
}
