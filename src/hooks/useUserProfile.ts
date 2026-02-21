import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface UserProfile {
  id?: string;
  supabase_id?: string;
  nome?: string;
  email?: string;
  tipo?: string;
  cargo?: string;
  telefone?: string;
  empresa?: string;
  data_criacao?: string;
  data_ultima_atividade?: string;
  ativo?: boolean;
  som?: boolean;
  acesso_area_cliente?: boolean;
  acesso_area_admin?: boolean;
}

export const useUserProfile = () => {
  const { user, refreshAuth } = useUnifiedAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = requireAuthenticatedClient();
      // Buscar dados atualizados do banco
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }

      if (data) {
        setUserProfile({
          id: String(data.id),
          supabase_id: data.supabase_id,
          nome: data.nome,
          email: data.email,
          tipo: data.tipo || 'user',
          cargo: data.cargo,
          telefone: data.telefone,
          empresa: data.empresa,
          data_criacao: data.data_criacao,
          data_ultima_atividade: data.data_ultima_atividade,
          ativo: data.ativo,
          som: data.som,
          acesso_area_cliente: data.acesso_area_cliente,
          acesso_area_admin: data.acesso_area_admin
        });
      } else {
        // Fallback para dados do contexto
        setUserProfile({
          id: String(user.id || user.email),
          nome: user.nome || user.displayName,
          email: user.email,
          tipo: user.tipo || 'user',
          cargo: user.cargo,
          telefone: user.telefone,
          data_criacao: user.data_criacao,
          data_ultima_atividade: user.data_ultima_atividade,
          ativo: user.ativo,
          som: user.som,
          acesso_area_cliente: user.acesso_area_cliente,
          acesso_area_admin: user.acesso_area_admin
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const getDisplayName = () => {
    if (!userProfile) return 'Usuário';
    return userProfile.nome || 
           (userProfile.email ? userProfile.email.split('@')[0] : 'Usuário');
  };

  const getUserRole = () => {
    if (!userProfile) return 'Usuário';
    
    const role = userProfile.tipo || 'user';
    
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Usuário';
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: updates.nome !== undefined ? updates.nome : userProfile.nome,
          telefone: updates.telefone !== undefined ? updates.telefone : userProfile.telefone,
          som: updates.som !== undefined ? updates.som : userProfile.som,
          data_ultima_atividade: new Date().toISOString()
        })
        .eq('email', user.email);

      if (error) throw error;

      // Atualizar estado local
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);

      // Atualizar contexto de auth
      if (refreshAuth) {
        await refreshAuth();
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    userProfile,
    getDisplayName,
    getUserRole,
    isLoaded: !isLoading && !!userProfile,
    isLoading,
    updateProfile,
    changePassword,
    refreshProfile: loadUserProfile
  };
};
