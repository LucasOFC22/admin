import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface Tag {
  id: number;
  name: string;
  color: string;
  kanban: number;
  created_at?: string;
  updated_at?: string;
}

export const tagService = {
  async getTags(kanban?: number): Promise<Tag[]> {
    const supabase = requireAuthenticatedClient();
    let query = supabase.from('tags').select('*').order('name');
    
    if (kanban !== undefined) {
      query = query.eq('kanban', kanban);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async getTagById(id: number): Promise<Tag | null> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async createTag(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('tags')
      .insert([tag])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateTag(id: number, tag: Partial<Tag>): Promise<Tag> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('tags')
      .update({
        ...tag,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteTag(id: number): Promise<void> {
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
};
