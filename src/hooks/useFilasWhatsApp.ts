import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface FilaWhatsApp {
  id: number;
  name: string;
  color?: string;
  description?: string;
}

export const useFilasWhatsApp = () => {
  const [filas, setFilas] = useState<FilaWhatsApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilas = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = requireAuthenticatedClient();
        const { data, error: fetchError } = await supabase
          .from('filas_whatsapp')
          .select('id, name, color, description')
          .eq('active', true)
          .order('order_position', { ascending: true });

        if (fetchError) {
          console.error('Erro ao buscar filas:', fetchError);
          setError(fetchError.message);
          return;
        }

        setFilas(data || []);
      } catch (err) {
        console.error('Erro ao buscar filas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchFilas();
  }, []);

  return { filas, loading, error };
};
