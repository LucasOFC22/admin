
import { QuoteStatus, QuoteId, Timestamp } from './base';
import { ContactInfo, PartyInfo, CargoInfo } from './base';

export interface Quote {
  id: QuoteId;
  // Basic info
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  
  // Cargo details
  tipoCarga: string;
  peso: number;
  dimensoes?: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  valorCarga?: number;
  descricaoCarga?: string;
  
  // Pickup and delivery
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  
  // Dates
  dataColeta?: Timestamp;
  prazoEntrega?: string;
  
  // Status and metadata
  status: QuoteStatus;
  criadoEm: Timestamp;
  atualizadoEm?: Timestamp;
  
  // Optional fields
  observacoes?: string;
  valorFrete?: number;
  prazoEstimado?: string;
  condicoesPagamento?: string;
  ip?: string;
  userAgent?: string;
  origem?: string;
}

export interface QuoteFormData {
  // Personal info
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  
  // Cargo
  tipoCarga: string;
  peso: number;
  dimensoes?: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  valorCarga?: number;
  descricaoCarga?: string;
  
  // Route
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  
  // Timing
  dataColeta?: Date;
  prazoEntrega?: string;
  
  // Additional
  observacoes?: string;
}

// Enhanced QuoteDetails with proper typing
export interface QuoteDetails extends Quote {
  // Structured data using base types
  quoteId?: QuoteId;
  remetente?: PartyInfo;
  destinatario?: PartyInfo;
  contato?: ContactInfo;
  carga?: CargoInfo;
  
  // Additional computed properties
  formattedId: string;
  timeAgo: string;
  statusBadge: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
  };
  
  // Legacy compatibility fields
  origin?: string;
  destination?: string;
  date?: Timestamp;
  originState?: string;
  destinationState?: string;
  
  // Proposals and notes
  propostas?: ProposalData[];
  notas?: QuoteNote[];
  
  // Admin fields
  adminQuoteLink?: string;
}

export interface ProposalData {
  id?: string;
  quoteId?: QuoteId;
  valor?: number | string;
  prazoEntrega?: string;
  validade?: string;
  detalhes?: string;
  responsavel?: string;
  status?: QuoteStatus;
  criadoEm?: Timestamp;
  enviadoEm?: Timestamp;
  
  // Legacy compatibility - all optional for flexibility
  valorFrete?: number;
  prazoEstimado?: string;
  condicoesPagamento?: string;
  observacoes?: string;
  prazo?: string;
  modalidade?: string;
  seguro?: string;
}

export interface QuoteNote {
  id: string;
  quoteId: QuoteId;
  content: string;
  author: string;
  isInternal: boolean;
  createdAt: Timestamp;
}

export type ProposalAction = QuoteStatus;
