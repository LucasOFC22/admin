// Tipos para a estrutura JSONB de CNPJ/CPF

export interface CnpjCpfData {
  cnpjcpf: string[];      // Array de CNPJ/CPF disponíveis
  cnpjcpf_atual: string;  // CNPJ/CPF atualmente selecionado
}

// Função para normalizar dados legados (array) para o novo formato (objeto)
export function normalizeCnpjCpfData(data: unknown): CnpjCpfData | null {
  // Caso 1: Já é um objeto no novo formato
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if ('cnpjcpf' in obj && Array.isArray(obj.cnpjcpf)) {
      const cnpjcpfArray = (obj.cnpjcpf as unknown[]).filter((item): item is string => typeof item === 'string' && item.length > 0);
      const cnpjcpfAtual = typeof obj.cnpjcpf_atual === 'string' ? obj.cnpjcpf_atual : cnpjcpfArray[0] || '';
      
      return {
        cnpjcpf: cnpjcpfArray,
        cnpjcpf_atual: cnpjcpfArray.includes(cnpjcpfAtual) ? cnpjcpfAtual : cnpjcpfArray[0] || ''
      };
    }
  }
  
  // Caso 2: Array legado - converter para novo formato
  if (Array.isArray(data)) {
    const cnpjcpfArray = data.filter((item): item is string => typeof item === 'string' && item.length > 0);
    if (cnpjcpfArray.length > 0) {
      return {
        cnpjcpf: cnpjcpfArray,
        cnpjcpf_atual: cnpjcpfArray[0]
      };
    }
  }
  
  return null;
}

// Função auxiliar para extrair apenas os CNPJs/CPFs disponíveis
export function extractCnpjCpfArray(data: unknown): string[] {
  const normalized = normalizeCnpjCpfData(data);
  return normalized?.cnpjcpf || [];
}

// Função auxiliar para extrair o CNPJ/CPF atual
export function extractCnpjCpfAtual(data: unknown): string | null {
  const normalized = normalizeCnpjCpfData(data);
  return normalized?.cnpjcpf_atual || null;
}
