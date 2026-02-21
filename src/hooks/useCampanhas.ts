import { useState, useCallback } from 'react';
import { requireAuthenticatedClient, getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { CookieAuth } from '@/lib/auth/cookieAuth';
import { toast } from '@/lib/toast';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

// Helper para extrair detalhes do erro
const extractErrorDetails = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const err = error as any;
    // Erro do Supabase/Postgres
    if (err.code && err.message) {
      return `Código: ${err.code} - ${err.message}${err.details ? ` (${err.details})` : ''}`;
    }
    // Erro padrão JS
    if (err.message) {
      return err.message;
    }
  }
  return 'Erro desconhecido';
};

// Função helper para registrar log de campanha
// (enriquece automaticamente com usuário + snapshot da campanha)
type CampanhaLogSnapshot = {
  nome?: string | null;
  template_name?: string | null;
  conexao_id?: string | null;
  total_contatos?: number | null;
  enviados?: number | null;
  entregues?: number | null;
  lidos?: number | null;
  erros?: number | null;
  status?: string | null;
};

const registrarLogCampanha = async (
  campanhaId: string,
  tipoEvento: string,
  acao: string,
  dadosExtra: Record<string, unknown> = {},
  snapshot?: CampanhaLogSnapshot
) => {
  try {
    // Usar userId do cookie ao invés de supabase.auth.getUser()
    const userId = CookieAuth.getUserId();
    const supabase = getAuthenticatedSupabaseClient();
    
    if (!supabase) {
      console.warn('[useCampanhas] Usuário não autenticado, log não registrado');
      return;
    }

    let campanha = snapshot;
    if (!campanha) {
      const { data } = await supabase
        .from('campanhas_whatsapp')
        .select('nome, template_name, conexao_id, total_contatos, enviados, entregues, lidos, erros, status')
        .eq('id', campanhaId)
        .maybeSingle();

      campanha = (data as any) ?? undefined;
    }

    await supabase.from('logs_campanhas').insert({
      campanha_id: campanhaId,
      usuario_id: userId ?? null,
      conexao_id: (campanha as any)?.conexao_id ?? (dadosExtra as any)?.conexao_id ?? null,
      tipo_evento: tipoEvento,
      acao,
      total_contatos: (campanha as any)?.total_contatos ?? (dadosExtra as any)?.total_contatos ?? 0,
      enviados: (campanha as any)?.enviados ?? (dadosExtra as any)?.enviados ?? 0,
      entregues: (campanha as any)?.entregues ?? (dadosExtra as any)?.entregues ?? 0,
      lidos: (campanha as any)?.lidos ?? (dadosExtra as any)?.lidos ?? 0,
      erros: (campanha as any)?.erros ?? (dadosExtra as any)?.erros ?? 0,
      status_anterior: (dadosExtra as any)?.status_anterior ?? (campanha as any)?.status ?? null,
      template_name: (campanha as any)?.template_name ?? (dadosExtra as any)?.template_name ?? null,
      dados_extra: {
        campanha_nome: (campanha as any)?.nome ?? null,
        template_name: (campanha as any)?.template_name ?? null,
        conexao_id: (campanha as any)?.conexao_id ?? null,
        ...dadosExtra,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
    // Não propagar erro - log é secundário
  }
};

export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  conexao_id: string;
  template_name: string;
  template_language: string;
  header_variables: any[];
  body_variables: any[];
  flow_id: string | null;
  status: 'rascunho' | 'agendada' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada';
  agendado_para: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  total_contatos: number;
  enviados: number;
  entregues: number;
  lidos: number;
  erros: number;
  criado_por: number | null;
  created_at: string;
  updated_at: string;
  conexao?: {
    nome: string;
  };
  flow_builder?: {
    name: string;
  };
}

export interface CreateCampanhaData {
  nome: string;
  descricao?: string;
  conexao_id: string;
  template_name: string;
  template_language?: string;
  header_variables?: any[];
  body_variables?: any[];
  agendado_para?: string;
  criado_por?: number;
  flow_id?: string;
}

export interface CampanhaContato {
  id: string;
  campanha_id: string;
  contato_id: string | null;
  telefone: string;
  nome: string | null;
  status: 'pendente' | 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro' | 'falha';
  message_id: string | null;
  erro_detalhes: string | null;
  enviado_em: string | null;
  entregue_em: string | null;
  lido_em: string | null;
  created_at: string;
}

export const useCampanhas = () => {
  const [loading, setLoading] = useState(false);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  const fetchCampanhas = useCallback(async (filtros?: { status?: string }) => {
    setLoading(true);
    try {
      let query = getSupabase()
        .from('campanhas_whatsapp')
        .select(`
          *,
          conexao:conexoes(nome),
          flow_builder:flow_builders(name)
        `)
        .order('created_at', { ascending: false });

      if (filtros?.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCampanhas((data as any[]) || []);
      return data;
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast.error('Erro ao carregar campanhas', { description: extractErrorDetails(error), duration: 6000 });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCampanha = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase()
        .from('campanhas_whatsapp')
        .select(`
          *,
          conexao:conexoes(nome, whatsapp_phone_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Campanha;
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      toast.error('Erro ao carregar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return null;
    }
  }, []);

  const createCampanha = useCallback(async (data: CreateCampanhaData) => {
    setLoading(true);
    try {
      const { data: campanha, error } = await getSupabase()
        .from('campanhas_whatsapp')
        .insert({
          ...data,
          status: data.agendado_para ? 'agendada' : 'rascunho'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Registrar log de criação
      await registrarLogCampanha(
        campanha.id,
        'campanha_criada',
        `Campanha "${campanha.nome}" criada`,
        { template_name: campanha.template_name, conexao_id: campanha.conexao_id },
        campanha
      );
      
      toast.success('Campanha criada com sucesso!');
      return campanha;
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampanha = useCallback(async (id: string, data: Partial<CreateCampanhaData>) => {
    setLoading(true);
    try {
      // Buscar dados antes da atualização para log
      const { data: campanhaAntes } = await getSupabase()
        .from('campanhas_whatsapp')
        .select('nome, template_name')
        .eq('id', id)
        .single();

      const { data: campanha, error } = await getSupabase()
        .from('campanhas_whatsapp')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Registrar log de edição
      await registrarLogCampanha(
        id,
        'campanha_editada',
        `Campanha "${campanha.nome}" editada`,
        {
          campos_alterados: Object.keys(data),
          nome_anterior: campanhaAntes?.nome,
          template_name: (campanha as any)?.template_name,
          conexao_id: (campanha as any)?.conexao_id,
        },
        campanha
      );
      
      toast.success('Campanha atualizada!');
      return campanha;
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampanha = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Buscar dados da campanha antes de excluir para log
      const { data: campanha } = await getSupabase()
        .from('campanhas_whatsapp')
        .select('nome, template_name, conexao_id, total_contatos, enviados, entregues, lidos, erros, status')
        .eq('id', id)
        .single();

      // Registrar log ANTES de excluir
      // (com campanha_id REAL, e snapshot completo)
      await registrarLogCampanha(
        id,
        'campanha_excluida',
        `Campanha "${campanha?.nome}" excluída`,
        { status_anterior: campanha?.status },
        campanha ?? undefined
      );


      const { error } = await getSupabase()
        .from('campanhas_whatsapp')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Campanha excluída!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicarCampanha = useCallback(async (id: string) => {
    try {
      const original = await getCampanha(id);
      if (!original) return null;

      // Buscar contatos da campanha original diretamente
      const { data: contatosOriginais } = await getSupabase()
        .from('campanhas_contatos')
        .select('*')
        .eq('campanha_id', id);

      const contatos = contatosOriginais || [];

      const { data: nova, error } = await getSupabase()
        .from('campanhas_whatsapp')
        .insert({
          nome: `${original.nome} (Cópia)`,
          descricao: original.descricao,
          conexao_id: original.conexao_id,
          template_name: original.template_name,
          template_language: original.template_language,
          header_variables: original.header_variables,
          body_variables: original.body_variables,
          flow_id: original.flow_id,
          status: 'rascunho',
          total_contatos: contatos.length
        })
        .select()
        .single();

      if (error) throw error;

      // Duplicar contatos para nova campanha
      if (contatos.length > 0) {
        const novosContatos = contatos.map(c => ({
          campanha_id: nova.id,
          contato_id: c.contato_id,
          telefone: c.telefone,
          nome: c.nome,
          status: 'pendente' as const
        }));

        const { error: errorContatos } = await getSupabase()
          .from('campanhas_contatos')
          .insert(novosContatos);

        if (errorContatos) {
          console.error('Erro ao duplicar contatos:', errorContatos);
        }
      }
      
      // Registrar log de duplicação
      await registrarLogCampanha(
        nova.id,
        'campanha_criada',
        `Campanha "${nova.nome}" duplicada a partir de "${original.nome}"`,
        { 
          campanha_original_id: id, 
          campanha_original_nome: original.nome,
          contatos_duplicados: contatos.length
        }
      );
      
      toast.success(`Campanha duplicada com ${contatos.length} contatos!`);
      return nova;
    } catch (error) {
      console.error('Erro ao duplicar campanha:', error);
      toast.error('Erro ao duplicar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return null;
    }
  }, [getCampanha]);

  // Ações de controle da campanha
  // NOTA: Logs de mudança de status são feitos pelos triggers do banco
  const iniciarCampanha = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('whatsapp-campanha-disparar', {
        body: { campanhaId: id, acao: 'iniciar' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Campanha iniciada!');
      return true;
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error);
      toast.error('Erro ao iniciar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  const pausarCampanha = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('whatsapp-campanha-disparar', {
        body: { campanhaId: id, acao: 'pausar' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Campanha pausada');
      return true;
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
      toast.error('Erro ao pausar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  const retomarCampanha = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('whatsapp-campanha-disparar', {
        body: { campanhaId: id, acao: 'retomar' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Campanha retomada!');
      return true;
    } catch (error) {
      console.error('Erro ao retomar campanha:', error);
      toast.error('Erro ao retomar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  const cancelarCampanha = useCallback(async (id: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('whatsapp-campanha-disparar', {
        body: { campanhaId: id, acao: 'cancelar' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Campanha cancelada');
      return true;
    } catch (error) {
      console.error('Erro ao cancelar campanha:', error);
      toast.error('Erro ao cancelar campanha', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  const reenviarContato = useCallback(async (campanhaId: string, contatoId: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('whatsapp-campanha-disparar', {
        body: { campanhaId, contatoId, acao: 'reenviar_contato' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Mensagem reenviada!');
      return true;
    } catch (error) {
      console.error('Erro ao reenviar mensagem:', error);
      toast.error('Erro ao reenviar mensagem', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  // Gerenciar contatos da campanha
  const getContatos = useCallback(async (campanhaId: string, status?: string) => {
    try {
      let query = getSupabase()
        .from('campanhas_contatos')
        .select('*')
        .eq('campanha_id', campanhaId)
        .order('created_at', { ascending: true });

      if (status && status !== 'todos') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as CampanhaContato[]) || [];
    } catch (error) {
      console.error('Erro ao buscar contatos da campanha:', error);
      toast.error('Erro ao buscar contatos', { description: extractErrorDetails(error), duration: 6000 });
      return [];
    }
  }, []);

  const addContatos = useCallback(async (
    campanhaId: string, 
    contatos: { telefone: string; nome?: string; contato_id?: string }[]
  ) => {
    try {
      const records = contatos.map(c => ({
        campanha_id: campanhaId,
        telefone: c.telefone,
        nome: c.nome || null,
        contato_id: c.contato_id || null,
        status: 'pendente'
      }));

      const { error } = await getSupabase()
        .from('campanhas_contatos')
        .insert(records);

      if (error) throw error;

      // Atualizar contador manualmente
      const { count } = await getSupabase()
        .from('campanhas_contatos')
        .select('id', { count: 'exact' })
        .eq('campanha_id', campanhaId);

      await getSupabase()
        .from('campanhas_whatsapp')
        .update({ total_contatos: count || 0 })
        .eq('id', campanhaId);

      // Log de contatos adicionados - incluindo contato_ids
      const contatoIds = contatos.map(c => c.contato_id).filter(Boolean);
      await registrarLogCampanha(
        campanhaId,
        'contatos_adicionados',
        `${contatos.length} contatos adicionados à campanha`,
        { 
          quantidade: contatos.length, 
          total_apos: count,
          contato_ids: contatoIds,
          // Se for apenas 1 contato, popular contato_id no nível principal
          ...(contatoIds.length === 1 ? { contato_id: contatoIds[0] } : {})
        }
      );

      toast.success(`${contatos.length} contatos adicionados`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar contatos:', error);
      toast.error('Erro ao adicionar contatos', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  const removeContatos = useCallback(async (campanhaId: string, contatoIds: string[]) => {
    try {
      const { error } = await getSupabase()
        .from('campanhas_contatos')
        .delete()
        .in('id', contatoIds);

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

      // Log de contatos removidos
      await registrarLogCampanha(
        campanhaId,
        'contatos_removidos',
        `${contatoIds.length} contatos removidos da campanha`,
        { quantidade: contatoIds.length, total_apos: count }
      );

      toast.success('Contatos removidos');
      return true;
    } catch (error) {
      console.error('Erro ao remover contatos:', error);
      toast.error('Erro ao remover contatos', { description: extractErrorDetails(error), duration: 6000 });
      return false;
    }
  }, []);

  return {
    loading,
    campanhas,
    fetchCampanhas,
    getCampanha,
    createCampanha,
    updateCampanha,
    deleteCampanha,
    duplicarCampanha,
    iniciarCampanha,
    pausarCampanha,
    retomarCampanha,
    cancelarCampanha,
    reenviarContato,
    getContatos,
    addContatos,
    removeContatos,
  };
};
