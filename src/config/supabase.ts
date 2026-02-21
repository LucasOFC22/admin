import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
// Em produção, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no deploy
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kong.fptranscargas.com.br';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwMzg4NDAwLCJleHAiOjE5MDgxNTQ4MDB9.EQCozsdfrcZGLM02o5WXeV_8Qb9x1hVZCSGGP6pyIWE';

// Validação de configuração obrigatória em produção
if (import.meta.env.PROD && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.error('⚠️ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias em produção');
}

// Feature flag para Realtime (WebSocket)
export const REALTIME_ENABLED = true;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    timeout: 30000
  }
});

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};
