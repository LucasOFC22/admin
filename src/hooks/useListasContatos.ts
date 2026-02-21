import { useState, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

export interface ListaContatos {
  id: string;
  nome: string;
  descricao: string | null;
  total_contatos: number;
  criado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface ListaMembro {
  id: string;
  lista_id: string;
  contato_id: string;
  created_at: string;
  contato?: {
    id: string;
    nome: string;
    telefone: string;
  };
}

export const useListasContatos = () => {
  const [loading, setLoading] = useState(false);
  const [listas, setListas] = useState<ListaContatos[]>([]);

  const fetchListas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('listas_contatos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setListas((data as ListaContatos[]) || []);
      return data;
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      toast.error('Erro ao carregar listas de contatos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getLista = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase()
        .from('listas_contatos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ListaContatos;
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      return null;
    }
  }, []);

  const createLista = useCallback(async (data: { nome: string; descricao?: string; criado_por?: number }) => {
    setLoading(true);
    try {
      const { data: lista, error } = await getSupabase()
        .from('listas_contatos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      toast.success('Lista criada com sucesso!');
      return lista as ListaContatos;
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast.error('Erro ao criar lista');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLista = useCallback(async (id: string, data: { nome?: string; descricao?: string }) => {
    setLoading(true);
    try {
      const { data: lista, error } = await getSupabase()
        .from('listas_contatos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Lista atualizada!');
      return lista as ListaContatos;
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      toast.error('Erro ao atualizar lista');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLista = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await getSupabase()
        .from('listas_contatos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Lista excluída!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      toast.error('Erro ao excluir lista');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Membros da lista
  const getMembros = useCallback(async (listaId: string) => {
    try {
      const { data, error } = await getSupabase()
        .from('listas_contatos_membros')
        .select(`
          *,
          contato:contatos_whatsapp(id, nome, telefone)
        `)
        .eq('lista_id', listaId);

      if (error) throw error;
      return (data as ListaMembro[]) || [];
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      return [];
    }
  }, []);

  const addMembros = useCallback(async (listaId: string, contatoIds: string[]) => {
    try {
      const records = contatoIds.map(contatoId => ({
        lista_id: listaId,
        contato_id: contatoId
      }));

      const { error } = await getSupabase()
        .from('listas_contatos_membros')
        .upsert(records, { onConflict: 'lista_id,contato_id' });

      if (error) throw error;
      toast.success(`${contatoIds.length} contatos adicionados à lista`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar membros:', error);
      toast.error('Erro ao adicionar contatos à lista');
      return false;
    }
  }, []);

  const removeMembros = useCallback(async (listaId: string, membroIds: string[]) => {
    try {
      const { error } = await getSupabase()
        .from('listas_contatos_membros')
        .delete()
        .in('id', membroIds);

      if (error) throw error;
      toast.success('Contatos removidos da lista');
      return true;
    } catch (error) {
      console.error('Erro ao remover membros:', error);
      toast.error('Erro ao remover contatos da lista');
      return false;
    }
  }, []);

  // Importar contatos de uma lista para uma campanha
  const importarParaCampanha = useCallback(async (listaId: string, campanhaId: string) => {
    try {
      const membros = await getMembros(listaId);
      if (membros.length === 0) {
        toast.warning('Lista vazia');
        return false;
      }

      const records = membros
        .filter(m => m.contato)
        .map(m => ({
          campanha_id: campanhaId,
          contato_id: m.contato_id,
          telefone: m.contato!.telefone,
          nome: m.contato!.nome,
          status: 'pendente'
        }));

      const { error } = await getSupabase()
        .from('campanhas_contatos')
        .insert(records);

      if (error) throw error;

      // Atualizar contador
      const { count } = await getSupabase()
        .from('campanhas_contatos')
        .select('id', { count: 'exact' })
        .eq('campanha_id', campanhaId);

      await getSupabase()
        .from('campanhas_whatsapp')
        .update({ total_contatos: count || 0 })
        .eq('id', campanhaId);

      toast.success(`${records.length} contatos importados da lista`);
      return true;
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      toast.error('Erro ao importar contatos da lista');
      return false;
    }
  }, [getMembros]);

  return {
    loading,
    listas,
    fetchListas,
    getLista,
    createLista,
    updateLista,
    deleteLista,
    getMembros,
    addMembros,
    removeMembros,
    importarParaCampanha,
  };
};
