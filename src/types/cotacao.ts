/**
 * Cotacao (Quote) types
 * Defines the structure for quote data throughout the application
 */

import { QuoteId, QuoteStatus, Timestamp } from './base';

/**
 * Address information
 */
export interface Endereco {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  // English aliases
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Contact information for quotes
 */
export interface CotacaoContato {
  name?: string;
  email: string;
  phone?: string;
  telefone?: string;
}

/**
 * Party information (sender/recipient)
 */
export interface CotacaoParty {
  name?: string;
  nome?: string;
  documento?: string;
  endereco?: Endereco;
  address?: Endereco;
  email?: string;
  telefone?: string;
  phone?: string;
}

/**
 * Cargo/load information
 */
export interface CotacaoCarga {
  tipo?: string;
  description?: string;
  descricao?: string;
  peso?: number;
  volume?: number;
  valorDeclarado?: number;
  altura?: number;
  comprimento?: number;
  profundidade?: number;
  dimensoes?: {
    comprimento?: number;
    largura?: number;
    altura?: number;
    profundidade?: number;
  };
}

/**
 * Proposal data structure
 */
export interface CotacaoProposta {
  id?: string | number;
  cotacao_id?: number;
  status?: 'enviada' | 'aceita' | 'recusada';
  valor?: number;
  valor_formatado?: string;
  valorFormatado?: string;
  prazo_entrega?: string;
  prazoEntrega?: string;
  validade?: string;
  detalhes?: string;
  responsavel?: string;
  criado_em?: string;
  enviadoEm?: string;
}

/**
 * Main Cotacao interface
 */
export interface Cotacao {
  id: number | string;
  quoteId?: string;
  idCotacao?: string;
  status: QuoteStatus | string;
  contato?: CotacaoContato;
  remetente?: CotacaoParty;
  destinatario?: CotacaoParty;
  carga?: CotacaoCarga;
  origem?: string;
  destino?: string;
  origin?: string;
  destination?: string;
  peso?: number;
  weight?: number;
  value?: number;
  valorDeclarado?: number;
  dimensoes?: {
    comprimento?: number;
    largura?: number;
    altura?: number;
    profundidade?: number;
  };
  tipoFrete?: string;
  necessitaColeta?: boolean;
  observacoes?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
  propostas?: CotacaoProposta[];
  adminQuoteLink?: string;
  // Proposal-related fields
  valorProposta?: number;
  propostaValor?: number;
  dataProposta?: string;
  prazoEntrega?: string;
  propostaPrazo?: string;
  validade?: string;
  propostaValidade?: string;
  // Pickup/collection info
  coleta?: {
    necessita?: boolean;
    endereco?: Endereco;
    observacoes?: string;
  };
}

/**
 * Type guard to check if object is a valid Cotacao
 */
export const isCotacao = (obj: unknown): obj is Cotacao => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('id' in obj) &&
    ('status' in obj)
  );
};
