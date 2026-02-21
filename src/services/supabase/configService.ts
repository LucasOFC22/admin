import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface SystemConfig {
  id?: number;
  manuntecao: boolean;
  primeiro_login: boolean;
  painel_adm: boolean;
  painel_cliente: boolean;
  n8n_webhook?: string;
  criado_em?: string;
}

export const configService = {
  async getConfig(): Promise<SystemConfig> {
    const supabase = requireAuthenticatedClient();
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .maybeSingle();

    // Se não houver registros, retorna valores padrão sem tratar como erro
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) {
      return {
        manuntecao: false,
        primeiro_login: true,
        painel_adm: true,
        painel_cliente: true,
        n8n_webhook: ''
      };
    }

    return data;
  },

  async saveConfig(config: Omit<SystemConfig, 'id' | 'criado_em'>): Promise<void> {
    const supabase = requireAuthenticatedClient();
    // Primeiro, verifica se já existe uma configuração
    const { data: existing } = await supabase
      .from('config')
      .select('id')
      .maybeSingle();

    let result;
    
    if (existing) {
      // Atualiza configuração existente
      result = await supabase
        .from('config')
        .update(config)
        .eq('id', existing.id);
    } else {
      // Cria nova configuração
      result = await supabase
        .from('config')
        .insert([config]);
    }

    if (result.error) {
      throw new Error(result.error.message);
    }
  }
};