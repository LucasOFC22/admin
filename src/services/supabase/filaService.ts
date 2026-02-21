import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface Fila {
  id: number;
  name: string;
  color: string;
  description?: string;
  order_position: number;
  active: boolean;
}

export const filaService = {
  async getFilas(): Promise<Fila[]> {
    const supabase = requireAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('filas_whatsapp')
      .select('id, name, color, description, order_position, active')
      .eq('active', true)
      .order('order_position', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
};
