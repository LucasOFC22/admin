import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';
import { documentoStorageService } from '@/services/documentoStorageService';
import type { DocumentoRepositorio, DocumentoFilters } from '@/types/documentos';

const QUERY_KEY = 'meus-documentos';

export const useMeusDocumentos = (filters?: DocumentoFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthState();

  // Query para buscar todos os documentos ativos
  const { data: documentos = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('documentos_repositorio')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (filters?.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DocumentoRepositorio[];
    }
  });

  // Mutation para registrar download
  const registrarDownloadMutation = useMutation({
    mutationFn: async (documentoId: string) => {
      const supabase = requireAuthenticatedClient();
      await supabase.from('documento_downloads').insert({
        documento_id: documentoId,
        usuario_id: user?.id || null,
        cnpj_cpf: user?.cnpjcpf || null,
        user_agent: navigator.userAgent
      });
    }
  });

  // Função para fazer download
  const downloadDocumento = async (documentoId: string, storagePath: string) => {
    try {
      const result = await documentoStorageService.getSignedUrl(storagePath);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Erro ao gerar URL de download');
      }

      // Registra o download
      await registrarDownloadMutation.mutateAsync(documentoId);

      // Abre a URL em nova aba
      window.open(result.url, '_blank');

      toast({
        title: 'Download iniciado',
        description: 'O arquivo será baixado em instantes.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer download',
        variant: 'destructive'
      });
    }
  };

  // Calcula estatísticas
  const stats = {
    total: documentos.length
  };

  return {
    documentos,
    stats,
    isLoading,
    error,
    refetch,
    downloadDocumento,
    isDownloading: registrarDownloadMutation.isPending
  };
};
