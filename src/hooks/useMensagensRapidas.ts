import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensagensRapidasService, MensagemRapida, CreateMensagemRapidaData } from '@/services/mensagensRapidas/mensagensRapidasService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from '@/lib/toast';

export const useMensagensRapidas = () => {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  const { data: mensagens = [], isLoading, error } = useQuery({
    queryKey: ['mensagens-rapidas'],
    queryFn: () => mensagensRapidasService.listar(),
  });

  const criarMutation = useMutation({
    mutationFn: (data: CreateMensagemRapidaData) => {
      const usuarioId = user?.id || '';
      return mensagensRapidasService.criar(data, usuarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-rapidas'] });
      toast.success('Mensagem rápida criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar mensagem rápida');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMensagemRapidaData> }) => {
      const usuarioId = user?.id || '';
      return mensagensRapidasService.atualizar(id, data, usuarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-rapidas'] });
      toast.success('Mensagem rápida atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar mensagem rápida');
    },
  });

  const deletarMutation = useMutation({
    mutationFn: (id: string) => {
      const usuarioId = user?.id || '';
      return mensagensRapidasService.deletar(id, usuarioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-rapidas'] });
      toast.success('Mensagem rápida deletada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar mensagem rápida');
    },
  });

  const registrarUsoMutation = useMutation({
    mutationFn: ({ mensagemId, enviadoPara }: { mensagemId: string; enviadoPara: string }) => {
      const usuarioId = user?.id || '';
      return mensagensRapidasService.registrarUso(mensagemId, usuarioId, enviadoPara);
    },
  });

  return {
    mensagens,
    isLoading,
    error,
    criar: criarMutation.mutate,
    atualizar: atualizarMutation.mutate,
    deletar: deletarMutation.mutate,
    registrarUso: registrarUsoMutation.mutate,
    isCriando: criarMutation.isPending,
    isAtualizando: atualizarMutation.isPending,
    isDeletando: deletarMutation.isPending,
  };
};
