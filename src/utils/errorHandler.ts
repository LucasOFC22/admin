import { logErrorToDatabase } from '@/hooks/useErrorLogger';

/**
 * Handler global para erros não capturados
 */
export const setupGlobalErrorHandlers = () => {
  // Capturar erros não tratados
  window.addEventListener('error', async (event) => {
    console.error('Erro global capturado:', event.error);
    
    await logErrorToDatabase({
      titulo: event.error?.name || 'Erro JavaScript',
      descricao: event.error?.message || event.message || 'Erro desconhecido',
      categoria: 'javascript',
      nivel: 'error',
      dados_extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    });
  });

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', async (event) => {
    console.error('Promise rejeitada não tratada:', event.reason);
    
    await logErrorToDatabase({
      titulo: 'Promise Rejeitada',
      descricao: event.reason?.message || String(event.reason) || 'Promise rejeitada sem mensagem',
      categoria: 'promise',
      nivel: 'error',
      dados_extra: {
        reason: event.reason,
        promise: String(event.promise),
        stack: event.reason?.stack
      }
    });
  });
};

/**
 * Wrapper para funções assíncronas com tratamento de erro
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      console.error(`Erro em ${context || 'operação'}:`, error);
      
      await logErrorToDatabase({
        titulo: `Erro em ${context || 'operação'}`,
        descricao: error?.message || String(error),
        categoria: 'async-operation',
        nivel: 'error',
        dados_extra: {
          context,
          args: args,
          stack: error?.stack
        }
      });
      
      throw error;
    }
  }) as T;
};
