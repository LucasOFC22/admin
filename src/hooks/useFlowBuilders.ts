import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { FlowBuilderData } from './useFlowBuilder';

export const useFlowBuilders = () => {
  const { toast } = useToast();
  const [flows, setFlows] = useState<FlowBuilderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_builders')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar fluxos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fluxos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('flow_builders')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setFlows(prev => prev.map(flow => 
        flow.id === id ? { ...flow, active } : flow
      ));

    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  }, [toast]);

  const exportFlow = useCallback((flow: FlowBuilderData) => {
    const dataStr = JSON.stringify(flow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flow.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);

  }, [toast]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return {
    flows,
    loading,
    fetchFlows,
    toggleActive,
    exportFlow
  };
};
