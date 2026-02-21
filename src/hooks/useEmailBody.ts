import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { EmailAnexo } from '@/types/email';

interface UseEmailBodyResult {
  corpo: string;
  anexos: EmailAnexo[];
  loading: boolean;
  error: string | null;
  source: 'imap' | null;
  refetch: () => void;
}

export function useEmailBody(
  contaId: string | undefined, 
  emailUid: string | undefined, 
  pasta: string
): UseEmailBodyResult {
  const [corpo, setCorpo] = useState<string>('');
  const [anexos, setAnexos] = useState<EmailAnexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'imap' | null>(null);

  const fetchBody = useCallback(async () => {
    if (!contaId || !emailUid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmailBody] Buscando corpo via IMAP:', { contaId, emailUid, pasta });
      
      // Buscar corpo via Edge Function (IMAP)
      const supabase = requireAuthenticatedClient();
      const { data, error: fetchError } = await supabase.functions.invoke('email-fetch-body', {
        body: {
          conta_id: contaId,
          uid: emailUid,
          pasta
        }
      });

      if (fetchError) {
        throw fetchError;
      }

      if (data.success) {
        setCorpo(data.corpo || '');
        setAnexos(data.anexos || []);
        setSource('imap');
        console.log('[useEmailBody] IMAP OK:', data.corpo?.length, 'chars,', data.anexos?.length, 'anexos');
      } else {
        throw new Error(data.error || 'Erro ao buscar corpo do email');
      }
    } catch (err: any) {
      console.error('[useEmailBody] Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contaId, emailUid, pasta]);

  useEffect(() => {
    fetchBody();
  }, [fetchBody]);

  return {
    corpo,
    anexos,
    loading,
    error,
    source,
    refetch: fetchBody
  };
}
