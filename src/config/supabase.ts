import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente do projeto conectado
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsa3BwdWNkbm12eWZzbmFycHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDEzNTQsImV4cCI6MjA4ODgxNzM1NH0.MCR1rdDr9CNgfzlpqPFp2sfLMpyfxFKeEcgFOFdTXVs';

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

/** URL base do Supabase para construir URLs de edge functions, storage, etc. */
export const SUPABASE_BASE_URL = SUPABASE_URL;
