import { errorLogService } from '@/services/error/errorLogService';
import { toast } from '@/lib/toast';

/**
 * ✅ NOVO: Utilitários centralizados para tratamento de erros
 * Elimina duplicação e fornece interface consistente
 */

export interface ErrorContext {
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ApiErrorContext extends ErrorContext {
  endpoint?: string;
  method?: string;
  payload?: unknown;
  status?: number;
  statusText?: string;
  responseData?: unknown;
}

/**
 * ✅ REFATORAÇÃO: Handler base de erros com tipos fortes
 */
export const logError = async (
  title: string,
  description: string,
  category: 'javascript' | 'promise' | 'resource' | 'api' | 'application',
  level: 'info' | 'warning' | 'error' | 'critical',
  context: ErrorContext = {}
): Promise<void> => {
  try {
    await errorLogService.logError({
      titulo: title,
      descricao: description,
      categoria: category,
      nivel: level,
      dados_extra: {
        ...context,
        url: context.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
        timestamp: context.timestamp || new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error('❌ Erro ao salvar log:', logError);
  }
};

/**
 * ✅ NOVO: Interface para erros de API
 */
interface ApiError {
  message?: string;
  status?: number;
  statusText?: string;
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
}

/**
 * ✅ NOVO: Handler específico para erros de API
 */
export const logApiError = async (
  error: Error | ApiError,
  endpoint: string,
  method: string = 'GET',
  payload?: unknown
): Promise<void> => {
  const errorMessage = 'message' in error && error.message ? error.message : String(error);
  const status = 'status' in error ? error.status : ('response' in error ? error.response?.status : undefined);
  const statusText = 'statusText' in error ? error.statusText : ('response' in error ? error.response?.statusText : undefined);
  const responseData = 'response' in error ? error.response?.data : undefined;

  await logError(
    `Erro de API [${method}]`,
    `${endpoint}: ${errorMessage}`,
    'api',
    'error',
    {
      endpoint,
      method,
      payload,
      status,
      statusText,
      responseData
    }
  );
};

/**
 * ✅ NOVO: Mostrar toast de erro com feedback amigável
 */
export const showErrorToast = (
  title: string,
  description: string,
  duration: number = 5000
): void => {
  toast.error(title, {
    description,
    duration
  });
};

/**
 * ✅ NOVO: Handler combinado: log + toast
 */
export const handleErrorWithFeedback = async (
  title: string,
  description: string,
  category: 'javascript' | 'promise' | 'resource' | 'api' | 'application',
  level: 'info' | 'warning' | 'error' | 'critical',
  context: ErrorContext = {},
  showToast: boolean = true
): Promise<void> => {
  await logError(title, description, category, level, context);
  
  if (showToast) {
    showErrorToast(title, description);
  }
};

/**
 * ✅ NOVO: Wrapper seguro para fetch com logging automático
 */
export const fetchWithErrorLogging = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      await logApiError(
        {
          status: response.status,
          statusText: response.statusText,
          message: `HTTP ${response.status}: ${response.statusText}`
        },
        url,
        options?.method || 'GET',
        options?.body
      );
    }
    
    return response;
  } catch (error) {
    await logApiError(
      error as Error,
      url,
      options?.method || 'GET',
      options?.body
    );
    throw error;
  }
};
