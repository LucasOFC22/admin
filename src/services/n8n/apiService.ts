import { n8nConfig } from '@/config/n8n.config';
import { backendService } from '@/services/api/backendService';

interface N8nResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  useTestEndpoint?: boolean;
}

class N8nApiService {
  private defaultHeaders: Record<string, string>;
  private requestId: string = '';

  constructor() {
    this.defaultHeaders = {}; // Will be loaded asynchronously
  }

  private async makeRequest<T>({ method, endpoint, data, headers = {}, useTestEndpoint = false }: RequestConfig): Promise<N8nResponse<T>> {
    try {
      // Carregar configuração do banco se necessário
      await n8nConfig.loadConfiguration();
      this.defaultHeaders = n8nConfig.getDefaultHeaders();
      
      // Verificar se configuração está válida
      if (!n8nConfig.isConfigured()) {
        throw new Error('N8N não está configurado. Configuração não encontrada no banco.');
      }

      // Verificar rate limiting
      if (!n8nConfig.canMakeRequest(this.requestId)) {
        throw new Error('Rate limit excedido. Tente novamente em alguns momentos.');
      }

      const url = n8nConfig.getEndpoint(useTestEndpoint);
      const timeoutMs = n8nConfig.getTimeout();
      
      // Criar controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const config: RequestInit = {
        method: 'POST', // Always POST for N8N webhooks
        headers: {
          ...this.defaultHeaders,
          ...headers
        },
        signal: controller.signal
      };

      // Use eventType and acao pattern
      const payload = {
        eventType: endpoint.split('/')[0] || 'auth',
        acao: endpoint,
        ...data
      };

      config.body = JSON.stringify(payload);

      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        // Check if response has content
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        let result;
        if (contentLength === '0' || (!contentType?.includes('application/json'))) {
          result = { success: true };
        } else {
          const text = await response.text();
          if (text.trim() === '') {
            result = { success: true };
          } else {
            result = JSON.parse(text);
          }
        }
        
        return {
          success: true,
          data: result.data || result,
          message: result.message
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(`Request timeout após ${timeoutMs}ms`);
        }
        throw fetchError;
      }
    } catch (error) {
      // Log de erro para monitoramento
      const errorLog = {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      };
      
      // Armazenar erro no localStorage para debug (limitado)
      try {
        const errors = JSON.parse(localStorage.getItem('n8n_errors') || '[]');
        errors.push(errorLog);
        // Manter apenas os últimos 10 erros
        if (errors.length > 10) errors.shift();
        localStorage.setItem('n8n_errors', JSON.stringify(errors));
      } catch (storageError) {
        // Silently fail storage error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Métodos CRUD genéricos
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<N8nResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      endpoint,
      data: params
    });
  }

  async post<T>(endpoint: string, data: any, useTestEndpoint = false): Promise<N8nResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      endpoint,
      data,
      useTestEndpoint
    });
  }

  async put<T>(endpoint: string, data: any): Promise<N8nResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      endpoint,
      data
    });
  }

  async delete<T>(endpoint: string): Promise<N8nResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      endpoint
    });
  }

  // Método específico para consultar NF-e - usa backend como proxy
  async consultarNFe(chaveNFe: string): Promise<N8nResponse<any>> {
    try {
      const response = await backendService.consultarNfe({ chaveNFe });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Método direto para fazer requisições N8N via backend proxy
  async makeN8nRequest<T>(payload: any, useTestEndpoint = false): Promise<N8nResponse<T>> {
    try {
      this.requestId = crypto.randomUUID();
      
      // Usar backend como proxy para N8N
      const response = await backendService.n8nProxy<T>({
        ...payload,
        _metadata: {
          requestId: this.requestId,
          timestamp: new Date().toISOString(),
          source: 'fp-transcargas-frontend',
          version: import.meta.env.VITE_APP_VERSION || '2.0.0'
        }
      });

      return response;
    } catch (error) {
      const errorLog = {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: this.requestId
      };
      
      try {
        const errors = JSON.parse(localStorage.getItem('n8n_errors') || '[]');
        errors.push(errorLog);
        if (errors.length > 10) errors.shift();
        localStorage.setItem('n8n_errors', JSON.stringify(errors));
      } catch (storageError) {
        // Silently fail storage error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const n8nApi = new N8nApiService();
export type { N8nResponse };
