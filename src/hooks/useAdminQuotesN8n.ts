import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { n8nApi } from '@/services/n8n/apiService';
import { QuotesFilters } from './useQuotesFilters';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';

interface AdminQuote {
  id: string;
  quoteId: string;
  senderName: string;
  senderDocument: string;
  recipientName: string;
  recipientDocument: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: string;
  value: number;
  status: 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Proposta Enviada' | 'Andamento' | 'expired' | 'aceitar' | 'rejeitar' | 'recusada';
  createdAt: string;
  validUntil: string;
  remetente?: any;
  destinatario?: any;
  carga?: any;
  contato?: any;
  criadoEm?: any;
  [key: string]: any;
}

// Type guards para verificar estruturas de dados
const hasProperty = (obj: any, prop: string): boolean => {
  return obj && typeof obj === 'object' && prop in obj;
};

const isValidQuoteItem = (item: any): boolean => {
  if (!item) return false;
  
  // Se tem json e não está vazio
  if (hasProperty(item, 'json') && typeof item.json === 'object' && Object.keys(item.json).length > 0) {
    return true;
  }
  
  // Se tem dados diretos (sem json wrapper)
  if (hasProperty(item, 'id') || hasProperty(item, 'quoteId') || hasProperty(item, 'remetente_nome') || hasProperty(item, 'destinatario_nome')) {
    return true;
  }
  
  return false;
};

export const useAdminQuotesN8n = (status?: string, filters?: QuotesFilters) => {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [allQuotes, setAllQuotes] = useState<AdminQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();
  
  // N8N fetching disabled - using Supabase only
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    sent: 0,
    inProgress: 0,
  };

  const getQuotesByStatus = (statusFilter: string) => {
    return [];
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    // N8N disabled - this will be handled by Supabase
    return;
  };

  const sendProposal = async (quoteId: string, proposalData: any) => {
    // N8N disabled - this will be handled by Supabase
    return;
  };

  return {
    quotes,
    allQuotes,
    isLoading,
    error,
    stats,
    getQuotesByStatus,
    refetch: () => {
      // N8N disabled - no refetch needed
    },
    updateQuoteStatus,
    sendProposal
  };
};
