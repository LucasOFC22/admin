import { useState, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { EmailMessage, AdvancedSearchParams } from '@/types/email';
import { useToast } from '@/hooks/use-toast';

export type SearchCriterio = 'all' | 'from' | 'subject' | 'body' | 'to';

interface UseEmailSearchResult {
  results: EmailMessage[];
  searching: boolean;
  error: string | null;
  source: 'imap' | null;
  search: (query: string, pasta?: string, criterio?: SearchCriterio) => Promise<void>;
  advancedSearch: (params: AdvancedSearchParams, pasta?: string) => Promise<void>;
  clearResults: () => void;
}

export function useEmailSearch(contaId?: string): UseEmailSearchResult {
  const [results, setResults] = useState<EmailMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'imap' | null>(null);
  const { toast } = useToast();

  // Busca via IMAP
  const search = useCallback(async (
    query: string, 
    pasta: string = 'INBOX',
    criterio: SearchCriterio = 'all'
  ) => {
    if (!contaId || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSource('imap');
      
      console.log('[useEmailSearch] Buscando via IMAP:', { query, pasta, criterio });
      
      const supabase = requireAuthenticatedClient();
      const { data, error: searchError } = await supabase.functions.invoke('email-search', {
        body: {
          conta_id: contaId,
          query: query.trim(),
          pasta,
          criterio,
          limite: 50
        }
      });

      if (searchError) throw searchError;

      if (data.success && data.emails) {
        setResults(data.emails);
        console.log('[useEmailSearch] IMAP: encontrados', data.emails.length, 'resultados');
      } else {
        throw new Error(data.error || 'Erro ao buscar');
      }
    } catch (err: any) {
      console.error('[useEmailSearch] Erro busca IMAP:', err);
      setError(err.message);
      toast({
        title: 'Erro na busca',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  }, [contaId, toast]);

  const advancedSearch = useCallback(async (
    params: AdvancedSearchParams,
    pasta: string = 'INBOX'
  ) => {
    if (!contaId) {
      setResults([]);
      return;
    }

    const hasFilters = Object.values(params).some(v => 
      v !== undefined && v !== '' && v !== false
    );

    if (!hasFilters) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSource('imap');
      
      console.log('[useEmailSearch] Busca avançada:', params);
      
      const supabase = requireAuthenticatedClient();
      const { data, error: searchError } = await supabase.functions.invoke('email-search', {
        body: {
          conta_id: contaId,
          pasta,
          limite: 50,
          advanced: {
            from: params.from,
            to: params.to,
            subject: params.subject,
            body: params.body,
            not_contains: params.notContains,
            has_attachment: params.hasAttachment,
            date_from: params.dateFrom?.toISOString(),
            date_to: params.dateTo?.toISOString()
          }
        }
      });

      if (searchError) throw searchError;

      if (data.success && data.emails) {
        setResults(data.emails);
        console.log('[useEmailSearch] Encontrados:', data.emails.length);
      } else {
        throw new Error(data.error || 'Erro ao buscar');
      }
    } catch (err: any) {
      console.error('[useEmailSearch] Erro busca avançada:', err);
      setError(err.message);
      toast({
        title: 'Erro na busca avançada',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  }, [contaId, toast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSource(null);
  }, []);

  return {
    results,
    searching,
    error,
    source,
    search,
    advancedSearch,
    clearResults
  };
}
