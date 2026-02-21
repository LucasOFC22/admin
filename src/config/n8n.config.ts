
import { secretService } from '@/services/supabase/secretService';
import { configService } from '@/services/supabase/configService';

// Configuração dinâmica N8N carregada do banco
let N8N_CONFIG = {
  // URLs dos endpoints (carregadas do banco)
  endpoints: {
    secure: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
    test: import.meta.env.VITE_N8N_WEBHOOK_TEST_URL || ''
  },
  headers: {
    'Content-Type': 'application/json',
    'X-Source': 'fp-transcargas-admin',
    'X-Timestamp': () => new Date().toISOString(),
    'X-Client-Version': import.meta.env.VITE_APP_VERSION || '2.0.0',
    'X-Request-ID': () => crypto.randomUUID()
  },
  security: {
    // Token de autenticação para N8N (se configurado)
    authToken: import.meta.env.VITE_N8N_AUTH_TOKEN || '',
    // Rate limiting (requests por minuto)
    rateLimitPerMinute: 60,
    // Timeout em ms (90 segundos para consultas pesadas)
    timeout: 90000
  }
};

// Carregar configuração do banco (Supabase: config.n8n_webhook + secret.n8n)
const loadN8nConfigFromDB = async (): Promise<void> => {
  try {
    // 1. Buscar webhook da tabela config
    const systemConfig = await configService.getConfig();
    if (systemConfig?.n8n_webhook) {
      N8N_CONFIG.endpoints.secure = systemConfig.n8n_webhook;
    }

    // 2. Buscar demais configurações da tabela secret
    const secrets = await secretService.getSecrets();
    const n8nSecret = secrets.find(secret => secret.name === 'n8n');
    
    if (n8nSecret && n8nSecret.value) {
      const configData = JSON.parse(n8nSecret.value);
      
      // Sobrescrever webhook se também estiver no secret (config tem prioridade)
      if (configData.webhookUrl && !systemConfig?.n8n_webhook) {
        N8N_CONFIG.endpoints.secure = configData.webhookUrl;
      }
      if (configData.apiKey) {
        N8N_CONFIG.security.authToken = configData.apiKey;
      }
      if (configData.timeout) {
        N8N_CONFIG.security.timeout = parseInt(configData.timeout) || 30000;
      }
    }
  } catch (error) {
    // Silently fail - configuration will use defaults
  }
};

// Rate limiting storage
const rateLimitStorage = new Map<string, number[]>();

// Função para validar URL do endpoint
const validateEndpoint = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    // Verificar se é HTTPS em produção
    if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
      console.warn('⚠️ Endpoint N8N deve usar HTTPS em produção');
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Função para verificar rate limiting
const checkRateLimit = (identifier: string = 'default'): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const limit = N8N_CONFIG.security.rateLimitPerMinute;
  
  if (!rateLimitStorage.has(identifier)) {
    rateLimitStorage.set(identifier, []);
  }
  
  const requests = rateLimitStorage.get(identifier)!;
  // Remover requests antigos
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    console.warn(`⚠️ Rate limit excedido para ${identifier}`);
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStorage.set(identifier, recentRequests);
  return true;
};

// Classe de configuração N8N com segurança aprimorada
export class N8nConfig {
  private static instance: N8nConfig;
  private static configLoaded: boolean = false;
  
  private constructor() {
    // Configuração inicial será carregada de forma assíncrona
  }
  
  static getInstance(): N8nConfig {
    if (!N8nConfig.instance) {
      N8nConfig.instance = new N8nConfig();
    }
    return N8nConfig.instance;
  }
  
  // Carregar configuração assíncrona
  async loadConfiguration(): Promise<void> {
    if (N8nConfig.configLoaded) {
      return;
    }
    
    try {
      await loadN8nConfigFromDB();
      N8nConfig.configLoaded = true;
    } catch (error) {
      // Silently fail - will use default configuration
    }
  }
  
  private validateConfiguration(): void {
    const secureUrl = N8N_CONFIG.endpoints.secure;
    const testUrl = N8N_CONFIG.endpoints.test;
    
    if (!secureUrl && !testUrl) {
      console.warn('⚠️ Nenhuma URL N8N configurada - tentando carregar do banco');
    }
    
    if (secureUrl && !validateEndpoint(secureUrl)) {
      console.error('🔒 ERRO: URL N8N segura inválida');
    }
    
    if (testUrl && !validateEndpoint(testUrl)) {
      console.error('🔒 ERRO: URL N8N de teste inválida');
    }
  }
  
  getSecureUrl(): string {
    const url = N8N_CONFIG.endpoints.secure;
    if (!validateEndpoint(url)) {
      throw new Error('URL N8N segura não configurada ou inválida');
    }
    return url;
  }
  
  getTestUrl(): string {
    const url = N8N_CONFIG.endpoints.test;
    if (!validateEndpoint(url)) {
      throw new Error('URL N8N de teste não configurada ou inválida');
    }
    return url;
  }
  
  getDefaultHeaders(): Record<string, string> {
    const headers = {
      ...N8N_CONFIG.headers,
      'X-Timestamp': N8N_CONFIG.headers['X-Timestamp'](),
      'X-Request-ID': N8N_CONFIG.headers['X-Request-ID']()
    };
    
    // Adicionar token de autenticação se configurado
    if (N8N_CONFIG.security.authToken) {
      headers['Authorization'] = `Bearer ${N8N_CONFIG.security.authToken}`;
    }
    
    return headers;
  }
  
  // Método seguro para escolher endpoint
  getEndpoint(useTest = false): string {
    return useTest ? this.getTestUrl() : this.getSecureUrl();
  }
  
  // Verificar se pode fazer requisição (rate limiting)
  canMakeRequest(identifier?: string): boolean {
    return checkRateLimit(identifier);
  }
  
  // Obter timeout configurado
  getTimeout(): number {
    return N8N_CONFIG.security.timeout;
  }
  
  // Verificar se configuração está válida
  isConfigured(): boolean {
    try {
      const hasSecure = validateEndpoint(N8N_CONFIG.endpoints.secure);
      const hasTest = validateEndpoint(N8N_CONFIG.endpoints.test);
      return hasSecure || hasTest;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const n8nConfig = N8nConfig.getInstance();
