/**
 * Utilitários para formatação de telefones brasileiros
 * Centraliza todas as funções de telefone do projeto
 */

/**
 * Remove toda formatação e retorna apenas números
 * @example cleanPhone("+55 (11) 99999-9999") => "5511999999999"
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Formata visualmente um número de telefone brasileiro
 * @example formatPhone("5511999999999") => "+55 (11) 99999-9999"
 * @example formatPhone("551122222222") => "+55 (11) 2222-2222"
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length < 10) return cleaned;
  
  // Com código do país (55)
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const ddd = cleaned.substring(2, 4);
    const number = cleaned.substring(4);
    
    // Celular (9 dígitos)
    if (number.length === 9) {
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    
    // Fixo (8 dígitos)
    if (number.length === 8) {
      return `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }
  
  // Sem código de país - 11 dígitos (celular)
  if (cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);
    return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
  }
  
  // Sem código de país - 10 dígitos (fixo)
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);
    return `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
  }
  
  // Formato local sem DDD
  if (cleaned.length <= 9) {
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    }
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
    }
  }
  
  return cleaned;
};

/**
 * Alias para formatPhone com fallback para "Sem telefone"
 * @example formatPhoneNumber(null) => "Sem telefone"
 */
export const formatPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return 'Sem telefone';
  return formatPhone(phone);
};

/**
 * Formata o telefone enquanto o usuário digita (formatação progressiva)
 * Usado em inputs para dar feedback visual em tempo real
 */
export const formatPhoneInput = (value: string): string => {
  const cleaned = cleanPhone(value);
  
  if (cleaned.length === 0) return '';
  
  // Construir formatação progressivamente
  // Código do país
  if (cleaned.length <= 2) {
    return `+${cleaned}`;
  }
  
  // DDD
  if (cleaned.length <= 4) {
    return `+${cleaned.substring(0, 2)} (${cleaned.substring(2)}`;
  }
  
  // Número
  const countryCode = cleaned.substring(0, 2);
  const ddd = cleaned.substring(2, 4);
  const number = cleaned.substring(4);
  
  if (number.length <= 4) {
    return `+${countryCode} (${ddd}) ${number}`;
  }
  
  if (number.length <= 8) {
    return `+${countryCode} (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
  }
  
  // Celular completo (9 dígitos)
  return `+${countryCode} (${ddd}) ${number.substring(0, 5)}-${number.substring(5, 9)}`;
};

/**
 * Valida se é um telefone brasileiro válido
 * Aceita formatos com ou sem código de país
 */
export const isValidBrazilianPhone = (phone: string): boolean => {
  if (!phone) return false;
  
  const cleaned = cleanPhone(phone);
  
  // Com código do país: 12 ou 13 dígitos
  if (cleaned.startsWith('55')) {
    return cleaned.length === 12 || cleaned.length === 13;
  }
  
  // Sem código do país: 10 ou 11 dígitos
  return cleaned.length === 10 || cleaned.length === 11;
};
