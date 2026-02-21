/**
 * Hook centralizado para logging de todas as operações do sistema
 * Cada módulo tem métodos específicos com tipagem adequada
 */

import { useCallback, useRef } from 'react';
import { logService } from '@/services/logger/logService';
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
  LogSistemaInsert
} from '@/types/allLogs';

const DEBOUNCE_MS = 1000;

/**
 * Hook universal de logging com debounce automático
 */
export const useLogging = () => {
  const lastLogTime = useRef<Record<string, number>>({});

  const shouldLog = useCallback((key: string): boolean => {
    const now = Date.now();
    if (lastLogTime.current[key] && (now - lastLogTime.current[key]) < DEBOUNCE_MS) {
      return false;
    }
    lastLogTime.current[key] = now;
    
    // Limpar timestamps antigos
    Object.keys(lastLogTime.current).forEach(k => {
      if (now - lastLogTime.current[k] > 10000) {
        delete lastLogTime.current[k];
      }
    });
    
    return true;
  }, []);

  // Logs de Usuários
  const logUsuario = useCallback(async (data: Omit<LogUsuarioInsert, 'ip_address' | 'user_agent'>) => {
    const key = `usuario-${data.tipo_de_acao}-${data.usuario_afetado_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logUsuario(data);
  }, [shouldLog]);


  // Logs de Contatos
  const logContato = useCallback(async (data: Omit<LogContatoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `contato-${data.tipo_de_acao}-${data.contato_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logContato(data);
  }, [shouldLog]);

  // Logs de Configurações
  const logConfiguracao = useCallback(async (data: Omit<LogConfiguracaoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `config-${data.tipo_de_acao}-${data.modulo}`;
    if (!shouldLog(key)) return;
    await logService.logConfiguracao(data);
  }, [shouldLog]);

  // Logs de Email
  const logEmail = useCallback(async (data: Omit<LogEmailInsert, 'ip_address' | 'user_agent'>) => {
    const key = `email-${data.tipo_de_acao}-${data.destinatario || 'bulk'}`;
    if (!shouldLog(key)) return;
    await logService.logEmail(data);
  }, [shouldLog]);

  // Logs de Chat Interno
  const logChatInterno = useCallback(async (data: Omit<LogChatInternoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `chat-${data.tipo_de_acao}-${data.chat_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logChatInterno(data);
  }, [shouldLog]);

  // Logs de Malotes
  const logMalote = useCallback(async (data: Omit<LogMaloteInsert, 'ip_address' | 'user_agent'>) => {
    const key = `malote-${data.tipo_de_acao}-${data.malote_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logMalote(data);
  }, [shouldLog]);

  // Logs de Flow Builder
  const logFlowBuilder = useCallback(async (data: Omit<LogFlowBuilderInsert, 'ip_address' | 'user_agent'>) => {
    const key = `flow-${data.tipo_de_acao}-${data.flow_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logFlowBuilder(data);
  }, [shouldLog]);

  // Logs de Conexões
  const logConexao = useCallback(async (data: Omit<LogConexaoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `conexao-${data.tipo_de_acao}-${data.conexao_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logConexao(data);
  }, [shouldLog]);

  // Logs de Cargos
  const logCargo = useCallback(async (data: Omit<LogCargoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `cargo-${data.tipo_de_acao}-${data.cargo_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logCargo(data);
  }, [shouldLog]);

  // Logs de Tags
  const logTag = useCallback(async (data: Omit<LogTagInsert, 'ip_address' | 'user_agent'>) => {
    const key = `tag-${data.tipo_de_acao}-${data.tag_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logTag(data);
  }, [shouldLog]);

  // Logs de Documentos
  const logDocumento = useCallback(async (data: Omit<LogDocumentoInsert, 'ip_address' | 'user_agent'>) => {
    const key = `doc-${data.tipo_de_acao}-${data.documento_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logDocumento(data);
  }, [shouldLog]);

  // Logs de Filas
  const logFila = useCallback(async (data: Omit<LogFilaInsert, 'ip_address' | 'user_agent'>) => {
    const key = `fila-${data.tipo_de_acao}-${data.fila_id || 'new'}`;
    if (!shouldLog(key)) return;
    await logService.logFila(data);
  }, [shouldLog]);

  // Logs de Autenticação (sem debounce - importante registrar todos)
  const logAutenticacao = useCallback(async (data: Omit<LogAutenticacaoInsert, 'ip_address' | 'user_agent'>) => {
    await logService.logAutenticacao(data);
  }, []);

  // Logs de Sistema (sem debounce - erros são importantes)
  const logSistema = useCallback(async (data: Omit<LogSistemaInsert, 'ip_address' | 'user_agent'>) => {
    await logService.logSistema(data);
  }, []);

  // Helpers rápidos
  const logErro = useCallback(async (mensagem: string, modulo?: string, erro?: Error) => {
    await logService.logErro(mensagem, modulo, erro);
  }, []);

  const logInfo = useCallback(async (mensagem: string, modulo?: string, dados?: Record<string, unknown>) => {
    await logService.logInfo(mensagem, modulo, dados);
  }, []);

  const logWarning = useCallback(async (mensagem: string, modulo?: string, dados?: Record<string, unknown>) => {
    await logService.logWarning(mensagem, modulo, dados);
  }, []);

  return {
    // Logs específicos por módulo
    logUsuario,
    logContato,
    logConfiguracao,
    logEmail,
    logChatInterno,
    logMalote,
    logFlowBuilder,
    logConexao,
    logCargo,
    logTag,
    logDocumento,
    logFila,
    logAutenticacao,
    logSistema,
    // Helpers
    logErro,
    logInfo,
    logWarning
  };
};

export default useLogging;
