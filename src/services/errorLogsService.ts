import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface ErrorLogDB {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  pagina?: string;
  nivel: string;
  data_ocorrencia: string;
  dados_extra?: any;
  resolvido: boolean;
  resolvido_em?: string;
  criado_em: string;
  atualizado_em: string;
}

export const getErrorLogs = async () => {
  const supabase = requireAuthenticatedClient();
  const { data, error } = await supabase
    .from('erros')
    .select('*')
    .order('data_ocorrencia', { ascending: false });

  if (error) {
    console.error('Erro ao buscar logs de erros:', error);
    throw error;
  }

  return data as ErrorLogDB[];
};

export const markErrorAsResolved = async (id: string) => {
  const supabase = requireAuthenticatedClient();
  const { error } = await supabase
    .from('erros')
    .update({ 
      resolvido: true,
      resolvido_em: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao marcar erro como resolvido:', error);
    throw error;
  }
};

export const deleteErrorLog = async (id: string) => {
  const supabase = requireAuthenticatedClient();
  const { error } = await supabase
    .from('erros')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar log de erro:', error);
    throw error;
  }
};
