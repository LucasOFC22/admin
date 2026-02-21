export interface CepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface FormattedAddress {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Remove caracteres não numéricos do CEP
 */
export function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Formata CEP para o padrão 00000-000
 */
export function formatCep(cep: string): string {
  const cleaned = cleanCep(cep);
  if (cleaned.length !== 8) return cep;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

/**
 * Valida se o CEP tem formato válido (8 dígitos)
 */
export function isValidCep(cep: string): boolean {
  const cleaned = cleanCep(cep);
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

/**
 * Busca dados de endereço pelo CEP usando a API ViaCEP
 */
export async function fetchAddressByCep(cep: string): Promise<FormattedAddress | null> {
  const cleaned = cleanCep(cep);
  
  if (!isValidCep(cleaned)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: CepAddress = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}
