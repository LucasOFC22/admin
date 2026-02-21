import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { logService } from '@/services/logger/logService';

export interface FlowBuilderData {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  flow_data: any;
  created_at: string;
  updated_at: string;
  company_id?: number;
  user_id?: number;
}

export const useFlowBuilder = (flowId?: string) => {
  const { toast } = useToast();
  const [flow, setFlow] = useState<FlowBuilderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar fluxo específico
  const loadFlow = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_builders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFlow(data);
    } catch (error: any) {
      console.error('Erro ao carregar fluxo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o fluxo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Criar novo fluxo
  const createFlow = useCallback(async (name: string, description?: string) => {
    setSaving(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_builders')
        .insert({
          name,
          description,
          active: true,
          flow_data: { nodes: [], edges: [] }
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log da criação
      await logService.logFlowBuilder({
        tipo_de_acao: 'criar',
        flow_id: data.id,
        dados_novos: {
          name,
          description,
          active: true
        }
      });
      
      
      return data;
    } catch (error: any) {
      console.error('Erro ao criar fluxo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o fluxo",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Atualizar fluxo
  const updateFlow = useCallback(async (id: string, updates: Partial<FlowBuilderData>) => {
    setSaving(true);
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar dados anteriores para log
      const { data: oldData } = await supabase
        .from('flow_builders')
        .select('name, description, active')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('flow_builders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Log da atualização (apenas se não for só flow_data)
      const hasMetadataChanges = updates.name || updates.description || updates.active !== undefined;
      if (hasMetadataChanges) {
        await logService.logFlowBuilder({
          tipo_de_acao: 'editar',
          flow_id: id,
          dados_anteriores: oldData ? {
            name: oldData.name,
            description: oldData.description,
            active: oldData.active
          } : undefined,
          dados_novos: {
            name: updates.name,
            description: updates.description,
            active: updates.active
          }
        });
      }
      
      setFlow(data);
      
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar fluxo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fluxo",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Salvar dados do fluxo (nodes e edges)
  const saveFlowData = useCallback(async (id: string, flowData: any) => {
    return updateFlow(id, { flow_data: flowData });
  }, [updateFlow]);

  // Deletar fluxo
  const deleteFlow = useCallback(async (id: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar dados para log
      const { data: flowData } = await supabase
        .from('flow_builders')
        .select('name, description')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('flow_builders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log da exclusão
      await logService.logFlowBuilder({
        tipo_de_acao: 'excluir',
        flow_id: id,
        dados_anteriores: flowData ? {
          name: flowData.name,
          description: flowData.description
        } : undefined
      });
      
      
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar fluxo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fluxo",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Listar todos os fluxos
  const listFlows = useCallback(async () => {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('flow_builders')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao listar fluxos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fluxos",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  // Duplicar fluxo
  const duplicateFlow = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { data: originalFlow, error: fetchError } = await supabase
        .from('flow_builders')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('flow_builders')
        .insert({
          name: `${originalFlow.name} (Cópia)`,
          description: originalFlow.description,
          active: false,
          flow_data: originalFlow.flow_data
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log da duplicação
      await logService.logFlowBuilder({
        tipo_de_acao: 'duplicar',
        flow_id: data.id,
        dados_anteriores: {
          flow_original_id: id,
          flow_original_name: originalFlow.name
        },
        dados_novos: {
          name: data.name,
          description: data.description
        }
      });
      
      
      return data;
    } catch (error: any) {
      console.error('Erro ao duplicar fluxo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o fluxo",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Carregar fluxo ao montar se flowId for fornecido
  useEffect(() => {
    if (flowId) {
      loadFlow(flowId);
    }
  }, [flowId, loadFlow]);

  return {
    flow,
    loading,
    saving,
    loadFlow,
    createFlow,
    updateFlow,
    saveFlowData,
    deleteFlow,
    duplicateFlow,
    listFlows
  };
};
