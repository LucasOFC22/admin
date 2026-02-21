import { useCallback, useRef } from 'react';
import { logsWhatsAppService, CreateLogParams } from '@/services/whatsapp/logsWhatsAppService';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';

/**
 * Hook para registrar logs de atividades do WhatsApp
 * Implementa debounce automático para prevenir logs duplicados
 */
export const useWhatsAppLogging = () => {
  const lastLogTime = useRef<{ [key: string]: number }>({});
  const DEBOUNCE_MS = 2000; // 2 segundos entre logs da mesma ação

  const registrarLog = useCallback(async (params: CreateLogParams): Promise<void> => {
    // Criar chave única para esta ação
    const logKey = `${params.acao}-${params.chat_id}-${params.contato_id}`;
    const now = Date.now();
    
    // Verificar se já foi logado recentemente
    if (lastLogTime.current[logKey] && (now - lastLogTime.current[logKey]) < DEBOUNCE_MS) {
      if (isWhatsAppDebugEnabled()) {
        console.debug(`[WhatsApp Logging] Ação "${params.acao}" ignorada (debounce)`);
      }
      return;
    }

    // Atualizar timestamp
    lastLogTime.current[logKey] = now;

    // Limpar timestamps antigos (mais de 10 segundos)
    Object.keys(lastLogTime.current).forEach(key => {
      if (now - lastLogTime.current[key] > 10000) {
        delete lastLogTime.current[key];
      }
    });

    // Registrar log
    await logsWhatsAppService.registrarLog(params);
  }, []);

  // Funções helper para ações específicas
  const logMensagemEnviada = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
    mensagem_preview?: string;
    is_private?: boolean;
  }) => {
    return registrarLog({
      acao: 'mensagem_enviada',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone,
        mensagem_preview: params.mensagem_preview?.substring(0, 100),
        is_private: params.is_private
      }
    });
  }, [registrarLog]);

  const logTicketAceito = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
    fila_id?: string;
    fila_nome?: string;
  }) => {
    return registrarLog({
      acao: 'ticket_aceito',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone,
        fila_id: params.fila_id,
        fila_nome: params.fila_nome
      }
    });
  }, [registrarLog]);

  const logTicketIgnorado = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
  }) => {
    return registrarLog({
      acao: 'ticket_ignorado',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone
      }
    });
  }, [registrarLog]);

  const logTicketTransferido = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
    fila_origem?: string;
    fila_destino?: string;
    usuario_destino?: string;
    usuario_destino_nome?: string;
  }) => {
    return registrarLog({
      acao: 'ticket_transferido',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone,
        fila_origem: params.fila_origem,
        fila_destino: params.fila_destino,
        usuario_destino: params.usuario_destino,
        usuario_destino_nome: params.usuario_destino_nome
      }
    });
  }, [registrarLog]);

  const logTicketReaberto = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
  }) => {
    return registrarLog({
      acao: 'ticket_reaberto',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone
      }
    });
  }, [registrarLog]);

  const logTicketFinalizado = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    contato_telefone?: string;
  }) => {
    return registrarLog({
      acao: 'ticket_finalizado',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        contato_telefone: params.contato_telefone
      }
    });
  }, [registrarLog]);

  const logTransferenciaAceita = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    admin_anterior?: string;
  }) => {
    return registrarLog({
      acao: 'transferencia_aceita',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        admin_anterior: params.admin_anterior
      }
    });
  }, [registrarLog]);

  const logTransferenciaRecusada = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
  }) => {
    return registrarLog({
      acao: 'transferencia_recusada',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome
      }
    });
  }, [registrarLog]);

  const logTagsAtualizadas = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    tags_antigas?: number[];
    tags_novas?: number[];
  }) => {
    return registrarLog({
      acao: 'tags_atualizadas',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        tags_antigas: params.tags_antigas,
        tags_novas: params.tags_novas
      }
    });
  }, [registrarLog]);

  const logCardMovido = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    fila_origem?: string;
    fila_origem_nome?: string;
    fila_destino?: string;
    fila_destino_nome?: string;
  }) => {
    return registrarLog({
      acao: 'card_movido',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        fila_origem: params.fila_origem,
        fila_origem_nome: params.fila_origem_nome,
        fila_destino: params.fila_destino,
        fila_destino_nome: params.fila_destino_nome
      }
    });
  }, [registrarLog]);

  const logConversaExportada = useCallback((params: {
    contato_id?: string;
    chat_id?: number;
    contato_nome?: string;
    formato?: string;
    quantidade_mensagens?: number;
  }) => {
    return registrarLog({
      acao: 'conversa_exportada',
      contato_id: params.contato_id,
      chat_id: params.chat_id,
      detalhes: {
        contato_nome: params.contato_nome,
        formato: params.formato,
        quantidade_mensagens: params.quantidade_mensagens
      }
    });
  }, [registrarLog]);

  const logTicketsFechadosEmMassa = useCallback((params: {
    quantidade: number;
    ticket_ids?: string[];
  }) => {
    return registrarLog({
      acao: 'tickets_fechados_em_massa',
      detalhes: {
        quantidade: params.quantidade,
        ticket_ids: params.ticket_ids
      }
    });
  }, [registrarLog]);

  return {
    registrarLog,
    logMensagemEnviada,
    logTicketAceito,
    logTicketIgnorado,
    logTicketTransferido,
    logTicketReaberto,
    logTicketFinalizado,
    logTransferenciaAceita,
    logTransferenciaRecusada,
    logTagsAtualizadas,
    logCardMovido,
    logConversaExportada,
    logTicketsFechadosEmMassa
  };
};
