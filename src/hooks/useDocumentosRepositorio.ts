import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';
import { documentoStorageService } from '@/services/documentoStorageService';
import type {
  DocumentoRepositorio,
  CreateDocumentoData,
  UpdateDocumentoData,
  DocumentoFilters
} from '@/types/documentos';

const QUERY_KEY = 'documentos-repositorio';

export const useDocumentosRepositorio = (filters?: DocumentoFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthState();

  // Query para buscar documentos
  const { data: documentos = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('documentos_repositorio')
        .select(`
          *,
          criador:usuarios!documentos_repositorio_criado_por_fkey(id, nome)
        `)
        .order('criado_em', { ascending: false });

      if (typeof filters?.ativo === 'boolean') {
        query = query.eq('ativo', filters.ativo);
      }
      if (filters?.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DocumentoRepositorio[];
    }
  });

  // Query para contar downloads
  const { data: stats } = useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      const { data: downloads } = await supabase
        .from('documento_downloads')
        .select('documento_id');

      const downloadsMap: Record<string, number> = {};

      downloads?.forEach(d => {
        downloadsMap[d.documento_id] = (downloadsMap[d.documento_id] || 0) + 1;
      });

      return { downloads: downloadsMap };
    }
  });

  // Mutation para criar documento
  const createMutation = useMutation({
    mutationFn: async ({ data, file }: { data: CreateDocumentoData; file: File }) => {
      const supabase = requireAuthenticatedClient();
      // Primeiro cria o registro no banco para obter o ID
      const { data: documento, error: dbError } = await supabase
        .from('documentos_repositorio')
        .insert({
          ...data,
          criado_por: user?.id || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Faz o upload do arquivo
      const uploadResult = await documentoStorageService.uploadDocumento(
        file,
        documento.id
      );

      if (!uploadResult.success) {
        // Se falhar o upload, deleta o registro do banco
        await supabase.from('documentos_repositorio').delete().eq('id', documento.id);
        throw new Error(uploadResult.error || 'Erro no upload do arquivo');
      }

      // Atualiza o registro com o path do storage
      const { error: updateError } = await supabase
        .from('documentos_repositorio')
        .update({ storage_path: uploadResult.path })
        .eq('id', documento.id);

      if (updateError) throw updateError;

      return documento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Sucesso',
        description: 'Documento criado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar documento',
        variant: 'destructive'
      });
    }
  });

  // Mutation para atualizar documento
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentoData }) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('documentos_repositorio')
        .update({
          ...data,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Sucesso',
        description: 'Documento atualizado com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar documento',
        variant: 'destructive'
      });
    }
  });

  // Mutation para deletar documento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = requireAuthenticatedClient();
      // Deleta todos os arquivos do storage
      await documentoStorageService.deleteAllVersions(id);

      // Deleta o registro (cascade deleta downloads)
      const { error } = await supabase
        .from('documentos_repositorio')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Sucesso',
        description: 'Documento excluído com sucesso!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir documento',
        variant: 'destructive'
      });
    }
  });

  // Mutation para toggle ativo
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('documentos_repositorio')
        .update({ ativo, atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'Sucesso',
        description: `Documento ${ativo ? 'ativado' : 'desativado'} com sucesso!`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status',
        variant: 'destructive'
      });
    }
  });

  // Enriquece os documentos com as contagens
  const documentosEnriquecidos = documentos.map(doc => ({
    ...doc,
    downloads_count: stats?.downloads[doc.id] || 0
  }));

  return {
    documentos: documentosEnriquecidos,
    isLoading,
    error,
    refetch,
    createDocumento: createMutation.mutateAsync,
    updateDocumento: updateMutation.mutateAsync,
    deleteDocumento: deleteMutation.mutateAsync,
    toggleAtivo: toggleAtivoMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
