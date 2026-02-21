/**
 * Tipos TypeScript para todas as tabelas de logs do sistema
 */

// Tipos base
export type TipoAcaoLog = 
  | 'criar' | 'editar' | 'excluir' | 'visualizar'
  | 'login' | 'logout' | 'erro' | 'importar' | 'exportar'
  | 'ativar' | 'desativar' | 'conectar' | 'desconectar'
  | 'enviar' | 'receber' | 'aprovar' | 'rejeitar';

export type NivelLog = 'info' | 'warning' | 'error' | 'critical';

// Interface base para logs
interface BaseLog {
  id: string;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE USUÁRIOS
// =============================================
export interface LogUsuario extends BaseLog {
  usuario_id?: string | null;
  usuario_afetado_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  detalhes?: string | null;
}

export interface LogUsuarioInsert {
  usuario_id?: string | null;
  usuario_afetado_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  detalhes?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================

// =============================================
// LOGS DE CONTATOS
// =============================================
export interface LogContato extends BaseLog {
  usuario_responsavel?: string | null;
  contato_id?: string | null;
  tipo_contato?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogContatoInsert {
  usuario_responsavel?: string | null;
  contato_id?: string | null;
  tipo_contato?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE CONFIGURAÇÕES
// =============================================
export interface LogConfiguracao extends BaseLog {
  usuario_responsavel?: string | null;
  modulo: string;
  config_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogConfiguracaoInsert {
  usuario_responsavel?: string | null;
  modulo: string;
  config_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE EMAIL
// =============================================
export interface LogEmail extends BaseLog {
  usuario_responsavel?: string | null;
  conta_email_id?: string | null;
  tipo_de_acao: string;
  destinatario?: string | null;
  assunto?: string | null;
  status?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  erro?: string | null;
}

export interface LogEmailInsert {
  usuario_responsavel?: string | null;
  conta_email_id?: string | null;
  tipo_de_acao: string;
  destinatario?: string | null;
  assunto?: string | null;
  status?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  erro?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE CHAT INTERNO
// =============================================
export interface LogChatInterno extends BaseLog {
  usuario_responsavel?: string | null;
  chat_id?: number | null;
  mensagem_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogChatInternoInsert {
  usuario_responsavel?: string | null;
  chat_id?: number | null;
  mensagem_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE MALOTES
// =============================================
export interface LogMalote extends BaseLog {
  usuario_responsavel?: string | null;
  malote_id?: string | null;
  viagem_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogMaloteInsert {
  usuario_responsavel?: string | null;
  malote_id?: string | null;
  viagem_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE FLOW BUILDER
// =============================================
export interface LogFlowBuilder extends BaseLog {
  usuario_responsavel?: string | null;
  flow_id?: string | null;
  session_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogFlowBuilderInsert {
  usuario_responsavel?: string | null;
  flow_id?: string | null;
  session_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE CONEXÕES
// =============================================
export interface LogConexao extends BaseLog {
  usuario_responsavel?: string | null;
  conexao_id?: string | null;
  tipo_conexao?: string | null;
  tipo_de_acao: string;
  status?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  erro?: string | null;
}

export interface LogConexaoInsert {
  usuario_responsavel?: string | null;
  conexao_id?: string | null;
  tipo_conexao?: string | null;
  tipo_de_acao: string;
  status?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  erro?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE CARGOS
// =============================================
export interface LogCargo extends BaseLog {
  usuario_responsavel?: string | null;
  cargo_id?: string | null;
  departamento_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogCargoInsert {
  usuario_responsavel?: string | null;
  cargo_id?: string | null;
  departamento_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE TAGS
// =============================================
export interface LogTag extends BaseLog {
  usuario_responsavel?: string | null;
  tag_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogTagInsert {
  usuario_responsavel?: string | null;
  tag_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE DOCUMENTOS
// =============================================
export interface LogDocumento extends BaseLog {
  usuario_responsavel?: string | null;
  documento_id?: string | null;
  solicitacao_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogDocumentoInsert {
  usuario_responsavel?: string | null;
  documento_id?: string | null;
  solicitacao_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE FILAS WHATSAPP
// =============================================
export interface LogFila extends BaseLog {
  usuario_responsavel?: string | null;
  fila_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export interface LogFilaInsert {
  usuario_responsavel?: string | null;
  fila_id?: string | null;
  tipo_de_acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE AUTENTICAÇÃO
// =============================================
export interface LogAutenticacao extends BaseLog {
  usuario_id?: string | null;
  tipo_de_acao: string;
  sucesso?: boolean;
  detalhes?: Record<string, unknown> | null;
  erro?: string | null;
}

export interface LogAutenticacaoInsert {
  usuario_id?: string | null;
  tipo_de_acao: string;
  sucesso?: boolean;
  detalhes?: Record<string, unknown> | null;
  erro?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// LOGS DE SISTEMA
// =============================================
export interface LogSistema extends BaseLog {
  nivel: NivelLog;
  modulo?: string | null;
  mensagem: string;
  stack_trace?: string | null;
  dados?: Record<string, unknown> | null;
  usuario_id?: string | null;
}

export interface LogSistemaInsert {
  nivel: NivelLog;
  modulo?: string | null;
  mensagem: string;
  stack_trace?: string | null;
  dados?: Record<string, unknown> | null;
  usuario_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

// =============================================
// TIPOS UTILITÁRIOS
// =============================================

// Mapeamento de nomes de tabelas
export type LogTableName =
  | 'logs_usuarios'
  | 'logs_permissoes'
  | 'logs_contatos'
  | 'logs_configuracoes'
  | 'logs_email'
  | 'logs_chat_interno'
  | 'logs_malotes'
  | 'logs_flow_builder'
  | 'logs_conexoes'
  | 'logs_cargos'
  | 'logs_tags'
  | 'logs_documentos'
  | 'logs_filas'
  | 'logs_autenticacao'
  | 'logs_sistema'
  | 'logs_atividade'
  | 'logs_mensagens_rapidas'
  | 'logs_ocorrencia'
  | 'logs_whatsapp';

// Configuração para exibição de logs
export interface LogTableConfig {
  tableName: LogTableName;
  title: string;
  description: string;
  icon: string;
  columns: LogColumnConfig[];
}

export interface LogColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'json' | 'badge' | 'user';
}

// Filtros de logs
export interface LogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  tipoAcao?: string;
  nivel?: NivelLog;
  searchTerm?: string;
}
