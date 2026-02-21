/**
 * Serviço Unificado de Logging
 * Centraliza todos os logs do sistema e roteia para a tabela correta
 */

import { getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { getUserIP } from '@/utils/deviceInfo';

// Helper para obter cliente - usa getAuthenticatedSupabaseClient que retorna null se não autenticado
const getSupabaseClient = () => {
  const client = getAuthenticatedSupabaseClient();
  if (!client) throw new Error('Cliente não autenticado');
  return client;
};

// Tipos de log suportados
export type LogType = 
  | 'atividade'      // logs_atividade
  | 'mensagem_rapida' // logs_mensagens_rapidas
  | 'ocorrencia'      // logs_ocorrencia
  | 'whatsapp'        // logs_whatsapp
  | 'erro';           // erros

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type LogCategory = 
  | 'auth' | 'navigation' | 'api' | 'database'
  | 'form' | 'file' | 'error' | 'security'
  | 'performance' | 'business' | 'whatsapp'
  | 'coletas' | 'cotacoes' | 'clientes' | 'configuracoes'
  | 'usuarios' | 'cargos' | 'permissoes' | 'tickets'
  | 'ocorrencias' | 'mensagens' | 'manifestos' | 'nfe';

// Dados sensíveis que nunca devem ser logados
const SENSITIVE_KEYS = [
  'password', 'senha', 'token', 'secret', 'key', 'apikey', 
  'api_key', 'authorization', 'cookie', 'session', 'csrf',
  'ssn', 'cpf', 'cnpj', 'credit_card', 'cvv', 'pin'
];

export interface UnifiedLogData {
  tipo: LogType;
  categoria: LogCategory;
  nivel: LogLevel;
  acao: string;
  modulo: string;
  mensagem: string;
  usuario_id?: string | number | null;
  detalhes?: Record<string, any>;
  dados_anteriores?: Record<string, any>;
  dados_novos?: Record<string, any>;
  referencia_id?: string | number;
  duracao_ms?: number;
}

interface LogMetadata {
  ip_address: string;
  user_agent: string;
  pagina: string;
  timestamp: string;
  session_id?: string;
}

class UnifiedLogService {
  private static instance: UnifiedLogService;
  private isDevelopment = import.meta.env.DEV;
  private fallbackQueue: UnifiedLogData[] = [];
  private isProcessingQueue = false;

  private constructor() {
    // Processar fila de fallback periodicamente
    setInterval(() => this.processFallbackQueue(), 30000);
  }

  static getInstance(): UnifiedLogService {
    if (!UnifiedLogService.instance) {
      UnifiedLogService.instance = new UnifiedLogService();
    }
    return UnifiedLogService.instance;
  }

  /**
   * Sanitiza dados removendo informações sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in sanitized) {
      const isSensitive = SENSITIVE_KEYS.some(sensitive => 
        key.toLowerCase().includes(sensitive)
      );
      
      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      } else if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '... [truncated]';
      }
    }
    
    return sanitized;
  }

  /**
   * Obtém metadados do contexto atual
   */
  private async getMetadata(): Promise<LogMetadata> {
    return {
      ip_address: await getUserIP(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      pagina: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      timestamp: new Date().toISOString(),
      session_id: typeof sessionStorage !== 'undefined' 
        ? sessionStorage.getItem('session_id') || undefined 
        : undefined
    };
  }

  /**
   * Roteia log para a tabela correta baseado no tipo
   */
  private async routeLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      switch (logData.tipo) {
        case 'atividade':
          return await this.insertAtividadeLog(logData, metadata);
        case 'mensagem_rapida':
          return await this.insertMensagemRapidaLog(logData, metadata);
        case 'ocorrencia':
          return await this.insertOcorrenciaLog(logData, metadata);
        case 'whatsapp':
          return await this.insertWhatsappLog(logData, metadata);
        case 'erro':
        default:
          return await this.insertErroLog(logData, metadata);
      }
    } catch (error) {
      console.error('Erro ao inserir log:', error);
      return false;
    }
  }

  /**
   * Insere log na tabela logs_atividade
   */
  private async insertAtividadeLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('logs_atividade').insert({
        usuario_id: logData.usuario_id,
        acao: logData.acao,
        modulo: logData.modulo,
        tipo: logData.categoria,
        detalhes: JSON.stringify(this.sanitizeData({
          mensagem: logData.mensagem,
          nivel: logData.nivel,
          duracao_ms: logData.duracao_ms,
          ...logData.detalhes
        })),
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent,
        created_at: metadata.timestamp
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Insere log na tabela logs_mensagens_rapidas
   */
  private async insertMensagemRapidaLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('logs_mensagens_rapidas').insert({
        mensagem_id: logData.referencia_id,
        usuario_responsavel: logData.usuario_id,
        tipo_de_acao: logData.acao,
        dados_anteriores: this.sanitizeData(logData.dados_anteriores) || {},
        dados_novos: this.sanitizeData(logData.dados_novos) || {},
        timestamp: metadata.timestamp
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Insere log na tabela logs_ocorrencia
   */
  private async insertOcorrenciaLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('logs_ocorrencia').insert({
        ocorrencia_id: logData.referencia_id,
        usuario_responsavel: logData.usuario_id,
        tipo_de_acao: logData.acao,
        dados_anteriores: this.sanitizeData(logData.dados_anteriores) || {},
        dados_novos: this.sanitizeData(logData.dados_novos) || {},
        created_at: metadata.timestamp
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Insere log na tabela logs_whatsapp
   */
  private async insertWhatsappLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('logs_whatsapp').insert({
        usuario_id: logData.usuario_id,
        contato_id: logData.detalhes?.contato_id,
        chat_id: logData.detalhes?.chat_id,
        acao: logData.acao,
        detalhes: this.sanitizeData(logData.detalhes) || {},
        ip_address: metadata.ip_address,
        user_agent: metadata.user_agent,
        created_at: metadata.timestamp
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Insere log na tabela erros
   */
  private async insertErroLog(logData: UnifiedLogData, metadata: LogMetadata): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('erros').insert({
        titulo: `[${logData.categoria}] ${logData.modulo}.${logData.acao}`,
        descricao: logData.mensagem,
        categoria: logData.categoria,
        pagina: metadata.pagina,
        nivel: logData.nivel,
        tipo: logData.tipo,
        data_ocorrencia: metadata.timestamp,
        dados_extra: this.sanitizeData({
          ...logData.detalhes,
          duracao_ms: logData.duracao_ms,
          usuario_id: logData.usuario_id,
          ip_address: metadata.ip_address,
          user_agent: metadata.user_agent,
          session_id: metadata.session_id
        }),
        resolvido: false,
        criado_em: metadata.timestamp
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Adiciona log à fila de fallback (localStorage)
   */
  private addToFallbackQueue(logData: UnifiedLogData): void {
    this.fallbackQueue.push(logData);
    
    // Limitar tamanho da fila
    if (this.fallbackQueue.length > 100) {
      this.fallbackQueue.shift();
    }

    // Persistir no localStorage
    try {
      localStorage.setItem('log_fallback_queue', JSON.stringify(this.fallbackQueue));
    } catch {
      // Ignorar erros de localStorage
    }
  }

  /**
   * Processa fila de fallback
   */
  private async processFallbackQueue(): Promise<void> {
    if (this.isProcessingQueue || this.fallbackQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      const queue = [...this.fallbackQueue];
      this.fallbackQueue = [];
      
      for (const logData of queue) {
        const metadata = await this.getMetadata();
        const success = await this.routeLog(logData, metadata);
        
        if (!success) {
          this.addToFallbackQueue(logData);
        }
      }
      
      localStorage.removeItem('log_fallback_queue');
    } catch {
      // Ignorar erros
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Método principal de logging
   */
  async log(data: UnifiedLogData): Promise<void> {
    const metadata = await this.getMetadata();
    
    // Log no console em desenvolvimento
    if (this.isDevelopment) {
      const consoleMethod = data.nivel === 'error' || data.nivel === 'critical' ? 'error' : 
                           data.nivel === 'warning' ? 'warn' : 'log';
      console[consoleMethod](
        `[${data.nivel.toUpperCase()}] [${data.categoria}] ${data.modulo}.${data.acao}: ${data.mensagem}`,
        this.sanitizeData(data.detalhes)
      );
    }

    // Tentar inserir no banco
    const success = await this.routeLog(data, metadata);
    
    // Se falhou, adicionar à fila de fallback
    if (!success) {
      this.addToFallbackQueue(data);
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  /**
   * Log de atividade do usuário
   */
  async logAtividade(
    usuario_id: string | number | null,
    acao: string,
    modulo: string,
    detalhes?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tipo: 'atividade',
      categoria: 'business',
      nivel: 'info',
      acao,
      modulo,
      mensagem: `Usuário executou: ${acao}`,
      usuario_id,
      detalhes
    });
  }

  /**
   * Log de erro
   */
  async logErro(
    modulo: string,
    acao: string,
    error: Error | string,
    detalhes?: Record<string, any>
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.log({
      tipo: 'erro',
      categoria: 'error',
      nivel: 'error',
      acao,
      modulo,
      mensagem: errorMessage,
      detalhes: {
        ...detalhes,
        stack: errorStack,
        name: error instanceof Error ? error.name : 'Error'
      }
    });
  }

  /**
   * Log de API
   */
  async logApi(
    modulo: string,
    method: string,
    endpoint: string,
    status: number,
    duracao_ms: number,
    detalhes?: Record<string, any>
  ): Promise<void> {
    // Não logar requisições bem-sucedidas (2xx) na tabela de erros
    if (status >= 200 && status < 300) return;

    const nivel = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';
    
    await this.log({
      tipo: 'erro',
      categoria: 'api',
      nivel,
      acao: `${method} ${endpoint}`,
      modulo,
      mensagem: `API ${method} ${endpoint} - Status: ${status}`,
      duracao_ms,
      detalhes: {
        ...detalhes,
        status,
        method,
        endpoint
      }
    });
  }

  /**
   * Log de navegação
   */
  async logNavegacao(
    from: string,
    to: string,
    usuario_id?: string | number
  ): Promise<void> {
    await this.log({
      tipo: 'atividade',
      categoria: 'navigation',
      nivel: 'debug',
      acao: 'navegacao',
      modulo: 'Router',
      mensagem: `Navegação: ${from} → ${to}`,
      usuario_id,
      detalhes: { from, to }
    });
  }

  /**
   * Log de performance
   */
  async logPerformance(
    modulo: string,
    operacao: string,
    duracao_ms: number,
    detalhes?: Record<string, any>
  ): Promise<void> {
    const nivel = duracao_ms > 3000 ? 'warning' : duracao_ms > 1000 ? 'info' : 'debug';
    
    await this.log({
      tipo: 'erro',
      categoria: 'performance',
      nivel,
      acao: operacao,
      modulo,
      mensagem: `Operação ${operacao} concluída em ${duracao_ms}ms`,
      duracao_ms,
      detalhes
    });
  }

  /**
   * Log de segurança
   */
  async logSeguranca(
    tipo: 'login' | 'logout' | 'acesso_negado' | 'tentativa_invasao' | 'alteracao_permissao',
    usuario_id: string | number | null,
    detalhes?: Record<string, any>
  ): Promise<void> {
    const nivel = tipo === 'tentativa_invasao' ? 'critical' : 
                  tipo === 'acesso_negado' ? 'warning' : 'info';
    
    await this.log({
      tipo: 'atividade',
      categoria: 'security',
      nivel,
      acao: tipo,
      modulo: 'Security',
      mensagem: `Evento de segurança: ${tipo}`,
      usuario_id,
      detalhes
    });
  }

  /**
   * Log de WhatsApp
   */
  async logWhatsApp(
    usuario_id: string,
    acao: string,
    contato_id?: string,
    chat_id?: number,
    detalhes?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tipo: 'whatsapp',
      categoria: 'whatsapp',
      nivel: 'info',
      acao,
      modulo: 'WhatsApp',
      mensagem: `WhatsApp: ${acao}`,
      usuario_id,
      detalhes: {
        ...detalhes,
        contato_id,
        chat_id
      }
    });
  }

  /**
   * Log de ocorrência
   */
  async logOcorrencia(
    ocorrencia_id: string,
    usuario_id: number,
    tipo_acao: string,
    dados_anteriores?: Record<string, any>,
    dados_novos?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tipo: 'ocorrencia',
      categoria: 'ocorrencias',
      nivel: 'info',
      acao: tipo_acao,
      modulo: 'Ocorrencias',
      mensagem: `Ocorrência ${ocorrencia_id}: ${tipo_acao}`,
      usuario_id,
      referencia_id: ocorrencia_id,
      dados_anteriores,
      dados_novos
    });
  }

  /**
   * Log de mensagem rápida
   */
  async logMensagemRapida(
    mensagem_id: number,
    usuario_id: number,
    tipo_acao: string,
    dados_anteriores?: Record<string, any>,
    dados_novos?: Record<string, any>
  ): Promise<void> {
    await this.log({
      tipo: 'mensagem_rapida',
      categoria: 'mensagens',
      nivel: 'info',
      acao: tipo_acao,
      modulo: 'MensagensRapidas',
      mensagem: `Mensagem ${mensagem_id}: ${tipo_acao}`,
      usuario_id,
      referencia_id: mensagem_id,
      dados_anteriores,
      dados_novos
    });
  }

  /**
   * Wrapper para medir performance
   */
  async measurePerformance<T>(
    modulo: string,
    operacao: string,
    operation: () => Promise<T>,
    logResult = false
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duracao = Math.round(performance.now() - startTime);
      
      await this.logPerformance(modulo, operacao, duracao, logResult ? { result } : undefined);
      
      return result;
    } catch (error) {
      const duracao = Math.round(performance.now() - startTime);
      await this.logErro(modulo, operacao, error as Error, { duracao_ms: duracao });
      throw error;
    }
  }
}

export const unifiedLogService = UnifiedLogService.getInstance();
