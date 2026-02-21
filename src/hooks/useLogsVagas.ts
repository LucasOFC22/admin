import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useAuth } from '@/contexts/AuthContext';

interface LogVagaData {
  tipo_de_acao: 'criar' | 'editar' | 'excluir' | 'ativar' | 'desativar';
  vaga_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
}

export const useLogsVagas = () => {
  const { user } = useAuth();

  const registrarLog = async (data: LogVagaData) => {
    if (!user?.id) {
      console.warn('Usuário não autenticado para registrar log');
      return;
    }

    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('logs_vagas')
        .insert({
          usuario_id: user.id,
          tipo_de_acao: data.tipo_de_acao,
          vaga_id: data.vaga_id || null,
          dados_anteriores: data.dados_anteriores || null,
          dados_novos: data.dados_novos || null,
          ip_address: null, // Preenchido pelo backend se disponível
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Erro ao registrar log de vaga:', error);
      }
    } catch (err) {
      console.error('Falha ao registrar log de vaga:', err);
    }
  };

  return { registrarLog };
};
