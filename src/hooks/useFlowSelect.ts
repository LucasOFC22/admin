import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface FlowOption {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export const useFlowSelect = () => {
  const [flows, setFlows] = useState<FlowOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_builders')
        .select('id, name, description, active')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return {
    flows,
    loading,
    refetch: fetchFlows
  };
};
