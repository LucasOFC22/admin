import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { UnreadCounts } from '@/types/email';

const DEFAULT_COUNTS: UnreadCounts = {
  inbox: 0,
  sent: 0,
  drafts: 0,
  trash: 0,
  spam: 0,
  starred: 0,
  snoozed: 0,
  labels: []
};

export function useEmailUnreadCounts(contaId: string | null) {
  const [counts, setCounts] = useState<UnreadCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!contaId) return;
    
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('email-unread-counts', {
        body: { conta_id: contaId }
      });

      if (error) throw error;
      if (data?.success && data?.counts) {
        setCounts({
          ...DEFAULT_COUNTS,
          ...data.counts,
          labels: data.counts.labels || []
        });
      }
    } catch (err) {
      console.error('Erro ao buscar contagens:', err);
    } finally {
      setLoading(false);
    }
  }, [contaId]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 180000); // 3 minutos
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { counts, loading, refresh: fetchCounts };
}
