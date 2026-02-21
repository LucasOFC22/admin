import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { OcorrenciaHistorico } from '@/types/ocorrencias';

export const useOcorrenciaHistorico = (
  ocorrenciaId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    usuarioId?: number;
  }
) => {
  const { data: historico = [], isLoading, error } = useQuery({
    queryKey: ['ocorrencia-historico', ocorrenciaId, filters],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      // Buscar logs primeiro
      let query = supabase
        .from('logs_ocorrencia')
        .select('*')
        .eq('ocorrencia_id', ocorrenciaId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.usuarioId) {
        query = query.eq('usuario_responsavel', filters.usuarioId);
      }

      const { data: logsData, error } = await query;

      if (error) throw error;

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

      return logsData.map(item => ({
        id: item.id,
        ocorrencia_id: ocorrenciaId,
        usuario_id: item.usuario_responsavel,
        acao: item.tipo_de_acao,
        campo_alterado: undefined,
        valor_anterior: JSON.stringify(item.dados_anteriores),
        valor_novo: JSON.stringify(item.dados_novos),
        created_at: item.created_at,
        usuario: usuariosMap.get(item.usuario_responsavel)
      })) as OcorrenciaHistorico[];
    },
    enabled: !!ocorrenciaId
  });

  return {
    historico,
    isLoading,
    error
  };
};
