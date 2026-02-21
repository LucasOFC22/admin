import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface LogErrosRow {
  id: number;
  titulo: string;
  descricao: string;
  categoria?: string;
  pagina?: string;
  nivel?: 'info' | 'warning' | 'error' | 'critical';
  data_ocorrencia?: string;
  dados_extra?: any;
  resolvido?: boolean;
  resolvido_em?: string;
  criado_em?: string;
}

export interface ErrorLogData {
  titulo: string;
  descricao: string;
  categoria?: string;
  pagina?: string;
  nivel?: 'info' | 'warning' | 'error' | 'critical';
  dados_extra?: any;
}

class ErrorLogService {
  async logError(errorData: ErrorLogData): Promise<boolean> {
    try {
      const currentPage = window.location.pathname;
      const supabase = requireAuthenticatedClient();
      
      const { error } = await supabase
        .from('erros')
        .insert({
          titulo: errorData.titulo,
          descricao: errorData.descricao,
          categoria: errorData.categoria || 'application',
          pagina: errorData.pagina || currentPage,
          nivel: errorData.nivel || 'error',
          data_ocorrencia: new Date().toISOString(),
          dados_extra: errorData.dados_extra || {},
          resolvido: false,
          criado_em: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao salvar log de erro:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro crítico no ErrorLogService:', error);
      return false;
    }
  }

  async getErrorLogs(limit: number = 100): Promise<LogErrosRow[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('erros')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar logs de erro:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro crítico ao buscar logs:', error);
      return [];
    }
  }

  async getErrorsByType(categoria: string): Promise<LogErrosRow[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('erros')
        .select('*')
        .eq('categoria', categoria)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar logs por tipo:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro crítico ao buscar logs por tipo:', error);
      return [];
    }
  }

  async deleteOldLogs(daysOld: number = 30): Promise<boolean> {
    try {
      const supabase = requireAuthenticatedClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('erros')
        .delete()
        .lt('criado_em', cutoffDate.toISOString());

      if (error) {
        console.error('❌ Erro ao deletar logs antigos:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro crítico ao deletar logs antigos:', error);
      return false;
    }
  }
}

export const errorLogService = new ErrorLogService();
