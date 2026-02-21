// Base branded types for type safety
export type QuoteId = string & { readonly _brand: unique symbol };
export type ContactId = string & { readonly _brand: unique symbol };
export type UserId = string & { readonly _brand: unique symbol };
export type SessionId = string & { readonly _brand: unique symbol };

// Timestamp types for consistency
export type Timestamp = Date | string;
export type ISOString = string; // For ISO format timestamps

// Status union types
export type QuoteStatus = 
  | 'pendente' 
  | 'analise' 
  | 'proposta_enviada' 
  | 'aprovada' 
  | 'rejeitada' 
  | 'cancelada'
  | 'aceita'
  | 'recusada'
  | 'Pendente'
  | 'Aguardando análise'
  | 'Aprovada'
  | 'Proposta Enviada';

export type ContactStatus = 'novo' | 'processando' | 'respondido' | 'arquivado';

export type ChatSessionStatus = 
  | 'nova' 
  | 'em_atendimento' 
  | 'aguardando' 
  | 'resolvida' 
  | 'active' 
  | 'waiting' 
  | 'closed' 
  | 'escalated';

export type UserRole = 'admin' | 'cliente' | 'agent';
export type RequestorType = 'Remetente' | 'Destinatario' | 'Outros';
export type FreightType = 'fob' | 'cif';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Common data structures
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  // Legacy aliases for compatibility
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  // Legacy aliases for compatibility
  nome?: string;
  telefone?: string;
}

export interface PartyInfo extends ContactInfo {
  document?: string;
  company?: string;
  address?: Address;
  // Legacy aliases for compatibility
  documento?: string;
  cnpj?: string;
  endereco?: Address;
}

export interface CargoInfo {
  description: string;
  weight: number;
  declaredValue: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  notes?: string;
  // Legacy aliases for compatibility
  descricao?: string;
  peso?: number;
  valorDeclarado?: number;
  altura?: number;
  largura?: number;
  profundidade?: number;
  valor?: number;
}

export interface WorkingHours {
  from: string;
  to: string;
}

// Utility types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

export type FilterOptions<T> = {
  [K in keyof T]?: T[K] | 'all';
};

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

// Form field types
export type FormFieldType = 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number';
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Generic base entity
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}