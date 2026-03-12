import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface EmpresaConfig {
  id: number;
  nome: string;
  cnpj: string;
}

let cachedEmpresas: EmpresaConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export const empresasConfigService = {
  async getEmpresas(): Promise<EmpresaConfig[]> {
    // Use cache if valid
    if (cachedEmpresas && Date.now() - cacheTimestamp < CACHE_TTL) {
      return cachedEmpresas;
    }

    const client = requireAuthenticatedClient();
    const { data, error } = await client
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'empresas_sistema')
      .maybeSingle();

    if (error) {
      console.error('[empresasConfigService] Erro ao buscar empresas:', error);
      return cachedEmpresas ?? [];
    }

    if (!data?.valor) {
      return [];
    }

    try {
      const empresas: EmpresaConfig[] = JSON.parse(data.valor);
      cachedEmpresas = empresas;
      cacheTimestamp = Date.now();
      return empresas;
    } catch {
      console.error('[empresasConfigService] JSON inválido na configuração de empresas');
      return [];
    }
  },

  async saveEmpresas(empresas: EmpresaConfig[]): Promise<void> {
    const client = requireAuthenticatedClient();
    const valor = JSON.stringify(empresas);

    const { data: existing } = await client
      .from('configuracoes')
      .select('id')
      .eq('chave', 'empresas_sistema')
      .maybeSingle();

    let result;
    if (existing) {
      result = await client
        .from('configuracoes')
        .update({ valor, atualizado_em: new Date().toISOString() })
        .eq('chave', 'empresas_sistema');
    } else {
      result = await client
        .from('configuracoes')
        .insert({ chave: 'empresas_sistema', valor, descricao: 'Lista de empresas do sistema', tipo: 'json' });
    }

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Invalidate cache
    cachedEmpresas = empresas;
    cacheTimestamp = Date.now();
  },

  invalidateCache() {
    cachedEmpresas = null;
    cacheTimestamp = 0;
  }
};
