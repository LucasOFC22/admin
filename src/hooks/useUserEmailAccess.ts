import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, REALTIME_ENABLED } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { EmailConta } from '@/types/email';

interface UserEmailAccess {
  hasAccess: boolean;
  loading: boolean;
  accounts: EmailConta[];
  defaultAccountId: string | undefined;
  refetch: () => Promise<void>;
  tableExists: boolean;
}

export function useUserEmailAccess(): UserEmailAccess {
  const { user } = useUnifiedAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<EmailConta[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>();
  const [tableExists, setTableExists] = useState(true);
  
  // Ref para evitar retry infinito quando tabela não existe
  const tableMissingRef = useRef(false);

  const fetchUserEmailAccess = useCallback(async () => {
    // Se já sabemos que a tabela não existe, não tentar novamente
    if (tableMissingRef.current) {
      setHasAccess(false);
      setAccounts([]);
      setDefaultAccountId(undefined);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setHasAccess(false);
      setAccounts([]);
      setDefaultAccountId(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Usar cliente autenticado para enviar JWT
      const client = requireAuthenticatedClient();

      // Nota: user.id já é o id da tabela usuarios (convertido para string no auth service)
      // Buscar vínculos do usuário com contas de email
      const { data: vinculos, error } = await client
        .from('email_conta_usuarios')
        .select(`
          email_conta_id,
          padrao,
          email_conta:email_contas!inner(*)
        `)
        .eq('usuario_id', user.id);

      if (error) {
        // Erro 42P01 = tabela não existe
        if (error.code === '42P01') {
          tableMissingRef.current = true;
          setTableExists(false);
          // Log apenas uma vez, não em loop
          console.warn('[useUserEmailAccess] Tabela email_conta_usuarios não existe. Módulo de email desabilitado.');
        } else {
          console.error('[useUserEmailAccess] Erro ao buscar vínculos:', error);
        }
        setHasAccess(false);
        setAccounts([]);
        setDefaultAccountId(undefined);
        return;
      }

      if (vinculos && vinculos.length > 0) {
        // Extrair contas ativas
        const contasAtivas = vinculos
          .filter((v: any) => v.email_conta?.ativo)
          .map((v: any) => v.email_conta as EmailConta);
        
        // Encontrar conta padrão
        const vinculoPadrao = vinculos.find((v: any) => v.padrao);
        
        setHasAccess(contasAtivas.length > 0);
        setAccounts(contasAtivas);
        setDefaultAccountId(vinculoPadrao?.email_conta_id);
      } else {
        setHasAccess(false);
        setAccounts([]);
        setDefaultAccountId(undefined);
      }
    } catch (err) {
      console.error('[useUserEmailAccess] Erro:', err);
      setHasAccess(false);
      setAccounts([]);
      setDefaultAccountId(undefined);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserEmailAccess();
  }, [fetchUserEmailAccess]);

  // Configurar realtime apenas se habilitado e tabela existir
  useEffect(() => {
    if (!REALTIME_ENABLED || !user?.id || tableMissingRef.current) return;

    const channel = supabase
      .channel(`email-access-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_conta_usuarios',
          filter: `usuario_id=eq.${user.id}`
        },
        () => {
          fetchUserEmailAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserEmailAccess]);

  return {
    hasAccess,
    loading,
    accounts,
    defaultAccountId,
    refetch: fetchUserEmailAccess,
    tableExists
  };
}
