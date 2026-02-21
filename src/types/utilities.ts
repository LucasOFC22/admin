// Utility types for type safety and transformations

import { QuoteStatus } from './base';
import { Quote } from './quote';
import { formatTimeAgo } from '@/utils/dateFormatters';

// Helper functions for type transformations
export const createQuoteDetails = (quote: Quote): import('./components').QuoteDetails => {
  return {
    ...quote,
    formattedId: `#${quote.id.slice(-6).toUpperCase()}`,
    timeAgo: formatTimeAgo(quote.criadoEm),
    statusBadge: getStatusBadge(quote.status),
    propostas: [],
    notas: [],
    // Ensure all required fields are present
    dimensoes: quote.dimensoes ? {
      ...quote.dimensoes,
      profundidade: quote.dimensoes.altura // Use altura as fallback for profundidade
    } : undefined,
  };
};

/** @deprecated Use formatTimeAgo directly from @/utils/dateFormatters */
// formatTimeAgo is imported above and used in createQuoteDetails

export const getStatusBadge = (status: QuoteStatus): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
} => {
  switch (status) {
    case 'pendente':
    case 'Pendente':
      return { variant: 'outline', label: 'Pendente' };
    case 'analise':
    case 'Aguardando análise':
      return { variant: 'secondary', label: 'Em Análise' };
    case 'proposta_enviada':
    case 'Proposta Enviada':
      return { variant: 'default', label: 'Proposta Enviada' };
    case 'aprovada':
    case 'aceita':
    case 'Aprovada':
      return { variant: 'default', label: 'Aprovada' };
    case 'rejeitada':
    case 'recusada':
      return { variant: 'destructive', label: 'Rejeitada' };
    case 'cancelada':
      return { variant: 'destructive', label: 'Cancelada' };
    default:
      return { variant: 'outline', label: status };
  }
};

// Type guards
export const isValidQuoteStatus = (status: string): status is QuoteStatus => {
  const validStatuses: QuoteStatus[] = [
    'pendente', 'analise', 'proposta_enviada', 'aprovada', 'rejeitada', 'cancelada',
    'aceita', 'recusada', 'Pendente', 'Aguardando análise', 'Aprovada', 'Proposta Enviada'
  ];
  return validStatuses.includes(status as QuoteStatus);
};

// Address helpers
export const getFullAddress = (address?: import('./base').Address): string => {
  if (!address) return '';
  
  const city = address.city || address.cidade || '';
  const state = address.state || address.estado || '';
  const zipcode = address.zipcode || address.cep || '';
  
  return `${address.street} ${address.number}, ${address.neighborhood}, ${city}/${state} - ${zipcode}`;
};

export const getShortAddress = (address?: import('./base').Address): string => {
  if (!address) return '';
  
  const city = address.city || address.cidade || '';
  const state = address.state || address.estado || '';
  
  return `${city}/${state}`;
};

/**
 * @deprecated Use formatCurrency de @/lib/formatters
 * Importar: import { formatCurrency } from '@/lib/formatters';
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export const formatWeight = (weight: number | string): string => {
  const numValue = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (isNaN(numValue)) return '0 kg';
  
  return `${numValue} kg`;
};

export const formatDimensions = (dimensions?: {
  length?: number;
  width?: number;
  height?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
}): string => {
  if (!dimensions) return '';
  
  const length = dimensions.length || dimensions.comprimento || 0;
  const width = dimensions.width || dimensions.largura || 0;
  const height = dimensions.height || dimensions.altura || 0;
  
  return `${length} x ${width} x ${height} cm`;
};

// Safe property access helpers
export const safeGet = <T, K extends keyof T>(obj: T | undefined | null, key: K): T[K] | undefined => {
  return obj?.[key];
};

export const safeGetNested = <T>(obj: any, path: string): T | undefined => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Legacy compatibility helpers
export const mapLegacyContact = (contact: any): import('./base').ContactInfo => {
  return {
    name: contact.name || contact.nome || '',
    email: contact.email || '',
    phone: contact.phone || contact.telefone,
    nome: contact.nome,
    telefone: contact.telefone
  };
};

export const mapLegacyAddress = (address: any): import('./base').Address => {
  return {
    street: address.street || address.rua || '',
    number: address.number || address.numero || '',
    complement: address.complement || address.complemento,
    neighborhood: address.neighborhood || address.bairro || '',
    city: address.city || address.cidade || '',
    state: address.state || address.estado || '',
    zipcode: address.zipcode || address.cep || '',
    cidade: address.cidade,
    estado: address.estado,
    cep: address.cep
  };
};