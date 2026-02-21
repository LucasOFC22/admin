import { useAuthState } from '@/hooks/useAuthState';
import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface HierarchyControl {
  userLevel: number;
  canCreate: (targetLevel: number) => boolean;
  canEdit: (targetLevel: number) => boolean;
  canDelete: (targetLevel: number) => boolean;
  canViewDetails: (targetLevel: number) => boolean;
  validateLevel: (targetLevel: number, action: 'create' | 'edit' | 'delete' | 'view') => { 
    allowed: boolean; 
    message?: string 
  };
  maxAllowedLevel: number;
  isLoading: boolean;
}

export const useHierarchyControl = (): HierarchyControl => {
  const { user, isAuthenticated } = useAuthState();
  const [userLevel, setUserLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserLevel = async () => {
      try {
        if (!isAuthenticated || !user) {
          setUserLevel(1); // Default para o nível mais baixo
          setIsLoading(false);
          return;
        }

        // Buscar nível do banco de dados Supabase
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('usuarios')
          .select('nivel_hierarquico')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar nível hierárquico:', error);
          setUserLevel(1);
        } else if (data?.nivel_hierarquico) {
          setUserLevel(data.nivel_hierarquico);
        } else {
          setUserLevel(1);
        }
      } catch (error) {
        console.error('Erro ao buscar nível hierárquico:', error);
        setUserLevel(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLevel();
  }, [user?.email, isAuthenticated]);

  const canCreate = (targetLevel: number): boolean => {
    return userLevel >= targetLevel;
  };

  const canEdit = (targetLevel: number): boolean => {
    return userLevel >= targetLevel;
  };

  const canDelete = (targetLevel: number): boolean => {
    return userLevel > targetLevel; // Só pode deletar níveis INFERIORES (números menores)
  };

  const canViewDetails = (targetLevel: number): boolean => {
    return userLevel >= targetLevel;
  };

  const validateLevel = (
    targetLevel: number, 
    action: 'create' | 'edit' | 'delete' | 'view'
  ): { allowed: boolean; message?: string } => {
    if (targetLevel > 10) {
      return {
        allowed: false,
        message: 'O nível máximo permitido é 10 (Administrador).'
      };
    }

    if (targetLevel < 1) {
      return {
        allowed: false,
        message: 'O nível mínimo permitido é 1.'
      };
    }

    switch (action) {
      case 'create':
      case 'edit':
        if (targetLevel > userLevel) {
          return {
            allowed: false,
            message: 'Você não pode atribuir um nível hierárquico acima do seu próprio.'
          };
        }
        break;
      
      case 'delete':
        if (targetLevel >= userLevel) {
          return {
            allowed: false,
            message: 'Você não tem permissão para excluir este registro.'
          };
        }
        break;
      
      case 'view':
        if (targetLevel > userLevel) {
          return {
            allowed: false,
            message: 'Você pode visualizar este usuário apenas na listagem. Detalhes restritos a níveis superiores.'
          };
        }
        break;
    }

    return { allowed: true };
  };

  return {
    userLevel,
    canCreate,
    canEdit,
    canDelete,
    canViewDetails,
    validateLevel,
    maxAllowedLevel: userLevel,
    isLoading
  };
};
