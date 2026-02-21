
import { ContactStatus, ContactId, Timestamp } from './base';

export interface Contact {
  id: ContactId;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  assunto: string;
  mensagem: string;
  status: ContactStatus;
  criadoEm: Timestamp;
  respondidoEm?: Timestamp;
  resposta?: string;
  ip?: string;
  userAgent?: string;
  origem?: string;
}

export interface ContactFormData {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  assunto: string;
  mensagem: string;
}

// Standardized ContactDetails type
export interface ContactDetails {
  id: ContactId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  respondedAt?: Timestamp;
  respondedBy?: string;
  response?: string;
  department?: string;
  source: 'n8n' | 'supabase' | 'website';
  referenceId?: string;
  ip?: string;
  userAgent?: string;
  // Legacy aliases for compatibility
  nome?: string;
  telefone?: string;
  assunto?: string;
  mensagem?: string;
  criadoEm?: Timestamp;
  respondidoEm?: Timestamp;
}
