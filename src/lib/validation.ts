/**
 * Utilitários de validação reutilizáveis
 */

/**
 * Valida se uma entidade possui ID válido
 * 
 * @example
 * const notify = useNotification();
 * if (!validateEntity(user, { entityName: 'Usuário', onError: notify.error })) {
 *   return;
 * }
 * // TypeScript agora sabe que user.id existe
 */
export const validateEntity = <T extends { id?: number | string }>(
  entity: T | null | undefined,
  options?: {
    entityName?: string;
    onError?: (message: string) => void;
  }
): entity is T & { id: number | string } => {
  if (!entity?.id) {
    const message = `${options?.entityName || 'Entidade'} inválida`;
    options?.onError?.(message);
    return false;
  }
  return true;
};

/**
 * Valida se um campo de texto não está vazio
 */
export const validateRequired = (
  value: string | null | undefined,
  fieldName: string
): string | null => {
  if (!value?.trim()) {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

/**
 * Valida formato de email
 */
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'E-mail inválido';
  }
  return null;
};

/**
 * Valida múltiplos campos obrigatórios
 * Retorna o primeiro erro encontrado ou null
 */
export const validateRequiredFields = (
  fields: Record<string, string | null | undefined>
): string | null => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const error = validateRequired(value, fieldName);
    if (error) return error;
  }
  return null;
};

/**
 * Valida telefone brasileiro (formato básico)
 */
export const validatePhone = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 11) {
    return 'Telefone inválido';
  }
  return null;
};

/**
 * Valida CPF (dígitos verificadores)
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

/**
 * Valida CNPJ (dígitos verificadores)
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(13))) return false;

  return true;
};
