import { useCallback } from 'react';
import { toast } from '@/lib/toast';
import { errorLogService } from '@/services/error/errorLogService';
import { devLog } from '@/utils/logger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: any;
  customMessage?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback(async (
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      context,
      customMessage
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorMessage = customMessage || errorObj.message || 'Ocorreu um erro inesperado';

    // Log do erro no console (desenvolvimento)
    devLog.error('❌ Erro capturado pelo useErrorHandler:', errorObj);

    // Mostrar toast de erro para o usuário
    if (showToast) {
      toast.error('Erro', errorMessage);
    }

    // Log do erro no Supabase
    if (logError) {
      try {
        await errorLogService.logError({
          titulo: errorObj.name || 'Erro da Aplicação',
          descricao: errorObj.message,
          categoria: 'application',
          nivel: 'error',
          dados_extra: {
            stack: errorObj.stack,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        devLog.error('❌ Erro ao salvar log de erro:', logError);
      }
    }

    return errorObj;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      await handleError(error as Error, options);
      return null;
    }
  }, [handleError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        await handleError(error as Error, options);
        return null;
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    withErrorHandling
  };
};

// Hook para operações assíncronas com estados de loading e error
export const useAsyncErrorHandler = <T>() => {
  const { handleError } = useErrorHandler();

  const executeWithErrorHandling = useCallback(async (
    asyncFn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const data = await asyncFn();
      return { data, error: null };
    } catch (error) {
      const errorObj = await handleError(error as Error, options);
      return { data: null, error: errorObj };
    }
  }, [handleError]);

  return { executeWithErrorHandling };
};
