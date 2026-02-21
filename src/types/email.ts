// Tipos para o sistema de email

export interface EmailConta {
  id: string;
  nome: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_ssl: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_ssl: boolean;
  senha_criptografada?: string; // Nunca retornado ao frontend
  ativo: boolean;
  verificado: boolean;
  ultima_sincronizacao?: string;
  created_at: string;
  updated_at: string;
  // CardDAV/CalDAV
  carddav_url?: string;
  carddav_usuario?: string;
  carddav_senha_criptografada?: string;
  caldav_url?: string;
  caldav_usuario?: string;
  caldav_senha_criptografada?: string;
  suporta_carddav: boolean;
  suporta_caldav: boolean;
}

export interface EmailContaUsuario {
  id: string;
  email_conta_id: string;
  usuario_id: string; // UUID
  padrao: boolean;
  created_at: string;
  // Relações
  email_conta?: EmailConta;
}

// Formulários
export interface CreateEmailContaData {
  nome: string;
  email: string;
  imap_host: string;
  imap_port?: number;
  imap_ssl?: boolean;
  smtp_host: string;
  smtp_port?: number;
  smtp_ssl?: boolean;
  senha: string; // Apenas para criação/atualização
  ativo?: boolean;
  // CardDAV/CalDAV
  carddav_url?: string;
  carddav_usuario?: string;
  carddav_senha?: string;
  caldav_url?: string;
  caldav_usuario?: string;
  caldav_senha?: string;
  suporta_carddav?: boolean;
  suporta_caldav?: boolean;
}

export interface UpdateEmailContaData extends Partial<CreateEmailContaData> {
  id: string;
}

// Dados para visualização
export interface EmailMessage {
  id: string;
  uid?: number; // UID do IMAP para marcar flags
  email_conta_id?: string;
  message_id?: string;
  de: string;
  de_nome?: string;
  para: string[];
  cc?: string[];
  assunto: string;
  preview: string;
  corpo?: string;
  data: string;
  lido: boolean;
  starred: boolean;
  anexos?: EmailAnexo[];
  pasta: EmailPasta;
  headers?: Record<string, string>;
  // Threading
  thread_id?: string;
  references?: string[];
  in_reply_to?: string;
}

// Informações de um label/marcador IMAP
export interface LabelInfo {
  name: string;
  imapName: string;
  unread: number;
  total: number;
}

// Contagem de não lidos por pasta (estendida)
export interface UnreadCounts {
  inbox: number;
  sent: number;
  drafts: number;
  trash: number;
  spam: number;
  starred: number;
  snoozed: number;
  labels: LabelInfo[];
}

export interface EmailAnexo {
  id: string;
  nome: string;
  tamanho: number;
  tipo: string;
  url?: string;
  partId?: string;
  contentId?: string;
  isInline?: boolean;
}

// Pastas de email
export type EmailPasta = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'starred' | 'archive' | 'snoozed';

// Email adiado (snoozed)
export interface SnoozedEmail {
  id: string;
  email_conta_id: string;
  message_uid: string;
  message_id?: string;
  pasta_origem: string;
  snoozed_until: string;
  assunto?: string;
  de?: string;
  de_nome?: string;
  data_original?: string;
  created_at: string;
}

export interface EmailPastaInfo {
  id: EmailPasta;
  label: string;
  icon: string;
  count?: number;
  unread?: number;
}

// Contatos CardDAV
export interface EmailContato {
  id: string;
  email_conta_id: string;
  uid: string;
  nome?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  notas?: string;
  foto_url?: string;
  vcard?: string;
  created_at: string;
  updated_at: string;
}

// Eventos CalDAV
export interface EmailEvento {
  id: string;
  email_conta_id: string;
  uid: string;
  titulo: string;
  descricao?: string;
  local?: string;
  inicio: string;
  fim?: string;
  dia_inteiro: boolean;
  recorrencia?: string;
  participantes?: EventoParticipante[];
  alarmes?: EventoAlarme[];
  icalendar?: string;
  created_at: string;
  updated_at: string;
}

export interface EventoParticipante {
  email: string;
  nome?: string;
  status?: 'aceito' | 'recusado' | 'pendente';
}

export interface EventoAlarme {
  tipo: 'display' | 'email';
  minutos_antes: number;
}

// Request/Response tipos
export interface EmailSendRequest {
  conta_id: string;
  para: string[];
  cc?: string[];
  cco?: string[];
  assunto: string;
  corpo: string;
  html?: boolean;
  anexos?: File[];
}

export interface EmailSyncRequest {
  conta_id: string;
  pasta?: EmailPasta;
  forcar?: boolean;
}

export interface TestConnectionRequest {
  imap_host: string;
  imap_port: number;
  imap_ssl: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_ssl: boolean;
  email: string;
  senha: string;
}

export interface TestConnectionResponse {
  imap_ok: boolean;
  smtp_ok: boolean;
  imap_error?: string;
  smtp_error?: string;
}

// Tipos para busca avançada
export interface AdvancedSearchParams {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  notContains?: string;
  hasAttachment?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  pasta?: string;
}

export interface EmailSearchFilters {
  query: string;
  criterio: 'all' | 'from' | 'subject' | 'body' | 'to';
  advanced?: AdvancedSearchParams;
}
