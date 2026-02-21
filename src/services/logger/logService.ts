/**
 * Serviço centralizado de logs para todas as tabelas do sistema
 * Implementa proteção silenciosa para páginas públicas
 */

import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { supabase as supabaseAnon } from '@/config/supabase';
import { getUserIP } from '@/utils/deviceInfo';
import { normalizeIpAddress } from '@/utils/ipUtils';
import {
  LogUsuarioInsert,
  LogContatoInsert,
  LogConfiguracaoInsert,
  LogEmailInsert,
  LogChatInternoInsert,
  LogMaloteInsert,
  LogFlowBuilderInsert,
  LogConexaoInsert,
  LogCargoInsert,
  LogTagInsert,
  LogDocumentoInsert,
  LogFilaInsert,
  LogAutenticacaoInsert,
  LogSistemaInsert,
  NivelLog
} from '@/types/allLogs';

// =============================================
// UTILITÁRIOS
// =============================================

/**
 * Obtém informações do dispositivo de forma assíncrona (inclui IP real)
 */
const getDeviceInfo = async (): Promise<{ ip_address: string; user_agent: string }> => {
  const rawIp = await getUserIP();
  return {
    ip_address: normalizeIpAddress(rawIp),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
};

/**
 * Verifica se há sessão ativa de forma silenciosa
 * Retorna null se não houver sessão (páginas públicas)
 */
const getSessionSilently = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabaseAnon.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

/**
 * Busca o ID da tabela usuarios a partir do supabase_id (auth.users.id)
 * Retorna o ID da tabela usuarios ou null se não encontrar
 */
const getUsuarioId = async (): Promise<string | null> => {
  try {
    const authUserId = await getSessionSilently();
    if (!authUserId) return null;


    const client = requireAuthenticatedClient();
    const { data } = await client
      .from('usuarios')
      .select('id')
      .eq('supabase_id', authUserId)
      .maybeSingle();
    
    return data?.id?.toString() || null;
  } catch {
    return null;
  }
};

/**
 * Sanitiza dados sensíveis antes de logar
 */
const sanitizeData = (data: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!data) return null;
  
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'api_key', 'apiKey'];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Executa inserção de log de forma silenciosa (sem erros)
 */
const insertLogSilently = async (
  table: string,
  logData: Record<string, unknown>
): Promise<boolean> => {
  try {
    // Para logs de autenticação/sistema, usar cliente anônimo pois podem ser chamados sem sessão
    const useAnonClient = table === 'logs_autenticacao' || table === 'logs_sistema';
    const client = useAnonClient ? supabaseAnon : requireAuthenticatedClient();
    
    const { error } = await client.from(table).insert(logData);
    if (error) {
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.debug(`[LogService] Erro ao inserir em ${table}:`, error.message);
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// =============================================
// SERVIÇO DE LOGS
// =============================================

export const logService = {
  // =============================================
  // LOGS DE USUÁRIOS
  // =============================================
  async logUsuario(data: Omit<LogUsuarioInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_usuarios', {
      ...data,
      usuario_id: data.usuario_id || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },


  // =============================================

  // =============================================
  // LOGS DE CONTATOS
  // =============================================
  async logContato(data: Omit<LogContatoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_contatos', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE CONFIGURAÇÕES
  // =============================================
  async logConfiguracao(data: Omit<LogConfiguracaoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_configuracoes', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE EMAIL
  // =============================================
  async logEmail(data: Omit<LogEmailInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_email', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE CHAT INTERNO
  // =============================================
  async logChatInterno(data: Omit<LogChatInternoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_chat_interno', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE MALOTES
  // =============================================
  async logMalote(data: Omit<LogMaloteInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_malotes', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE FLOW BUILDER
  // =============================================
  async logFlowBuilder(data: Omit<LogFlowBuilderInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_flow_builder', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE CONEXÕES
  // =============================================
  async logConexao(data: Omit<LogConexaoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_conexoes', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE CARGOS
  // =============================================
  async logCargo(data: Omit<LogCargoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_cargos', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE TAGS
  // =============================================
  async logTag(data: Omit<LogTagInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_tags', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE DOCUMENTOS
  // =============================================
  async logDocumento(data: Omit<LogDocumentoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_documentos', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE FILAS
  // =============================================
  async logFila(data: Omit<LogFilaInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_filas', {
      ...data,
      usuario_responsavel: data.usuario_responsavel || userId,
      dados_anteriores: sanitizeData(data.dados_anteriores),
      dados_novos: sanitizeData(data.dados_novos),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE AUTENTICAÇÃO
  // Especial: pode ser chamado sem sessão (login/logout)
  // =============================================
  async logAutenticacao(data: Omit<LogAutenticacaoInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_autenticacao', {
      ...data,
      detalhes: sanitizeData(data.detalhes),
      ...deviceInfo
    });
  },

  // =============================================
  // LOGS DE SISTEMA
  // Pode ser chamado sem sessão (erros globais)
  // =============================================
  async logSistema(data: Omit<LogSistemaInsert, 'ip_address' | 'user_agent'>): Promise<boolean> {
    const userId = await getUsuarioId();
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_sistema', {
      ...data,
      usuario_id: data.usuario_id || userId,
      dados: sanitizeData(data.dados),
      ...deviceInfo
    });
  },

  // =============================================
  // MÉTODOS UTILITÁRIOS
  // =============================================

  /**
   * Log rápido de erro de sistema
   */
  async logErro(
    mensagem: string,
    modulo?: string,
    erro?: Error,
    dados?: Record<string, unknown>
  ): Promise<boolean> {
    return this.logSistema({
      nivel: 'error',
      modulo,
      mensagem,
      stack_trace: erro?.stack,
      dados: {
        ...dados,
        errorName: erro?.name,
        errorMessage: erro?.message
      }
    });
  },

  /**
   * Log rápido de warning
   */
  async logWarning(
    mensagem: string,
    modulo?: string,
    dados?: Record<string, unknown>
  ): Promise<boolean> {
    return this.logSistema({
      nivel: 'warning',
      modulo,
      mensagem,
      dados
    });
  },

  /**
   * Log rápido de info
   */
  async logInfo(
    mensagem: string,
    modulo?: string,
    dados?: Record<string, unknown>
  ): Promise<boolean> {
    return this.logSistema({
      nivel: 'info',
      modulo,
      mensagem,
      dados
    });
  },

  /**
   * Log de ação genérica (usa logs_atividade existente)
   */
  async logAtividade(
    acao: string,
    modulo: string,
    detalhes?: Record<string, unknown>
  ): Promise<boolean> {
    const userId = await getUsuarioId();
    if (!userId) return false;
    
    const deviceInfo = await getDeviceInfo();
    return insertLogSilently('logs_atividade', {
      usuario_id: userId,
      acao,
      modulo,
      detalhes: sanitizeData(detalhes),
      ...deviceInfo
    });
  }
};

export default logService;
