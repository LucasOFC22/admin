import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface SolicitacaoAcesso {
  id?: string;
  nome: string;
  empresa?: string;
  email: string;
  telefone?: string;
  cnpj?: string;
  cargo?: string;
  motivo?: string;
  source?: string;
  timestamp?: Date;
}

export const solicitacaoAcessoService = {
  async criarSolicitacao(data: Omit<SolicitacaoAcesso, 'id' | 'timestamp'>): Promise<SolicitacaoAcesso> {
    try {
      const supabase = requireAuthenticatedClient();
      const solicitacaoData = {
        ...data,
        source: data.source || 'client_access_form',
        timestamp: new Date()
      };

      const { data: result, error } = await supabase
        .from('solicitacao_de_acesso')
        .insert([solicitacaoData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar solicitação:', error);
        throw new Error(`Erro ao registrar solicitação: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Erro no serviço de solicitação:', error);
      throw error;
    }
  },

  async listarSolicitacoes(): Promise<SolicitacaoAcesso[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('solicitacao_de_acesso')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erro ao listar solicitações:', error);
        throw new Error(`Erro ao buscar solicitações: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar solicitações:', error);
      throw error;
    }
  },

  async buscarPorId(id: string): Promise<SolicitacaoAcesso | null> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('solicitacao_de_acesso')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erro ao buscar solicitação:', error);
        throw new Error(`Erro ao buscar solicitação: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar solicitação:', error);
      throw error;
    }
  }
};
