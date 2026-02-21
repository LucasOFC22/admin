import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface KanbanCategory {
  id: string;
  name: string;
  color: string;
  order_position: number;
  description?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Dados padrão para fallback
const DEFAULT_CATEGORIES: KanbanCategory[] = [
  {
    id: '1',
    name: 'Novo',
    color: '#3B82F6',
    order_position: 1,
    description: 'Mensagens não lidas',
    active: true
  },
  {
    id: '2',
    name: 'Em Atendimento',
    color: '#F59E0B',
    order_position: 2,
    description: 'Conversas em andamento',
    active: true
  },
  {
    id: '3',
    name: 'Aguardando',
    color: '#8B5CF6',
    order_position: 3,
    description: 'Aguardando resposta do cliente',
    active: true
  },
  {
    id: '4',
    name: 'Finalizado',
    color: '#10B981',
    order_position: 4,
    description: 'Atendimento concluído',
    active: true
  }
];

class KanbanWhatsAppService {

  async ensureDefaultQueues(): Promise<void> {
    // Método mantido para compatibilidade, mas não cria mais filas automaticamente
    // As filas devem ser criadas manualmente pelo usuário
  }

  async getCategories(): Promise<KanbanCategory[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('filas_whatsapp')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return DEFAULT_CATEGORIES;
      }

      return data || DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('Erro no serviço getCategories:', error);
      return DEFAULT_CATEGORIES;
    }
  }

  async createCategory(category: Omit<KanbanCategory, 'id' | 'created_at' | 'updated_at'>): Promise<KanbanCategory> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('filas_whatsapp')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço createCategory:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<KanbanCategory>): Promise<KanbanCategory> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('filas_whatsapp')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço updateCategory:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('filas_whatsapp')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir categoria:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteCategory:', error);
      throw error;
    }
  }

  async updateCategoriesOrder(categories: { id: string; order_position: number }[]): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const updates = categories.map(cat => 
        supabase
          .from('filas_whatsapp')
          .update({ order_position: cat.order_position })
          .eq('id', cat.id)
      );

      const results = await Promise.all(updates);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Erros ao atualizar ordem:', errors);
        throw new Error('Erro ao atualizar ordem das categorias');
      }
    } catch (error) {
      console.error('Erro no serviço updateCategoriesOrder:', error);
      throw error;
    }
  }

}

export const kanbanWhatsAppService = new KanbanWhatsAppService();
