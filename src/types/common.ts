
// Common type definitions without Firebase dependencies

// Import base types to avoid duplication
import type { QuoteStatus as BaseQuoteStatus, ContactStatus as BaseContactStatus } from './base';

// User configuration type (was `any`)
export interface UserConfiguration {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  emailNotifications?: boolean;
  language?: string;
  timezone?: string;
  [key: string]: unknown;
}

// User type
export interface User {
  id?: string;
  nome?: string;
  email?: string;
  tipo?: 'admin' | 'cliente';
  ativo?: boolean;
  telefone?: string;
  empresa?: string;
  acessoAreaCliente?: boolean;
  hasAdminAccess?: boolean;
  hasClientAccess?: boolean;
  uid?: string;
  displayName?: string;
  criadoEm?: Date | string;
  configuracoes?: UserConfiguration;
}

// N8N User type
export interface N8nUser {
  id: string;
  email: string;
  nome?: string;
  tipo?: 'admin' | 'cliente';
  uid?: string;
  displayName?: string;
  ativo?: boolean;
  telefone?: string;
  empresa?: string;
  acessoAreaCliente?: boolean;
  hasAdminAccess?: boolean;
  hasClientAccess?: boolean;
}

// Login Response type
export interface LoginResponse {
  user: N8nUser;
  hasAdminAccess?: boolean;
  hasClientAccess?: boolean;
  token?: string;
}

// Date value type
export type DateValue = Date | string | null;

// Re-export base types for backwards compatibility
export type ContactStatus = BaseContactStatus;
export type QuoteStatus = BaseQuoteStatus;

// Proposal Action types - matching QuoteStatus
export type ProposalAction = QuoteStatus;

// Timestamp type for Firebase/Supabase compatibility
export type TimestampValue = Date | string | number | { seconds: number; nanoseconds: number };

// Transfer History interface
export interface TransferHistory {
  fromAgent: string;
  toAgent: string;
  reason: string;
  timestamp: TimestampValue;
}

// Client Info interface
export interface ClienteInfo {
  ip?: string;
  localizacao?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

// Satisfaction interface with optional feedback
export interface Satisfaction {
  rating: number;
  feedback?: string;
  timestamp: TimestampValue;
}

// Chat session status type
export type ChatSessionStatusType = 'nova' | 'em_atendimento' | 'aguardando' | 'resolvida' | 'active' | 'waiting' | 'closed' | 'escalated';

// Chat related types
export interface ChatSession {
  id: string;
  name?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  phone?: string;
  userPhone?: string;
  telefone?: string;
  status: ChatSessionStatusType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage?: string;
  lastActivity?: TimestampValue;
  siteOrigem?: string;
  createdAt?: TimestampValue;
  updatedAt?: TimestampValue;
  assignedAgent?: string;
  assignedAgentName?: string;
  assignedAt?: TimestampValue;
  resolvedAt?: TimestampValue;
  transferHistory?: TransferHistory[];
  tags?: string[];
  satisfaction?: Satisfaction;
  clienteInfo?: ClienteInfo;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'admin' | 'bot';
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  jobTitle?: string;
  timestamp: TimestampValue;
  sessionId?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  usage?: number;
}

// Base document interface
export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
