/**
 * Central types index - re-exports all types for easy importing
 */

// Base types (primary source of truth)
export type * from './base';

// Common types (excluding duplicates from base)
export type { 
  User, 
  N8nUser, 
  LoginResponse, 
  UserConfiguration,
  DateValue,
  ProposalAction,
  TimestampValue,
  TransferHistory,
  ClienteInfo,
  Satisfaction,
  ChatSessionStatusType,
  ChatSession,
  ChatMessage,
  MessageTemplate,
  BaseDocument
} from './common';

// Entity types
export type * from './cliente';
export type * from './coleta';
export type { Contact, ContactFormData } from './contact';

// FlowBuilder types
export type * from './flowbuilder';
export type * from './flowbuilder-blocks';

// Icon types
export type * from './icons';
