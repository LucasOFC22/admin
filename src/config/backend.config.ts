// Configuração do Backend Node.js
// URL Base: https://api.fptranscargas.com.br

export const BACKEND_CONFIG = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'https://api.fptranscargas.com.br',
  timeout: 90000, // 90 segundos
  headers: {
    'Content-Type': 'application/json',
    'X-Source': 'fp-transcargas-admin',
    'X-Client-Version': import.meta.env.VITE_APP_VERSION || '2.0.0'
  }
};

export const getBackendUrl = (endpoint: string): string => {
  const base = BACKEND_CONFIG.baseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};
