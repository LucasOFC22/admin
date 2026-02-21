import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface OcorrenciaLogData {
  ocorrencia_id: string;
  usuario_responsavel: number;
  tipo_de_acao: 'status_atualizado' | 'dados_editados' | 'ocorrencia_reaberta' | 'ocorrencia_fechada';
  dados_anteriores: Record<string, any>;
  dados_novos: Record<string, any>;
}

export interface OcorrenciaLog {
  id: string;
  ocorrencia_id: string;
  usuario_responsavel: number;
  tipo_de_acao: string;
  dados_anteriores: Record<string, any>;
  dados_novos: Record<string, any>;
  created_at: string;
  usuario?: {
    nome: string;
    email: string;
  };
}

class OcorrenciaLogService {
  async createLog(data: OcorrenciaLogData): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('logs_ocorrencia')
      .insert({
        ocorrencia_id: data.ocorrencia_id,
        usuario_responsavel: data.usuario_responsavel,
        tipo_de_acao: data.tipo_de_acao,
        dados_anteriores: data.dados_anteriores,
        dados_novos: data.dados_novos,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Erro ao criar log:', error);
      throw error;
    }
  }

  async getLogs(ocorrenciaId: string): Promise<OcorrenciaLog[]> {
    const supabase = requireAuthenticatedClient();
    // Buscar logs primeiro
    const { data: logsData, error: logsError } = await supabase
      .from('logs_ocorrencia')
      .select('*')
      .eq('ocorrencia_id', ocorrenciaId)
      .order('created_at', { ascending: false });
    
    if (logsError) {
      console.error('Erro ao buscar logs:', logsError);
      throw logsError;
    }

    if (!logsData || logsData.length === 0) {
      return [];
    }

    // Buscar usuários separadamente
    const usuarioIds = [...new Set(logsData.map(log => log.usuario_responsavel))];
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', usuarioIds);

    // Criar mapa de usuários
    const usuariosMap = new Map(
      usuariosData?.map(u => [u.id, { nome: u.nome, email: u.email }]) || []
    );

    // Combinar logs com usuários
    return logsData.map(log => ({
      ...log,
      usuario: usuariosMap.get(log.usuario_responsavel)
    })) as OcorrenciaLog[];
  }
}

export const ocorrenciaLogService = new OcorrenciaLogService();
