/**
 * Loggers expandidos para todos os módulos do sistema
 */

import { unifiedLogService } from './unifiedLogService';

// ============ COLETAS ============
export const coletasLogger = {
  logCreate: (data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'coleta_criada', 'Coletas', data),

  logUpdate: (id: string, data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'coleta_atualizada', 'Coletas', { id, ...data }),

  logDelete: (id: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'coleta_excluida', 'Coletas', { id }),

  logStatusChange: (id: string, from: string, to: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'status_coleta_alterado', 'Coletas', { id, from, to }),

  logList: (count: number, filtros?: any) =>
    unifiedLogService.log({
      tipo: 'erro',
      categoria: 'coletas',
      nivel: 'debug',
      acao: 'listar_coletas',
      modulo: 'Coletas',
      mensagem: `${count} coletas listadas`,
      detalhes: { count, filtros }
    }),

  logRoteirizacao: (coletas: string[], motorista: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'roteirizacao', 'Coletas', { coletas, motorista })
};

// ============ CLIENTES ============
export const clientesLogger = {
  logCreate: (data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'cliente_criado', 'Clientes', data),

  logUpdate: (id: string, data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'cliente_atualizado', 'Clientes', { id, ...data }),

  logDelete: (id: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'cliente_excluido', 'Clientes', { id }),

  logAcessoAtualizado: (clienteId: string, status: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'acesso_cliente_atualizado', 'Clientes', { clienteId, status }),

  logAcessoSuspenso: (clienteId: string, motivo: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'acesso_cliente_suspenso', 'Clientes', { clienteId, motivo }),

  logAcessoReativado: (clienteId: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'acesso_cliente_reativado', 'Clientes', { clienteId }),

  logList: (count: number, filtros?: any) =>
    unifiedLogService.log({
      tipo: 'erro',
      categoria: 'clientes',
      nivel: 'debug',
      acao: 'listar_clientes',
      modulo: 'Clientes',
      mensagem: `${count} clientes listados`,
      detalhes: { count, filtros }
    })
};

// ============ CONFIGURAÇÕES ============
export const configuracoesLogger = {
  logAlteracao: (chave: string, valorAnterior: any, valorNovo: any, userId?: string | number) =>
    unifiedLogService.log({
      tipo: 'atividade',
      categoria: 'configuracoes',
      nivel: 'info',
      acao: 'configuracao_alterada',
      modulo: 'Configuracoes',
      mensagem: `Configuração ${chave} alterada`,
      usuario_id: userId,
      dados_anteriores: { [chave]: valorAnterior },
      dados_novos: { [chave]: valorNovo }
    }),

  logBackup: (tipo: string, tamanho?: number, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'backup_criado', 'Configuracoes', { tipo, tamanho }),

  logRestore: (backupId: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'backup_restaurado', 'Configuracoes', { backupId }),

  logIntegracao: (integracao: string, acao: string, sucesso: boolean, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, `integracao_${acao}`, 'Configuracoes', { integracao, sucesso })
};

// ============ TICKETS ============
export const ticketsLogger = {
  logCreate: (data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'ticket_criado', 'Tickets', data),

  logUpdate: (id: string, data: any, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'ticket_atualizado', 'Tickets', { id, ...data }),

  logStatusChange: (id: string, from: string, to: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'status_ticket_alterado', 'Tickets', { id, from, to }),

  logResposta: (ticketId: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'resposta_ticket', 'Tickets', { ticketId }),

  logFechamento: (id: string, motivo?: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'ticket_fechado', 'Tickets', { id, motivo }),

  logList: (count: number, filtros?: any) =>
    unifiedLogService.log({
      tipo: 'erro',
      categoria: 'tickets',
      nivel: 'debug',
      acao: 'listar_tickets',
      modulo: 'Tickets',
      mensagem: `${count} tickets listados`,
      detalhes: { count, filtros }
    })
};

// ============ DOCUMENTOS ============
export const documentosLogger = {
  logUpload: (arquivo: string, tamanho: number, tipo: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'documento_upload', 'Documentos', { arquivo, tamanho, tipo }),

  logDownload: (id: string, arquivo: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'documento_download', 'Documentos', { id, arquivo }),

  logDelete: (id: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'documento_excluido', 'Documentos', { id }),

  logCompartilhamento: (id: string, destinatarios: string[], userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'documento_compartilhado', 'Documentos', { id, destinatarios })
};

// ============ PERMISSÕES ============
export const permissoesLogger = {
  logAlteracao: (cargoId: string, permissao: string, valor: boolean, userId?: string | number) =>
    unifiedLogService.log({
      tipo: 'atividade',
      categoria: 'permissoes',
      nivel: 'info',
      acao: 'permissao_alterada',
      modulo: 'Permissoes',
      mensagem: `Permissão ${permissao} ${valor ? 'concedida' : 'removida'} do cargo ${cargoId}`,
      usuario_id: userId,
      detalhes: { cargoId, permissao, valor }
    }),

  logCargoAtribuido: (userId: string | number, cargoId: string, adminId?: string | number) =>
    unifiedLogService.logAtividade(adminId ?? null, 'cargo_atribuido', 'Permissoes', { userId, cargoId }),

  logCargoRemovido: (userId: string | number, cargoId: string, adminId?: string | number) =>
    unifiedLogService.logAtividade(adminId ?? null, 'cargo_removido', 'Permissoes', { userId, cargoId })
};

// ============ FORMULÁRIOS ============
export const formulariosLogger = {
  logSubmit: (formId: string, sucesso: boolean, campos?: Record<string, any>, userId?: string | number) =>
    unifiedLogService.log({
      tipo: 'atividade',
      categoria: 'form',
      nivel: sucesso ? 'info' : 'warning',
      acao: sucesso ? 'form_submit_sucesso' : 'form_submit_erro',
      modulo: 'Forms',
      mensagem: `Formulário ${formId} ${sucesso ? 'enviado' : 'falhou'}`,
      usuario_id: userId,
      detalhes: { formId, campos }
    }),

  logValidacao: (formId: string, erros: string[], userId?: string | number) =>
    unifiedLogService.log({
      tipo: 'erro',
      categoria: 'form',
      nivel: 'warning',
      acao: 'form_validacao_erro',
      modulo: 'Forms',
      mensagem: `Erros de validação no formulário ${formId}`,
      usuario_id: userId,
      detalhes: { formId, erros }
    })
};

// ============ ARQUIVOS ============
export const arquivosLogger = {
  logUpload: (arquivo: string, tamanho: number, bucket: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'arquivo_upload', 'Storage', { arquivo, tamanho, bucket }),

  logDownload: (arquivo: string, bucket: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'arquivo_download', 'Storage', { arquivo, bucket }),

  logDelete: (arquivo: string, bucket: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'arquivo_excluido', 'Storage', { arquivo, bucket }),

  logErroUpload: (arquivo: string, erro: string, userId?: string | number) =>
    unifiedLogService.logErro('Storage', 'upload_falhou', erro, { arquivo, usuario_id: userId })
};

// ============ RELATÓRIOS ============
export const relatoriosLogger = {
  logGeracao: (tipo: string, parametros: any, duracao: number, userId?: string | number) =>
    unifiedLogService.log({
      tipo: 'atividade',
      categoria: 'business',
      nivel: 'info',
      acao: 'relatorio_gerado',
      modulo: 'Relatorios',
      mensagem: `Relatório ${tipo} gerado em ${duracao}ms`,
      usuario_id: userId,
      duracao_ms: duracao,
      detalhes: { tipo, parametros }
    }),

  logExportacao: (tipo: string, formato: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'relatorio_exportado', 'Relatorios', { tipo, formato }),

  logErro: (tipo: string, erro: string, userId?: string | number) =>
    unifiedLogService.logErro('Relatorios', 'geracao_falhou', erro, { tipo, usuario_id: userId })
};

// ============ NOTIFICAÇÕES ============
export const notificacoesLogger = {
  logEnvio: (tipo: string, destinatario: string, canal: 'email' | 'sms' | 'push' | 'whatsapp', sucesso: boolean) =>
    unifiedLogService.log({
      tipo: 'erro',
      categoria: 'business',
      nivel: sucesso ? 'info' : 'error',
      acao: 'notificacao_enviada',
      modulo: 'Notificacoes',
      mensagem: `Notificação ${tipo} ${sucesso ? 'enviada' : 'falhou'} via ${canal}`,
      detalhes: { tipo, destinatario, canal, sucesso }
    }),

  logLeitura: (notificacaoId: string, userId?: string | number) =>
    unifiedLogService.logAtividade(userId ?? null, 'notificacao_lida', 'Notificacoes', { notificacaoId })
};
