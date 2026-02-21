import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Candidatura } from '@/types/candidaturas';

export const useCandidaturas = (vagaId?: number) => {
  return useQuery({
    queryKey: ['candidaturas', vagaId],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('vagas_emprego_candidaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (vagaId) {
        query = query.eq('vaga_id', vagaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Candidatura[];
    },
    enabled: vagaId !== undefined,
  });
};
