
import { n8nApi, N8nResponse } from './apiService';
import { backendService } from '@/services/api/backendService';

export interface N8nQuote {
  id: string;
  status: 'pendente' | 'analise' | 'proposta_enviada' | 'aprovada' | 'rejeitada' | 'aceita' | 'cancelada';
  contato: {
    name: string;
    email: string;
    phone?: string;
  };
  remetente: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  destinatario: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  carga: {
    type: string;
    description: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  propostas?: N8nProposta[];
  historico?: N8nHistorico[];
}

export interface N8nProposta {
  id: string;
  valor: number;
  detalhes: string;
  prazoEntrega: string;
  validade: string;
  responsavel: string;
  status: 'enviada' | 'aceita' | 'rejeitada';
  createdAt: string;
  enviadoEm?: string;
}

export interface N8nHistorico {
  id: string;
  action: string;
  description: string;
  author: string;
  timestamp: string;
  metadata?: any;
}

class N8nQuotesService {
  async getQuotes(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<N8nQuote[]> {
    const response = await backendService.buscarCotacoes(filters);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch quotes');
    }

    return response.data || [];
  }

  async getQuoteById(id: string): Promise<N8nQuote | null> {
    const response = await backendService.buscarCotacaoCliente({ nro_orcamento: id });
    
    if (!response.success) {
      console.error('Failed to fetch quote:', response.error);
      return null;
    }

    return response.data || null;
  }

  async createQuote(quoteData: Omit<N8nQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<N8nQuote> {
    const response = await backendService.cotacao('nova_cotacao', { dados: quoteData });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create quote');
    }

    return response.data;
  }

  async updateQuote(id: string, updates: Partial<N8nQuote>): Promise<N8nQuote> {
    const response = await n8nApi.put<N8nQuote>(`quotes/${id}`, updates);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update quote');
    }

    return response.data;
  }

  async deleteQuote(id: string): Promise<void> {
    const response = await n8nApi.delete(`quotes/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete quote');
    }
  }

  // Propostas
  async createProposta(quoteId: string, propostaData: Omit<N8nProposta, 'id' | 'createdAt'>): Promise<N8nProposta> {
    const response = await n8nApi.post<N8nProposta>(`quotes/${quoteId}/propostas`, propostaData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create proposta');
    }

    return response.data;
  }

  async getPropostas(quoteId: string): Promise<N8nProposta[]> {
    const response = await n8nApi.get<N8nProposta[]>(`quotes/${quoteId}/propostas`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch propostas');
    }

    return response.data || [];
  }

  async updatePropostaStatus(quoteId: string, propostaId: string, status: 'aceita' | 'rejeitada'): Promise<N8nProposta> {
    const response = await n8nApi.put<N8nProposta>(`quotes/${quoteId}/propostas/${propostaId}`, { status });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update proposta status');
    }

    return response.data;
  }

  // Histórico
  async addHistoricoEntry(quoteId: string, historicoData: Omit<N8nHistorico, 'id' | 'timestamp'>): Promise<N8nHistorico> {
    const response = await n8nApi.post<N8nHistorico>(`quotes/${quoteId}/historico`, historicoData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add historico entry');
    }

    return response.data;
  }

  async getHistorico(quoteId: string): Promise<N8nHistorico[]> {
    const response = await n8nApi.get<N8nHistorico[]>(`quotes/${quoteId}/historico`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch historico');
    }

    return response.data || [];
  }
}

export const n8nQuotesService = new N8nQuotesService();
