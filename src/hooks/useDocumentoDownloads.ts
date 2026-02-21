import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import type { DocumentoDownload } from '@/types/documentos';

const QUERY_KEY = 'documento-downloads';

interface DownloadFilters {
  documentoId?: string;
  cnpjCpf?: string;
  startDate?: string;
  endDate?: string;
}

export const useDocumentoDownloads = (filters?: DownloadFilters) => {
  // Query para buscar histórico de downloads
  const { data: downloads = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('documento_downloads')
        .select(`
          *,
          documento:documentos_repositorio(id, titulo, nome_arquivo),
          usuario:usuarios!documento_downloads_usuario_id_fkey(id, nome)
        `)
        .order('baixado_em', { ascending: false })
        .limit(500);

      if (filters?.documentoId) {
        query = query.eq('documento_id', filters.documentoId);
      }
      if (filters?.cnpjCpf) {
        query = query.eq('cnpj_cpf', filters.cnpjCpf);
      }
      if (filters?.startDate) {
        query = query.gte('baixado_em', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('baixado_em', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DocumentoDownload[];
    }
  });

  // Estatísticas de downloads
  const stats = {
    total: downloads.length,
    hoje: downloads.filter(d => {
      const hoje = new Date().toISOString().split('T')[0];
      return d.baixado_em.startsWith(hoje);
    }).length,
    esteMes: downloads.filter(d => {
      const agora = new Date();
      const downloadDate = new Date(d.baixado_em);
      return downloadDate.getMonth() === agora.getMonth() && 
             downloadDate.getFullYear() === agora.getFullYear();
    }).length
  };

  return {
    downloads,
    stats,
    isLoading,
    error,
    refetch
  };
};
