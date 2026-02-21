import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { TipoCaminhao, tipoCaminhaoFromSupabase } from '@/types/malote';
import { toast } from '@/lib/toast';

export const useTiposCaminhao = () => {
  const [tiposCaminhao, setTiposCaminhao] = useState<TipoCaminhao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiposCaminhao = useCallback(async (apenasAtivos = false) => {
    try {
      setLoading(true);
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('tipos_caminhao')
        .select('*')
        .order('nome');
      
      if (apenasAtivos) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      setTiposCaminhao(data?.map(tipoCaminhaoFromSupabase) || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de caminhão:', error);
      toast.error('Erro ao buscar tipos de caminhão');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTipoCaminhao = async (data: { nome: string; descricao?: string; percentual: number }) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('tipos_caminhao')
        .insert({
          nome: data.nome,
          descricao: data.descricao,
          percentual: data.percentual,
          ativo: true,
        });

      if (error) throw error;

      toast.success('Tipo de caminhão criado com sucesso!');
      fetchTiposCaminhao();
      return true;
    } catch (error) {
      console.error('Erro ao criar tipo de caminhão:', error);
      toast.error('Erro ao criar tipo de caminhão');
      return false;
    }
  };

  const updateTipoCaminhao = async (id: string, data: Partial<{ nome: string; descricao: string; percentual: number; ativo: boolean }>) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('tipos_caminhao')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Tipo de caminhão atualizado com sucesso!');
      fetchTiposCaminhao();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tipo de caminhão:', error);
      toast.error('Erro ao atualizar tipo de caminhão');
      return false;
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    return updateTipoCaminhao(id, { ativo });
  };

  const deleteTipoCaminhao = async (id: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('tipos_caminhao')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tipo de caminhão excluído com sucesso!');
      fetchTiposCaminhao();
      return true;
    } catch (error) {
      console.error('Erro ao excluir tipo de caminhão:', error);
      toast.error('Erro ao excluir tipo de caminhão');
      return false;
    }
  };

  useEffect(() => {
    fetchTiposCaminhao();
  }, [fetchTiposCaminhao]);

  return {
    tiposCaminhao,
    loading,
    fetchTiposCaminhao,
    createTipoCaminhao,
    updateTipoCaminhao,
    toggleAtivo,
    deleteTipoCaminhao,
  };
};
