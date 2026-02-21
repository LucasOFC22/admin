import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const useUserHierarchy = () => {
  const { user } = useUnifiedAuth();

  const { data: userLevel, isLoading } = useQuery({
    queryKey: ['user-hierarchy', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return 1;
      }

      // Primeiro, verificar se o usuário tem nivel_hierarquico definido diretamente
      if (user.nivel_hierarquico && user.nivel_hierarquico > 0) {
        return user.nivel_hierarquico;
      }

      // Se não tem, buscar do cargo na tabela usuarios
      const client = requireAuthenticatedClient();
      
      const { data: userData, error: userError } = await client
        .from('usuarios')
        .select('cargo, nivel_hierarquico')
        .eq('supabase_id', user.supabase_id)
        .maybeSingle();

      if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', userError);
        return 1;
      }

      // Se tem nivel_hierarquico na tabela, usar ele
      if (userData?.nivel_hierarquico && userData.nivel_hierarquico > 0) {
        return userData.nivel_hierarquico;
      }

      // Caso contrário, buscar do cargo
      if (userData?.cargo) {
        const { data: cargoData, error: cargoError } = await client
          .from('cargos')
          .select('level')
          .eq('id', userData.cargo)
          .maybeSingle();

        if (cargoError) {
          console.error('❌ Erro ao buscar cargo:', cargoError);
          return 1;
        }

        return cargoData?.level || 1;
      }

      return 1;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const canEditCargo = (cargoLevel: number) => {
    const currentLevel = userLevel || 1;
    return currentLevel >= cargoLevel;
  };

  return {
    userLevel: userLevel || 1,
    isLoading,
    canEditCargo,
  };
};
