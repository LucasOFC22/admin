import { useQuery } from '@tanstack/react-query';
import { ocorrenciaLogService, OcorrenciaLog } from '@/services/ocorrenciaLogService';

export const useOcorrenciaLogs = (ocorrenciaId: string) => {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['ocorrencia-logs', ocorrenciaId],
    queryFn: () => ocorrenciaLogService.getLogs(ocorrenciaId),
    enabled: !!ocorrenciaId
  });

  return {
    logs,
    isLoading,
    error
  };
};
