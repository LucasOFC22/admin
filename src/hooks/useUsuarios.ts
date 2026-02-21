import { useState, useCallback } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { databasePermissionsService } from '@/services/databasePermissionsService';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  cargo?: number;
}

interface UseUsuariosOptions {
  requiredPermission?: string; // Permissão necessária para aparecer na lista
}

export const useUsuarios = (options?: UseUsuariosOptions) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsuarios = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUsuarios([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = requireAuthenticatedClient();
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('id, nome, email, ativo, cargo')
        .eq('ativo', true)
        .ilike('nome', `%${query}%`)
        .limit(50); // Aumentar limite para filtrar depois

      if (fetchError) {
        console.error('Erro ao buscar usuários:', fetchError);
        setError(fetchError.message);
        return;
      }

      let filteredUsers: Usuario[] = (data || []).map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        ativo: u.ativo,
        cargo: u.cargo
      }));

      // Se uma permissão for requerida, filtrar usuários que a possuem
      if (options?.requiredPermission && filteredUsers.length > 0) {
        const usersWithPermission: Usuario[] = [];
        
        for (const user of filteredUsers) {
          if (user.cargo) {
            try {
              const cargoPermissions = await databasePermissionsService.getCargoPermissions(user.cargo);
              if (databasePermissionsService.hasPermission(cargoPermissions, options.requiredPermission)) {
                usersWithPermission.push(user);
              }
            } catch {
              // Se falhar ao buscar permissões, não inclui o usuário
            }
          }
        }
        
        filteredUsers = usersWithPermission;
      }

      setUsuarios(filteredUsers.slice(0, 10)); // Limitar a 10 resultados
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [options?.requiredPermission]);

  const clearUsuarios = useCallback(() => {
    setUsuarios([]);
  }, []);

  return { usuarios, loading, error, searchUsuarios, clearUsuarios };
};
