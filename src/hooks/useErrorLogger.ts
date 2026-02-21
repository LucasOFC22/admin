import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface ErrorLogData {
  titulo: string;
  descricao: string;
  categoria?: string;
  pagina?: string;
  nivel?: 'info' | 'warning' | 'error' | 'critical';
  dados_extra?: Record<string, unknown>;
}

interface ErrorLogEntry extends ErrorLogData {
  data_ocorrencia: string;
  criado_em: string;
  resolvido: boolean;
}

/**
 * ✅ REFATORAÇÃO: Função centralizada para criar entry de log
 * Elimina duplicação entre hook e função standalone
 */
const createErrorLogEntry = (errorData: ErrorLogData): ErrorLogEntry => {
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
  const now = new Date().toISOString();
  
  return {
    titulo: errorData.titulo,
    descricao: errorData.descricao,
    categoria: errorData.categoria || 'application',
    pagina: errorData.pagina || currentPage,
    nivel: errorData.nivel || 'error',
    data_ocorrencia: now,
    dados_extra: errorData.dados_extra || {},
    resolvido: false,
    criado_em: now
  };
};

/**
 * ✅ REFATORAÇÃO: Função base de logging
 * Centraliza a lógica de inserção no Supabase
 */
const insertErrorLog = async (entry: ErrorLogEntry): Promise<void> => {
  try {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase.from('erros').insert(entry);

    if (error) {
      console.error('Erro ao registrar log de erro:', error);
    }
  } catch (err) {
    console.error('Falha crítica ao registrar erro:', err);
  }
};

/**
 * Hook para uso dentro de componentes React
 */
export const useErrorLogger = () => {
  const logError = async (errorData: ErrorLogData): Promise<void> => {
    const entry = createErrorLogEntry(errorData);
    await insertErrorLog(entry);
  };

  return { logError };
};

/**
 * Função standalone para uso fora de componentes React
 * ✅ REFATORAÇÃO: Agora usa a mesma lógica centralizada
 */
export const logErrorToDatabase = async (errorData: ErrorLogData): Promise<void> => {
  const entry = createErrorLogEntry(errorData);
  await insertErrorLog(entry);
};
