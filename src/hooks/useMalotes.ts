import { useState, useEffect, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Malote, maloteFromSupabase, maloteToSupabase, viagemToSupabase, valeViagemItemToSupabase } from '@/types/malote';
import { backendService } from '@/services/api/backendService';
import { logService } from '@/services/logger/logService';

export const useMalotes = () => {
  const [malotes, setMalotes] = useState<Malote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMalotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar malotes
      const { data: malotesData, error: malotesError } = await supabase
        .from('malotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (malotesError) throw malotesError;

      // Buscar viagens e itens de vale viagem de todos os malotes
      const maloteIds = malotesData?.map(m => m.id) || [];
      
      const [viagensResult, valeViagemItensResult] = await Promise.all([
        supabase
          .from('malote_viagens')
          .select('*')
          .in('malote_id', maloteIds.length > 0 ? maloteIds : ['']),
        supabase
          .from('malote_vale_viagem_itens')
          .select('*')
          .in('malote_id', maloteIds.length > 0 ? maloteIds : [''])
      ]);

      if (viagensResult.error) throw viagensResult.error;
      if (valeViagemItensResult.error) throw valeViagemItensResult.error;

      // Mapear viagens e itens de vale viagem para cada malote
      const malotesFormatted = (malotesData || []).map(m => {
        const viagens = (viagensResult.data || []).filter(v => v.malote_id === m.id);
        const valeViagemItens = (valeViagemItensResult.data || []).filter(v => v.malote_id === m.id);
        return maloteFromSupabase(m, viagens, valeViagemItens);
      });

      setMalotes(malotesFormatted);
    } catch (error) {
      console.error('Erro ao buscar malotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMalotes();
  }, [fetchMalotes]);

  const getMalote = useCallback((id: string) => {
    return malotes.find(m => m.id === id);
  }, [malotes]);

  const addMalote = async (maloteData: Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>) => {
    try {
      const supabase = requireAuthenticatedClient();
      const supabaseData = maloteToSupabase(maloteData);
      
      // Inserir malote
      const { data: newMalote, error: maloteError } = await supabase
        .from('malotes')
        .insert(supabaseData)
        .select()
        .single();

      if (maloteError) throw maloteError;

      // Inserir viagens e itens de vale viagem em paralelo
      const promises = [];
      
      if (maloteData.viagens.length > 0) {
        const viagensData = maloteData.viagens.map(v => viagemToSupabase(v, newMalote.id));
        promises.push(supabase.from('malote_viagens').insert(viagensData));
      }

      if (maloteData.valeViagemItens && maloteData.valeViagemItens.length > 0) {
        const itensData = maloteData.valeViagemItens.map(item => valeViagemItemToSupabase(item, newMalote.id));
        promises.push(supabase.from('malote_vale_viagem_itens').insert(itensData));
      }

      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Log da criação
      await logService.logMalote({
        tipo_de_acao: 'criar',
        malote_id: newMalote.id,
        dados_novos: {
          motorista: maloteData.motorista,
          tipoCaminhao: maloteData.tipoCaminhaoNome,
          viagens: maloteData.viagens.length,
          valeViagemItens: maloteData.valeViagemItens?.length || 0
        }
      });

      await fetchMalotes();
      return newMalote.id;
    } catch (error) {
      console.error('Erro ao criar malote:', error);
      throw error;
    }
  };

  const updateMalote = async (id: string, maloteData: Omit<Malote, 'id' | 'createdAt' | 'updatedAt' | 'assinado'>) => {
    try {
      const supabase = requireAuthenticatedClient();
      // Verificar se está assinado
      const malote = getMalote(id);
      if (malote?.assinado) {
        throw new Error('Malote já assinado não pode ser editado');
      }

      const dadosAnteriores = malote ? {
        motorista: malote.motorista,
        tipoCaminhao: malote.tipoCaminhaoNome,
        viagens: malote.viagens.length,
        valeViagemItens: malote.valeViagemItens?.length || 0
      } : undefined;

      const supabaseData = maloteToSupabase(maloteData);
      
      // Atualizar malote
      const { error: maloteError } = await supabase
        .from('malotes')
        .update(supabaseData)
        .eq('id', id);

      if (maloteError) throw maloteError;

      // Deletar viagens e itens antigos em paralelo
      await Promise.all([
        supabase.from('malote_viagens').delete().eq('malote_id', id),
        supabase.from('malote_vale_viagem_itens').delete().eq('malote_id', id)
      ]);

      // Inserir novos em paralelo
      const insertPromises = [];

      if (maloteData.viagens.length > 0) {
        const viagensData = maloteData.viagens.map(v => viagemToSupabase(v, id));
        insertPromises.push(supabase.from('malote_viagens').insert(viagensData));
      }

      if (maloteData.valeViagemItens && maloteData.valeViagemItens.length > 0) {
        const itensData = maloteData.valeViagemItens.map(item => valeViagemItemToSupabase(item, id));
        insertPromises.push(supabase.from('malote_vale_viagem_itens').insert(itensData));
      }

      const results = await Promise.all(insertPromises);
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Log da atualização
      await logService.logMalote({
        tipo_de_acao: 'editar',
        malote_id: id,
        dados_anteriores: dadosAnteriores,
        dados_novos: {
          motorista: maloteData.motorista,
          tipoCaminhao: maloteData.tipoCaminhaoNome,
          viagens: maloteData.viagens.length,
          valeViagemItens: maloteData.valeViagemItens?.length || 0
        }
      });

      await fetchMalotes();
    } catch (error) {
      console.error('Erro ao atualizar malote:', error);
      throw error;
    }
  };

  const deleteMalote = async (id: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      // Verificar se está assinado
      const malote = getMalote(id);
      if (malote?.assinado) {
        throw new Error('Malote já assinado não pode ser excluído');
      }

      const dadosAnteriores = malote ? {
        motorista: malote.motorista,
        tipoCaminhao: malote.tipoCaminhaoNome,
        viagens: malote.viagens.length
      } : undefined;

      const { error } = await supabase
        .from('malotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log da exclusão
      await logService.logMalote({
        tipo_de_acao: 'excluir',
        malote_id: id,
        dados_anteriores: dadosAnteriores
      });

      await fetchMalotes();
    } catch (error) {
      console.error('Erro ao excluir malote:', error);
      throw error;
    }
  };

  const enviarLinkAssinatura = async (id: string, telefone: string) => {
    // Chamar edge function diretamente para gerar token e enviar via WhatsApp
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase.functions.invoke('enviar-assinatura-malote', {
      body: {
        malote_id: id,
        telefone: telefone.replace(/\D/g, '')
      }
    });

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Erro ao enviar link');
    }

    // Log do envio
    await logService.logMalote({
      tipo_de_acao: 'enviar',
      malote_id: id,
      dados_novos: {
        telefone_destino: telefone,
        tipo_envio: 'link_assinatura'
      }
    });

    await fetchMalotes();
  };

  return {
    malotes,
    isLoading,
    fetchMalotes,
    getMalote,
    addMalote,
    updateMalote,
    deleteMalote,
    enviarLinkAssinatura
  };
};
