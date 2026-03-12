/**
 * Interceptor para logging automático de chamadas API
 */

import { unifiedLogService } from './unifiedLogService';

interface ApiLogConfig {
  enabled: boolean;
  logSuccessfulRequests: boolean;
  logRequestBody: boolean;
  logResponseBody: boolean;
  excludePatterns: RegExp[];
  slowRequestThreshold: number; // ms
}

const defaultConfig: ApiLogConfig = {
  enabled: true,
  logSuccessfulRequests: false, // Não logar requisições bem-sucedidas (200)
  logRequestBody: false, // Por segurança, desabilitado por padrão
  logResponseBody: false,
  excludePatterns: [
    /\/auth\//,       // Não logar chamadas de auth (dados sensíveis)
    /healthcheck/,    // Não logar healthchecks
    /\/logs/,         // Evitar loop infinito
    /\/erros/,        // Evitar loop infinito com tabela de erros
    /\/rest\/v1\//,   // Não logar chamadas internas do Supabase
    /\/functions\/v1\//, // Não interceptar Edge Functions (evita consumo de body stream)
  ],
  slowRequestThreshold: 2000
};

class ApiInterceptor {
  private config: ApiLogConfig;
  private originalFetch: typeof fetch;
  private isInitialized = false;

  constructor(config: Partial<ApiLogConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.originalFetch = window.fetch.bind(window);
  }

  /**
   * Inicializa o interceptor
   */
  initialize(): void {
    if (this.isInitialized || !this.config.enabled) return;

    window.fetch = this.interceptedFetch.bind(this);
    this.isInitialized = true;
  }

  /**
   * Desabilita o interceptor
   */
  disable(): void {
    if (!this.isInitialized) return;
    
    window.fetch = this.originalFetch;
    this.isInitialized = false;
  }

  /**
   * Verifica se a URL deve ser excluída do logging
   */
  private shouldExclude(url: string): boolean {
    return this.config.excludePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extrai o módulo da URL
   */
  private extractModule(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts[0] || 'api';
    } catch {
      return 'api';
    }
  }

  /**
   * Fetch interceptado
   */
  private async interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';

    // Verificar se deve ser excluído
    if (this.shouldExclude(url)) {
      return this.originalFetch(input, init);
    }

    const startTime = performance.now();
    let response: Response;
    let error: Error | null = null;

    try {
      response = await this.originalFetch(input, init);
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = Math.round(performance.now() - startTime);
      const modulo = this.extractModule(url);

      // Log baseado no resultado - apenas erros (4xx, 5xx) ou falhas de rede
      if (error) {
        await this.logApiError(modulo, method, url, error, duration);
      } else if (response! && !response.ok) {
        // Só loga se for erro HTTP (status >= 400)
        await this.logApiResponse(modulo, method, url, response, duration);
      }

      // Log de performance para requisições lentas
      if (duration > this.config.slowRequestThreshold) {
        await unifiedLogService.logPerformance(
          modulo,
          `${method} ${url}`,
          duration,
          { threshold: this.config.slowRequestThreshold }
        );
      }
    }

    return response!;
  }

  /**
   * Log de resposta da API
   */
  private async logApiResponse(
    modulo: string,
    method: string,
    url: string,
    response: Response,
    duration: number
  ): Promise<void> {
    const detalhes: Record<string, any> = {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      duration_ms: duration
    };

    // Adicionar body da resposta se configurado e for erro
    if (this.config.logResponseBody && !response.ok) {
      try {
        const clonedResponse = response.clone();
        const body = await clonedResponse.text();
        detalhes.responseBody = body.substring(0, 500); // Limitar tamanho
      } catch {
        // Ignorar erros ao ler body
      }
    }

    await unifiedLogService.logApi(
      modulo,
      method,
      this.sanitizeUrl(url),
      response.status,
      duration,
      detalhes
    );
  }

  /**
   * Log de erro da API
   */
  private async logApiError(
    modulo: string,
    method: string,
    url: string,
    error: Error,
    duration: number
  ): Promise<void> {
    await unifiedLogService.logErro(
      modulo,
      `${method} ${this.sanitizeUrl(url)}`,
      error,
      { duration_ms: duration }
    );
  }

  /**
   * Remove dados sensíveis da URL
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remover parâmetros sensíveis
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'apikey'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '***');
        }
      });

      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<ApiLogConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const apiInterceptor = new ApiInterceptor();

// Inicializar automaticamente em produção
if (import.meta.env.PROD) {
  apiInterceptor.initialize();
}
