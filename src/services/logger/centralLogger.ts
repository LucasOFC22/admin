import { errorLogService } from '@/services/error/errorLogService';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogCategory = 'auth' | 'database' | 'api' | 'ui' | 'navigation' | 'form' | 'file' | 'performance' | 'business';

interface LogContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  module: string;
  function: string;
  duration?: number;
  inputData?: any;
  outputData?: any;
  errorStack?: string;
  [key: string]: any;
}

class CentralLogger {
  private isDevelopment = import.meta.env.DEV;
  private performanceThreshold = 1000; // ms

  /**
   * Sanitiza dados sensíveis antes de logar
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'senha', 'token', 'secret', 'apiKey', 'cpf', 'cnpj'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }

  /**
   * Formata mensagem de log consistente
   */
  private formatMessage(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const module = `${context.module}/${context.function}`;
    return `[${timestamp}] [${level.toUpperCase()}] [${category}] [${module}] ${message}`;
  }

  /**
   * Log genérico
   */
  async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: LogContext
  ): Promise<void> {
    const formattedMessage = this.formatMessage(level, category, message, context);
    
    // Console log em desenvolvimento
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' || level === 'critical' ? 'error' : 
                           level === 'warning' ? 'warn' : 'log';
      console[consoleMethod](formattedMessage, {
        context: this.sanitizeData(context)
      });
    }

    // Salvar no banco apenas erros, warnings e críticos (ou info em produção)
    if (level === 'error' || level === 'critical' || level === 'warning' || !this.isDevelopment) {
      try {
        await errorLogService.logError({
          titulo: `[${category}] ${context.module}.${context.function}`,
          descricao: message,
          categoria: category,
          nivel: level === 'critical' ? 'critical' : level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
          dados_extra: {
            ...this.sanitizeData(context),
            formattedMessage,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          }
        });
      } catch (error) {
        console.error('Falha ao salvar log no banco:', error);
      }
    }
  }

  /**
   * Log de entrada de dados
   */
  async logInput(
    module: string,
    functionName: string,
    inputData: any,
    category: LogCategory = 'business'
  ): Promise<void> {
    await this.log('info', category, 'Entrada de dados recebida', {
      module,
      function: functionName,
      inputData: this.sanitizeData(inputData)
    });
  }

  /**
   * Log de processamento/decisão
   */
  async logProcessing(
    module: string,
    functionName: string,
    decision: string,
    result: any,
    duration?: number,
    category: LogCategory = 'business'
  ): Promise<void> {
    const message = duration 
      ? `Processamento concluído em ${duration}ms: ${decision}`
      : `Processamento: ${decision}`;

    await this.log('info', category, message, {
      module,
      function: functionName,
      duration,
      outputData: this.sanitizeData(result)
    });

    // Alerta de performance
    if (duration && duration > this.performanceThreshold) {
      await this.log('warning', 'performance', `Operação lenta detectada (${duration}ms)`, {
        module,
        function: functionName,
        duration,
        threshold: this.performanceThreshold
      });
    }
  }

  /**
   * Log de operação de banco de dados
   */
  async logDatabase(
    module: string,
    functionName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    params?: any,
    result?: any,
    duration?: number
  ): Promise<void> {
    const message = `${operation} em ${table}`;
    
    await this.log('debug', 'database', message, {
      module,
      function: functionName,
      operation,
      table,
      params: this.sanitizeData(params),
      result: result ? { affected: result.count || result.length, summary: 'dados retornados' } : undefined,
      duration
    });
  }

  /**
   * Log de chamada de API
   */
  async logApi(
    module: string,
    functionName: string,
    method: string,
    endpoint: string,
    params?: any,
    response?: any,
    status?: number,
    duration?: number
  ): Promise<void> {
    const message = `${method} ${endpoint} - Status: ${status || 'N/A'}`;
    const level = status && status >= 400 ? 'error' : 'info';
    
    await this.log(level, 'api', message, {
      module,
      function: functionName,
      method,
      endpoint,
      params: this.sanitizeData(params),
      response: this.sanitizeData(response),
      status,
      duration
    });
  }

  /**
   * Log de erro
   */
  async logError(
    module: string,
    functionName: string,
    error: Error | string,
    context?: any
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    await this.log('error', 'business', `Erro: ${errorMessage}`, {
      module,
      function: functionName,
      errorStack: stack,
      errorName: error instanceof Error ? error.name : 'Error',
      ...this.sanitizeData(context)
    });
  }

  /**
   * Log crítico
   */
  async logCritical(
    module: string,
    functionName: string,
    message: string,
    context?: any
  ): Promise<void> {
    await this.log('critical', 'business', message, {
      module,
      function: functionName,
      ...this.sanitizeData(context)
    });
  }

  /**
   * Log de navegação
   */
  async logNavigation(
    from: string,
    to: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.log('debug', 'navigation', `Navegação: ${from} → ${to}`, {
      module: 'Router',
      function: 'navigate',
      from,
      to,
      userId,
      userEmail
    });
  }

  /**
   * Log de autenticação
   */
  async logAuth(
    module: string,
    functionName: string,
    action: 'login' | 'logout' | 'signup' | 'password_reset',
    userEmail?: string,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    const level = success ? 'info' : 'error';
    const message = success 
      ? `${action} bem-sucedido${userEmail ? ` para ${userEmail}` : ''}`
      : `Falha em ${action}${error ? `: ${error}` : ''}`;

    await this.log(level, 'auth', message, {
      module,
      function: functionName,
      action,
      userEmail,
      success
    });
  }

  /**
   * Wrapper para medir performance de funções
   */
  async measurePerformance<T>(
    module: string,
    functionName: string,
    operation: () => Promise<T>,
    category: LogCategory = 'performance'
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = Math.round(performance.now() - startTime);
      
      await this.logProcessing(module, functionName, 'Operação concluída', result, duration, category);
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      await this.logError(module, functionName, error as Error, { duration });
      throw error;
    }
  }
}

export const centralLogger = new CentralLogger();
