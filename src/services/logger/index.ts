/**
 * Exportação centralizada de todos os serviços de logging
 */

// Serviço principal unificado
export { unifiedLogService, type LogType, type LogLevel, type LogCategory, type UnifiedLogData } from './unifiedLogService';

// Logger central (legado - mantido para compatibilidade)
export { centralLogger } from './centralLogger';

// Loggers de módulos originais
export {
  cotacoesLogger,
  manifestosLogger,
  nfeLogger,
  contatosLogger,
  contasReceberLogger,
  usuariosLogger,
  cargosLogger
} from './moduleLoggers';

// Loggers de módulos expandidos
export {
  coletasLogger,
  clientesLogger,
  configuracoesLogger,
  ticketsLogger,
  documentosLogger,
  permissoesLogger,
  formulariosLogger,
  arquivosLogger,
  relatoriosLogger,
  notificacoesLogger
} from './expandedModuleLoggers';

// API Interceptor
export { apiInterceptor } from './apiInterceptor';
