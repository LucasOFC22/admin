import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export const useHeaderAuth = () => {
  const navigate = useNavigate();
  const { user, signOut } = useUnifiedAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  const handleAccessClick = () => {
    if (!user) return;
    navigate('/area-cliente/dashboard');
  };

  const handleAdminAccessClick = () => {
    navigate('/');
  };

  const getUserTypeLabel = useMemo(() => {
    if (!user) return 'Usuário';
    
    const hasAdminAccess = user.tipo === 'admin' || user.acesso_area_admin === true;
    const hasClientAccess = user.acessoAreaCliente === true || user.acesso_area_cliente === true;
    
    if (hasAdminAccess && hasClientAccess) {
      return 'Admin/Cliente';
    } else if (hasAdminAccess) {
      return 'Administrador';
    } else if (hasClientAccess) {
      return 'Cliente';
    }
    
    return 'Usuário';
  }, [user]);

  return {
    handleSignOut,
    handleAccessClick,
    handleAdminAccessClick,
    getUserTypeLabel
  };
};