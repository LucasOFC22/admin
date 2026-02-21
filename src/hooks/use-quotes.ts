import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatSession, ChatService } from '@/services/n8n/chatService';

export interface Quote {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  tipoCarga: string;
  peso: number;
  dimensoes?: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  valorCarga?: number;
  descricaoCarga?: string;
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  dataColeta?: Date | string;
  prazoEntrega?: string;
  status: 'pendente' | 'analise' | 'proposta_enviada' | 'aprovada' | 'rejeitada' | 'cancelada' | 'aceita' | 'recusada';
  criadoEm: Date | string;
  atualizadoEm?: Date | string;
  observacoes?: string;
  valorFrete?: number;
  prazoEstimado?: string;
  condicoesPagamento?: string;
  ip?: string;
  userAgent?: string;
  origem?: string;
}

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual N8N service call
      const mockQuotes: Quote[] = [
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@exemplo.com',
          telefone: '(11) 99999-9999',
          empresa: 'Empresa ABC',
          tipoCarga: 'Eletrônicos',
          peso: 100,
          dimensoes: {
            comprimento: 50,
            largura: 30,
            altura: 20
          },
          valorCarga: 5000,
          descricaoCarga: 'Equipamentos eletrônicos',
          origemCidade: 'São Paulo',
          origemEstado: 'SP',
          destinoCidade: 'Rio de Janeiro',
          destinoEstado: 'RJ',
          dataColeta: new Date(),
          prazoEntrega: '5 dias úteis',
          status: 'pendente',
          criadoEm: new Date(),
          observacoes: 'Carga frágil'
        }
      ];
      
      setQuotes(mockQuotes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cotações';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    try {
      setQuotes(prev => prev.map(quote => 
        quote.id === quoteId 
          ? { ...quote, status, atualizadoEm: new Date() }
          : quote
      ));

      toast({
        title: "Status atualizado",
        description: "Status da cotação foi atualizado com sucesso."
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      setQuotes(prev => prev.filter(quote => quote.id !== quoteId));
      
      toast({
        title: "Cotação removida",
        description: "Cotação foi removida com sucesso."
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover cotação';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const createQuote = async (quoteData: Omit<Quote, 'id' | 'criadoEm' | 'status'>) => {
    try {
      const newQuote: Quote = {
        ...quoteData,
        id: Date.now().toString(),
        status: 'pendente',
        criadoEm: new Date()
      };

      setQuotes(prev => [newQuote, ...prev]);
      
      toast({
        title: "Cotação criada",
        description: "Nova cotação foi criada com sucesso."
      });

      return newQuote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cotação';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const getQuoteById = (quoteId: string): Quote | undefined => {
    return quotes.find(quote => quote.id === quoteId);
  };

  const getQuotesByStatus = (status: Quote['status']): Quote[] => {
    return quotes.filter(quote => quote.status === status);
  };

  const getQuotesByEmail = (email: string): Quote[] => {
    return quotes.filter(quote => quote.email === email);
  };

  const refreshQuotes = () => {
    loadQuotes();
  };

  return {
    quotes,
    loading,
    error,
    updateQuoteStatus,
    deleteQuote,
    createQuote,
    getQuoteById,
    getQuotesByStatus,
    getQuotesByEmail,
    refreshQuotes
  };
};
