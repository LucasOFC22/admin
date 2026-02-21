import { devLog } from '@/utils/logger';
import { 
  logError, 
  showErrorToast,
  ErrorContext 
} from '@/utils/errorHandlerUtils';

/**
 * ✅ REFATORAÇÃO: Handler global otimizado usando utilitários centralizados
 */
export const setupGlobalErrorHandling = () => {
  // Capturar erros JavaScript não tratados
  window.addEventListener('error', async (event) => {
    devLog.error('❌ Erro global capturado:', event.error);

    const context: ErrorContext = {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    };

    await logError(
      event.error?.name || 'Erro JavaScript Global',
      event.error?.message || event.message,
      'javascript',
      'error',
      context
    );

    showErrorToast(
      'Erro Inesperado',
      'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
    );
  });

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', async (event) => {
    devLog.error('❌ Promise rejeitada não tratada:', event.reason);

    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    await logError(
      'Promise Rejeitada Não Tratada',
      error.message,
      'promise',
      'error',
      {
        reason: String(event.reason),
        stack: error.stack
      }
    );

    showErrorToast(
      'Erro de Conexão',
      'Houve um problema de conexão. Verifique sua internet.'
    );

    event.preventDefault();
  });

  // Monitorar erros de recursos (imagens, scripts, etc.)
  window.addEventListener('error', async (event) => {
    if (event.target !== window) {
      devLog.error('❌ Erro de recurso:', event);

      const target = event.target as HTMLElement & { src?: string; href?: string };
      
      await logError(
        'Erro ao Carregar Recurso',
        `Falha ao carregar: ${target.src || target.href || 'desconhecido'}`,
        'resource',
        'warning',
        {
          tagName: target.tagName,
          src: target.src,
          href: target.href
        }
      );
    }
  }, true);
};

/**
 * ✅ REFATORAÇÃO: Exportar funções do módulo de utilitários
 * Mantém compatibilidade com código existente
 */
export { logApiError, fetchWithErrorLogging } from '@/utils/errorHandlerUtils';