import { useState, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { useErrorHandler } from './useErrorHandler';

interface UseImprovedAsyncOperationOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  logErrors?: boolean;
}

export const useImprovedAsyncOperation = (options: UseImprovedAsyncOperationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = "Operação realizada com sucesso",
    errorMessage,
    onSuccess,
    onError,
    logErrors = true
  } = options;

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    customOptions?: {
      successMessage?: string;
      errorMessage?: string;
      context?: any;
    }
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      
      // Toast de sucesso
      if (showSuccessToast) {
        toast.success(customOptions?.successMessage || successMessage);
      }
      
      // Callback de sucesso
      onSuccess?.();
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Handle error com logging e toast
      await handleError(error, {
        showToast: showErrorToast,
        logError: logErrors,
        context: customOptions?.context,
        customMessage: customOptions?.errorMessage || errorMessage
      });
      
      // Callback de erro
      onError?.(error);
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    showSuccessToast,
    showErrorToast,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    logErrors,
    handleError
  ]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
};

// Hook especializado para operações de CRUD
export const useCrudOperation = () => {
  const createOperation = useImprovedAsyncOperation({
    successMessage: "Item criado com sucesso",
    errorMessage: "Erro ao criar item"
  });

  const updateOperation = useImprovedAsyncOperation({
    successMessage: "Item atualizado com sucesso",
    errorMessage: "Erro ao atualizar item"
  });

  const deleteOperation = useImprovedAsyncOperation({
    successMessage: "Item excluído com sucesso",
    errorMessage: "Erro ao excluir item"
  });

  const fetchOperation = useImprovedAsyncOperation({
    showSuccessToast: false,
    errorMessage: "Erro ao carregar dados"
  });

  return {
    create: createOperation,
    update: updateOperation,
    delete: deleteOperation,
    fetch: fetchOperation
  };
};
