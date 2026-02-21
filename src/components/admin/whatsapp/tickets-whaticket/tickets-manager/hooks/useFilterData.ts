import { useState, useEffect, useMemo } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Conexao, Usuario } from '../types';
import { UserIdPair } from './useTicketsFilters';

export const useFilterData = () => {
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const { user } = useUnifiedAuth();
  
  // Retorna objeto com ambos os IDs do usuário para compatibilidade de filtros
  const currentUser: UserIdPair | null = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id || null,
      supabase_id: user.supabase_id || null
    };
  }, [user?.id, user?.supabase_id]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const supabase = requireAuthenticatedClient();
        const { data: conexoesData } = await supabase
          .from('conexoes')
          .select('id, nome')
          .order('nome');
        if (conexoesData) setConexoes(conexoesData);

        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, supabase_id, nome')
          .eq('acesso_area_admin', true)
          .eq('ativo', true)
          .order('nome');
        if (usuariosData) setUsuarios(usuariosData);
      } catch (error) {
        console.error('[useFilterData] Error loading filter data:', error);
      }
    };
    loadFilterData();
  }, []);

  return {
    conexoes,
    usuarios,
    currentUser
  };
};
