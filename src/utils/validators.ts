// Utilitários de validação e sanitização robusta
import DOMPurify from 'isomorphic-dompurify';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Configurações de validação
export const VALIDATION_LIMITS = {
  // Limites de texto
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  MESSAGE_MAX_LENGTH: 2000,
  DESCRIPTION_MAX_LENGTH: 500,
  ADDRESS_MAX_LENGTH: 200,
  
  // Limites numéricos
  WEIGHT_MAX: 50000, // kg
  DIMENSION_MAX: 1000, // cm
  VALUE_MAX: 999999999, // R$
  
  // Rate limiting
  REQUESTS_PER_MINUTE: 10,
  REQUESTS_PER_HOUR: 100
} as const;

// Sanitização de entrada
export const sanitizeInput = {
  /**
   * Remove tags HTML e caracteres perigosos
   */
  html: (input: string): string => {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    }).trim();
  },

  /**
   * Sanitiza entrada de texto permitindo apenas caracteres alfanuméricos e pontuação básica
   */
  text: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>'"&]/g, '') // Remove caracteres perigosos
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim()
      .substring(0, VALIDATION_LIMITS.MESSAGE_MAX_LENGTH);
  },

  /**
   * Sanitiza números removendo caracteres não numéricos
   */
  numeric: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^\d.,]/g, '');
  },

  /**
   * Sanitiza telefone mantendo apenas números, parênteses e hífen
   */
  phone: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^\d\(\)\-\s]/g, '');
  },

  /**
   * Sanitiza email removendo caracteres perigosos
   */
  email: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.toLowerCase().trim().replace(/[<>'"&]/g, '');
  }
};

// Validadores específicos
export const validators = {
  /**
   * Valida CPF
   */
  cpf: (cpf: string): boolean => {
    if (typeof cpf !== 'string') return false;
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos dígitos iguais
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10) firstDigit = 0;
    
    if (firstDigit !== parseInt(cleanCPF[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10) secondDigit = 0;
    
    return secondDigit === parseInt(cleanCPF[10]);
  },

  /**
   * Valida CNPJ
   */
  cnpj: (cnpj: string): boolean => {
    if (typeof cnpj !== 'string') return false;
    
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false; // CNPJ com todos dígitos iguais
    
    // Validação dos dígitos verificadores
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    if (firstDigit !== parseInt(cleanCNPJ[12])) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return secondDigit === parseInt(cleanCNPJ[13]);
  },

  /**
   * Valida email com regex RFC 5322 compliant
   */
  email: (email: string): boolean => {
    if (typeof email !== 'string') return false;
    if (email.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },

  /**
   * Valida telefone brasileiro
   */
  phone: (phone: string): boolean => {
    if (typeof phone !== 'string') return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  },

  /**
   * Valida CEP brasileiro
   */
  cep: (cep: string): boolean => {
    if (typeof cep !== 'string') return false;
    
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8 && !/^0{8}$/.test(cleanCEP);
  },

  /**
   * Valida dimensões de carga
   */
  dimension: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0 && num <= VALIDATION_LIMITS.DIMENSION_MAX;
  },

  /**
   * Valida peso
   */
  weight: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0 && num <= VALIDATION_LIMITS.WEIGHT_MAX;
  },

  /**
   * Valida valor monetário
   */
  monetaryValue: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value;
    return !isNaN(num) && num >= 0 && num <= VALIDATION_LIMITS.VALUE_MAX;
  }
};

// Rate limiting em memória (em produção usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  /**
   * Verifica se o rate limit foi excedido
   */
  check: (identifier: string, limit: number = VALIDATION_LIMITS.REQUESTS_PER_MINUTE, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const stored = rateLimitStore.get(identifier);
    
    if (!stored || now > stored.resetTime) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (stored.count >= limit) {
      return false;
    }
    
    stored.count++;
    return true;
  },

  /**
   * Limpa entradas antigas do rate limit
   */
  cleanup: (): void => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
};

// Singleton para evitar múltiplos intervalos
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

const startCleanupInterval = () => {
  if (cleanupIntervalId === null) {
    cleanupIntervalId = setInterval(rateLimit.cleanup, 5 * 60 * 1000);
  }
};

// Inicia cleanup apenas uma vez
startCleanupInterval();

// Limpeza em HMR (dev mode)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (cleanupIntervalId !== null) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
  });
}

/**
 * Middleware de validação simples para formulários
 */
export const validateFormData = (
  data: Record<string, any>,
  schema: Record<string, (value: any) => boolean | string>
): { isValid: boolean; errors: Record<string, string>; sanitized: Record<string, any> } => {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    
    try {
      // Sanitizar primeiro
      let sanitizedValue = value;
      if (typeof value === 'string') {
        sanitizedValue = sanitizeInput.text(value);
      }
      
      // Validar
      const result = validator(sanitizedValue);
      
      if (result === true) {
        sanitized[field] = sanitizedValue;
      } else {
        isValid = false;
        errors[field] = typeof result === 'string' ? result : `Campo ${field} inválido`;
      }
    } catch (error) {
      isValid = false;
      errors[field] = `Erro na validação do campo ${field}`;
    }
  }

  return { isValid, errors, sanitized };
};