import { useState, useEffect, useCallback, useRef } from 'react';
import { requireAuthenticatedClient, getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { EmailContaUsuario } from '@/types/email';
import { useToast } from '@/hooks/use-toast';

export function useEmailContaUsuarios(usuarioId?: string, enabled: boolean = true) {
  const [vinculos, setVinculos] = useState<EmailContaUsuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const { toast } = useToast();
  
  // Ref para evitar retry infinito quando tabela não existe
  const tableMissingRef = useRef(false);

  const fetchVinculos = useCallback(async () => {
    // Se já sabemos que a tabela não existe, não tentar novamente
    if (tableMissingRef.current) {
      setVinculos([]);
      setLoading(false);
      return;
    }

    if (!usuarioId || !enabled) {
      setVinculos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Usar cliente autenticado para enviar JWT
      const client = requireAuthenticatedClient();
      
      const { data, error: fetchError } = await client
        .from('email_conta_usuarios')
        .select('id, email_conta_id, usuario_id, padrao, created_at')
        .eq('usuario_id', usuarioId);

      if (fetchError) {
        // Erro 42P01 = tabela não existe
        if (fetchError.code === '42P01') {
          tableMissingRef.current = true;
          setTableExists(false);
          // Log apenas uma vez
          console.warn('[useEmailContaUsuarios] Tabela email_conta_usuarios não existe.');
          setVinculos([]);
          return;
        }
        throw fetchError;
      }
      
      setVinculos(data || []);
    } catch (err: any) {
      // Só logar erros que não sejam de tabela inexistente
      if (err?.code !== '42P01') {
        console.error('Erro ao buscar vínculos de email:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [usuarioId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setVinculos([]);
      setLoading(false);
      return;
    }
    fetchVinculos();
  }, [fetchVinculos, enabled]);

  const vincularConta = async (emailContaId: string, padrao: boolean = false): Promise<boolean> => {
    if (!usuarioId || tableMissingRef.current) return false;

    try {
      const client = requireAuthenticatedClient();
      
      // Se marcando como padrão, desmarcar outras
      if (padrao) {
        await client
          .from('email_conta_usuarios')
          .update({ padrao: false })
          .eq('usuario_id', usuarioId);
      }

      const { error: insertError } = await client
        .from('email_conta_usuarios')
        .insert({
          email_conta_id: emailContaId,
          usuario_id: usuarioId,
          padrao
        });

      if (insertError) throw insertError;

      await fetchVinculos();
      
      toast({
        title: 'Sucesso',
        description: 'Conta de email vinculada ao usuário!'
      });

      return true;
    } catch (err: any) {
      console.error('Erro ao vincular conta de email:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao vincular conta de email',
        variant: 'destructive'
      });
      return false;
    }
  };

  const desvincularConta = async (emailContaId: string): Promise<boolean> => {
    if (!usuarioId || tableMissingRef.current) return false;

    try {
      const client = requireAuthenticatedClient();
      
      const { error: deleteError } = await client
        .from('email_conta_usuarios')
        .delete()
        .eq('email_conta_id', emailContaId)
        .eq('usuario_id', usuarioId);

      if (deleteError) throw deleteError;

      setVinculos(prev => prev.filter(v => v.email_conta_id !== emailContaId));
      
      toast({
        title: 'Sucesso',
        description: 'Conta de email desvinculada!'
      });

      return true;
    } catch (err: any) {
      console.error('Erro ao desvincular conta de email:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao desvincular conta de email',
        variant: 'destructive'
      });
      return false;
    }
  };

  const setContaPadrao = async (emailContaId: string): Promise<boolean> => {
    if (!usuarioId || tableMissingRef.current) return false;

    try {
      const client = requireAuthenticatedClient();
      
      // Desmarcar todas como não padrão
      await client
        .from('email_conta_usuarios')
        .update({ padrao: false })
        .eq('usuario_id', usuarioId);

      // Marcar a selecionada como padrão
      const { error: updateError } = await client
        .from('email_conta_usuarios')
        .update({ padrao: true })
        .eq('email_conta_id', emailContaId)
        .eq('usuario_id', usuarioId);

      if (updateError) throw updateError;

      await fetchVinculos();
      
      toast({
        title: 'Sucesso',
        description: 'Conta padrão atualizada!'
      });

      return true;
    } catch (err: any) {
      console.error('Erro ao definir conta padrão:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao definir conta padrão',
        variant: 'destructive'
      });
      return false;
    }
  };

  const atualizarVinculos = async (emailContaIds: string[], contaPadraoId?: string): Promise<boolean> => {
    if (!usuarioId || tableMissingRef.current) return false;

    try {
      const client = requireAuthenticatedClient();
      
      // Buscar vínculos atuais
      const { data: vinculosAtuais } = await client
        .from('email_conta_usuarios')
        .select('email_conta_id')
        .eq('usuario_id', usuarioId);

      const idsAtuais = vinculosAtuais?.map(v => v.email_conta_id) || [];
      
      // Calcular diferença (lógica incremental)
      const paraRemover = idsAtuais.filter(id => !emailContaIds.includes(id));
      const paraAdicionar = emailContaIds.filter(id => !idsAtuais.includes(id));
      const paraAtualizar = emailContaIds.filter(id => idsAtuais.includes(id));

      // Remover vínculos que não estão mais selecionados
      if (paraRemover.length > 0) {
        const { error: deleteError } = await client
          .from('email_conta_usuarios')
          .delete()
          .eq('usuario_id', usuarioId)
          .in('email_conta_id', paraRemover);

        if (deleteError) throw deleteError;
      }

      // Adicionar novos vínculos
      if (paraAdicionar.length > 0) {
        const novos = paraAdicionar.map(contaId => ({
          email_conta_id: contaId,
          usuario_id: usuarioId,
          padrao: contaId === contaPadraoId
        }));

        const { error: insertError } = await client
          .from('email_conta_usuarios')
          .insert(novos);

        if (insertError) throw insertError;
      }

      // Atualizar flag padrao nos existentes
      for (const contaId of paraAtualizar) {
        await client
          .from('email_conta_usuarios')
          .update({ padrao: contaId === contaPadraoId })
          .eq('usuario_id', usuarioId)
          .eq('email_conta_id', contaId);
      }

      await fetchVinculos();
      
      toast({
        title: 'Sucesso',
        description: 'Vínculos de email atualizados!'
      });

      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar vínculos:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao atualizar vínculos',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    vinculos,
    loading,
    error,
    tableExists,
    refetch: fetchVinculos,
    vincularConta,
    desvincularConta,
    setContaPadrao,
    atualizarVinculos
  };
}
