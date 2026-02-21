/**
 * Formatação e validação de documentos (CPF, CNPJ, CEP)
 */

export const formatCPFCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
};

export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers.slice(0, 14);
};

export const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.length === 14;
};

export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

// Interface para resposta da API de CEP
interface CEPResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

/**
 * Busca CEP na API BrasilAPI
 */
export const fetchCEP = async (cep: string): Promise<CEPResponse | null> => {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('CEP não encontrado');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CEPResponse = await response.json();
    
    if (!data.city || !data.neighborhood) {
      console.warn('Resposta da API incompleta');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};
