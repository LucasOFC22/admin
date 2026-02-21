import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useAuthState } from './useAuthState';

export interface SidebarPreferencias {
  id: string;
  usuario_id: string;
  sidebar_expandido: boolean;
  categorias_expandidas: string[];
  scroll_position: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIAS = [
  'principal',
  'operacional',
  'comunicacao',
  'clientes',
  'financeiro',
  'gestao',
  'automacao',
  'monitoramento',
  'logs-modulos'
];

export function useSidebarPreferencias() {
  const { user } = useAuthState();
  const [preferencias, setPreferencias] = useState<SidebarPreferencias | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Partial<SidebarPreferencias> | null>(null);

  // Buscar preferências do usuário
  const fetchPreferencias = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Usar cliente autenticado para enviar JWT
      const client = requireAuthenticatedClient();
      
      const { data, error } = await client
        .from('sidebar_preferencias')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[SidebarPreferencias] Erro ao buscar preferências:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setPreferencias(data as SidebarPreferencias);
      } else {
        // Criar registro padrão se não existir
        const { data: newData, error: insertError } = await client
          .from('sidebar_preferencias')
          .insert({
            usuario_id: user.id,
            sidebar_expandido: true,
            categorias_expandidas: DEFAULT_CATEGORIAS,
            scroll_position: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('[SidebarPreferencias] Erro ao criar preferências:', insertError);
        } else {
          setPreferencias(newData as SidebarPreferencias);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar preferências:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar preferências com debounce (apenas sidebar_expandido e categorias_expandidas)
  const atualizarPreferencias = useCallback(async (updates: Partial<Pick<SidebarPreferencias, 'sidebar_expandido' | 'categorias_expandidas'>>) => {
    if (!preferencias?.id) return;

    // Atualizar estado local imediatamente
    setPreferencias(prev => prev ? { ...prev, ...updates } : prev);

    // Acumular updates pendentes
    pendingUpdateRef.current = {
      ...pendingUpdateRef.current,
      ...updates
    };

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce de 500ms para enviar ao Supabase
    debounceTimerRef.current = setTimeout(async () => {
      if (!pendingUpdateRef.current) return;

      const client = requireAuthenticatedClient();
      const { error } = await client
        .from('sidebar_preferencias')
        .update(pendingUpdateRef.current)
        .eq('id', preferencias.id);

      if (error) {
        console.error('[SidebarPreferencias] Erro ao atualizar:', error);
      }

      pendingUpdateRef.current = null;
    }, 500);
  }, [preferencias?.id]);

  // Toggle sidebar expandido
  const toggleSidebar = useCallback((expandido: boolean) => {
    atualizarPreferencias({ sidebar_expandido: expandido });
  }, [atualizarPreferencias]);

  // Atualizar categorias expandidas
  const atualizarCategorias = useCallback((categorias: string[]) => {
    atualizarPreferencias({ categorias_expandidas: categorias });
  }, [atualizarPreferencias]);

  // Toggle categoria específica
  const toggleCategoria = useCallback((categoriaId: string) => {
    if (!preferencias) return;

    const novasCategorias = preferencias.categorias_expandidas.includes(categoriaId)
      ? preferencias.categorias_expandidas.filter(c => c !== categoriaId)
      : [...preferencias.categorias_expandidas, categoriaId];

    atualizarCategorias(novasCategorias);
  }, [preferencias, atualizarCategorias]);

  // Verificar se categoria está expandida
  const isCategoriaExpandida = useCallback((categoriaId: string) => {
    return preferencias?.categorias_expandidas.includes(categoriaId) ?? true;
  }, [preferencias?.categorias_expandidas]);

  // Buscar preferências ao montar
  useEffect(() => {
    fetchPreferencias();
  }, [fetchPreferencias]);

  // Realtime subscription para sincronizar entre abas
  useEffect(() => {
    if (!preferencias?.id) return;

    const channel = supabase
      .channel('sidebar-preferencias-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sidebar_preferencias',
          filter: `id=eq.${preferencias.id}`
        },
        (payload) => {
          // Só atualizar se não houver updates pendentes locais
          if (!pendingUpdateRef.current) {
            setPreferencias(payload.new as SidebarPreferencias);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [preferencias?.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    preferencias,
    loading,
    toggleSidebar,
    atualizarCategorias,
    toggleCategoria,
    isCategoriaExpandida,
    refetch: fetchPreferencias
  };
}
