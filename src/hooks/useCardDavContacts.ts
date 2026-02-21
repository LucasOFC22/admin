import { useState, useCallback, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { CardDavContact, CardDavContactFormData, CardDavResponse } from '@/types/carddav';

interface UseCardDavContactsReturn {
  contacts: CardDavContact[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD
  fetchContacts: (contaId: string) => Promise<CardDavContact[]>;
  getContact: (contaId: string, uid: string) => Promise<CardDavContact | null>;
  createContact: (contaId: string, data: CardDavContactFormData) => Promise<CardDavContact | null>;
  updateContact: (contaId: string, uid: string, data: CardDavContactFormData) => Promise<CardDavContact | null>;
  deleteContact: (contaId: string, uid: string) => Promise<boolean>;
  
  // Busca
  searchContacts: (contaId: string, query: string) => Promise<CardDavContact[]>;
  
  // Cache
  clearCache: () => void;
}

// Cache global para evitar múltiplas requisições
const contactsCache = new Map<string, { contacts: CardDavContact[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useCardDavContacts(): UseCardDavContactsReturn {
  const [contacts, setContacts] = useState<CardDavContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchContacts = useCallback(async (contaId: string): Promise<CardDavContact[]> => {
    // Verificar cache
    const cached = contactsCache.get(contaId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setContacts(cached.contacts);
      return cached.contacts;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'list'
        }
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar contatos');

      const fetchedContacts = data.contacts || [];
      
      // Atualizar cache
      contactsCache.set(contaId, { contacts: fetchedContacts, timestamp: Date.now() });
      setContacts(fetchedContacts);
      
      return fetchedContacts;
    } catch (err: any) {
      const message = err.message || 'Erro ao buscar contatos';
      setError(message);
      console.error('[useCardDavContacts] fetchContacts error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getContact = useCallback(async (contaId: string, uid: string): Promise<CardDavContact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'get',
          uid
        }
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar contato');

      return data.contact || null;
    } catch (err: any) {
      const message = err.message || 'Erro ao buscar contato';
      setError(message);
      console.error('[useCardDavContacts] getContact error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContact = useCallback(async (contaId: string, data: CardDavContactFormData): Promise<CardDavContact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data: result, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'create',
          contact: data
        }
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || 'Erro ao criar contato');

      // Invalidar cache
      contactsCache.delete(contaId);
      
      // Atualizar lista local
      if (result.contact) {
        setContacts(prev => [...prev, result.contact!]);
      }

      return result.contact || null;
    } catch (err: any) {
      const message = err.message || 'Erro ao criar contato';
      setError(message);
      console.error('[useCardDavContacts] createContact error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContact = useCallback(async (contaId: string, uid: string, data: CardDavContactFormData): Promise<CardDavContact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data: result, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'update',
          uid,
          contact: data
        }
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || 'Erro ao atualizar contato');

      // Invalidar cache
      contactsCache.delete(contaId);
      
      // Atualizar lista local
      if (result.contact) {
        setContacts(prev => prev.map(c => c.uid === uid ? result.contact! : c));
      }

      return result.contact || null;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar contato';
      setError(message);
      console.error('[useCardDavContacts] updateContact error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteContact = useCallback(async (contaId: string, uid: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data: result, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'delete',
          uid
        }
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || 'Erro ao deletar contato');

      // Invalidar cache
      contactsCache.delete(contaId);
      
      // Atualizar lista local
      setContacts(prev => prev.filter(c => c.uid !== uid));

      return true;
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar contato';
      setError(message);
      console.error('[useCardDavContacts] deleteContact error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchContacts = useCallback(async (contaId: string, query: string): Promise<CardDavContact[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    // Cancelar busca anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Primeiro tentar buscar do cache local
      const cached = contactsCache.get(contaId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const queryLower = query.toLowerCase();
        return cached.contacts.filter(contact =>
          contact.nome?.toLowerCase().includes(queryLower) ||
          contact.sobrenome?.toLowerCase().includes(queryLower) ||
          contact.nomeCompleto?.toLowerCase().includes(queryLower) ||
          contact.email?.toLowerCase().includes(queryLower) ||
          contact.empresa?.toLowerCase().includes(queryLower)
        );
      }

      // Buscar do servidor
      const supabase = requireAuthenticatedClient();
      const { data, error: fnError } = await supabase.functions.invoke<CardDavResponse>('carddav-contacts', {
        body: {
          conta_id: contaId,
          action: 'search',
          query
        }
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar contatos');

      return data.contacts || [];
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      console.error('[useCardDavContacts] searchContacts error:', err);
      return [];
    }
  }, []);

  const clearCache = useCallback(() => {
    contactsCache.clear();
    setContacts([]);
  }, []);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    clearCache
  };
}
