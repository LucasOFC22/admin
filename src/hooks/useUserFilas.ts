import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Hook que retorna as filas e tags de WhatsApp vinculadas diretamente ao usuário logado
 */
export const useUserFilas = () => {
  const { userProfile } = useUserProfile();
  const [filasPermitidas, setFilasPermitidas] = useState<number[]>([]);
  const [tagsPermitidas, setTagsPermitidas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFilasField, setHasFilasField] = useState(false);
  const [hasTagsField, setHasTagsField] = useState(false);

  useEffect(() => {
    const fetchUserFilasAndTags = async () => {
      if (!userProfile?.id) {
        setFilasPermitidas([]);
        setTagsPermitidas([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const supabase = requireAuthenticatedClient();

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userProfile.id);
        
        let userData;
        let userError;
        
        if (isUUID) {
          const result = await supabase
            .from('usuarios')
            .select('filas, tags')
            .eq('supabase_id', userProfile.id)
            .maybeSingle();
          userData = result.data;
          userError = result.error;
        } else {
          const numericId = parseInt(userProfile.id, 10);
          if (!isNaN(numericId)) {
            const result = await supabase
              .from('usuarios')
              .select('filas, tags')
              .eq('id', numericId)
              .maybeSingle();
            userData = result.data;
            userError = result.error;
          } else {
            console.error('ID de usuário inválido:', userProfile.id);
            setError('ID de usuário inválido');
            setFilasPermitidas([]);
            setTagsPermitidas([]);
            return;
          }
        }

        if (userError) {
          console.error('Erro ao buscar filas/tags do usuário:', userError);
          setError('Erro ao carregar filas e tags do usuário');
          setFilasPermitidas([]);
          setTagsPermitidas([]);
          return;
        }

        const userFilas = userData?.filas;
        const userTags = userData?.tags;
        
        const filasFieldExists = userFilas !== null && userFilas !== undefined;
        const tagsFieldExists = userTags !== null && userTags !== undefined;
        
        setFilasPermitidas(Array.isArray(userFilas) ? userFilas : []);
        setTagsPermitidas(Array.isArray(userTags) ? userTags : []);
        
        setHasFilasField(filasFieldExists);
        setHasTagsField(tagsFieldExists);
      } catch (err) {
        console.error('Erro ao buscar filas/tags do usuário:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setFilasPermitidas([]);
        setTagsPermitidas([]);
        setHasFilasField(false);
        setHasTagsField(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserFilasAndTags();
  }, [userProfile?.id]);

  return {
    filasPermitidas,
    tagsPermitidas,
    isLoading,
    error,
    hasFilasRestriction: hasFilasField && filasPermitidas.length > 0,
    hasTagsRestriction: hasTagsField && tagsPermitidas.length > 0,
  };
};

// Manter alias para retrocompatibilidade temporária
export const useUserCargoFilas = useUserFilas;
