import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { devLog, prodLog } from '@/utils/logger';

export interface Secret {
  id?: number;
  name: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export const secretService = {
  async getSecrets(): Promise<Secret[]> {
    devLog.info('🔍 Buscando secrets do banco...');
    
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('secret')
      .select('*')
      .order('name');

    if (error) {
      prodLog.error(new Error(`Erro ao buscar secrets: ${error.message}`), 'secretService');
      throw error;
    }

    return data || [];
  },

  async saveSecret(secret: Omit<Secret, 'id' | 'created_at' | 'updated_at'>): Promise<Secret> {
    devLog.info('💾 Salvando secret:', secret.name);
    
    const supabase = requireAuthenticatedClient();
    const secretToInsert = {
      name: secret.name,
      value: secret.value
    };

    const { data, error } = await supabase
      .from('secret')
      .insert(secretToInsert)
      .select()
      .single();

    if (error) {
      prodLog.error(new Error(`Erro ao salvar secret: ${error.message}`), 'secretService');
      throw error;
    }

    return data;
  },

  async updateSecret(id: number, secret: Partial<Secret>): Promise<Secret> {
    devLog.info('🔄 Atualizando secret:', id);
    
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('secret')
      .update({
        name: secret.name,
        value: secret.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      prodLog.error(new Error(`Erro ao atualizar secret: ${error.message}`), 'secretService');
      throw error;
    }

    return data;
  },

  async deleteSecret(id: number): Promise<void> {
    devLog.info('🗑️ Deletando secret:', id);
    
    const supabase = requireAuthenticatedClient();
    const { error } = await supabase
      .from('secret')
      .delete()
      .eq('id', id);

    if (error) {
      prodLog.error(new Error(`Erro ao deletar secret: ${error.message}`), 'secretService');
      throw error;
    }
  }
};
