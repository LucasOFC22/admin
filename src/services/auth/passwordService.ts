/**
 * ✅ SEGURANÇA: Serviço de gerenciamento de senhas com validação robusta
 * Implementa política de senhas fortes e hash seguro
 */

import CryptoJS from 'crypto-js';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'fraca' | 'média' | 'forte' | 'muito forte';
  score: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommon: boolean;
  maxAge?: number; // dias
}

// Política padrão de senha forte
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommon: true,
  maxAge: 90
};

// Lista de senhas comuns a serem bloqueadas
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'admin', 'password123', 'senha', 'senha123'
];

class PasswordService {
  private static instance: PasswordService;

  private constructor() {}

  static getInstance(): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService();
    }
    return PasswordService.instance;
  }

  /**
   * Valida senha de acordo com política de segurança
   */
  validatePassword(
    password: string, 
    policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
  ): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Verificar comprimento mínimo
    if (password.length < policy.minLength) {
      errors.push(`Senha deve ter no mínimo ${policy.minLength} caracteres`);
    } else {
      score += Math.min(password.length * 2, 20);
    }

    // Verificar maiúsculas
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    // Verificar minúsculas
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    // Verificar números
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    } else if (/\d/.test(password)) {
      score += 10;
    }

    // Verificar caracteres especiais
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*...)');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Verificar senhas comuns
    if (policy.preventCommon && this.isCommonPassword(password)) {
      errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
      score = Math.max(0, score - 30);
    }

    // Verificar padrões sequenciais
    if (this.hasSequentialPattern(password)) {
      errors.push('Senha não deve conter padrões sequenciais (123, abc, etc)');
      score = Math.max(0, score - 15);
    }

    // Verificar repetições
    if (this.hasRepeatingChars(password)) {
      score = Math.max(0, score - 10);
    }

    // Bônus por variedade
    const varietyBonus = this.calculateVarietyBonus(password);
    score += varietyBonus;

    // Normalizar score (0-100)
    score = Math.min(100, Math.max(0, score));

    // Determinar força da senha
    let strength: 'fraca' | 'média' | 'forte' | 'muito forte';
    if (score < 30) strength = 'fraca';
    else if (score < 50) strength = 'média';
    else if (score < 75) strength = 'forte';
    else strength = 'muito forte';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score
    };
  }

  /**
   * Hash seguro de senha usando bcrypt-like com múltiplas iterações
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const finalSalt = salt || this.generateSalt();
    
    // Múltiplas iterações de hash para segurança (simula bcrypt)
    let hash = password + finalSalt;
    for (let i = 0; i < 10000; i++) {
      hash = CryptoJS.SHA256(hash + finalSalt + i).toString();
    }
    
    return { hash, salt: finalSalt };
  }

  /**
   * Verifica se senha corresponde ao hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = this.hashPassword(password, salt);
    return computed.hash === hash;
  }

  /**
   * Gera salt único para hash
   */
  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifica se é senha comum
   */
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return COMMON_PASSWORDS.some(common => 
      lowerPassword.includes(common) || common.includes(lowerPassword)
    );
  }

  /**
   * Verifica padrões sequenciais
   */
  private hasSequentialPattern(password: string): boolean {
    const sequences = [
      '0123456789', 'abcdefghijklmnopqrstuvwxyz', 
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
    ];
    
    const lower = password.toLowerCase();
    
    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const pattern = seq.substring(i, i + 3);
        const reversePattern = pattern.split('').reverse().join('');
        if (lower.includes(pattern) || lower.includes(reversePattern)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Verifica caracteres repetidos
   */
  private hasRepeatingChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Calcula bônus por variedade de caracteres
   */
  private calculateVarietyBonus(password: string): number {
    const types = [
      /[a-z]/,
      /[A-Z]/,
      /\d/,
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
    ];
    
    const uniqueTypes = types.filter(type => type.test(password)).length;
    return uniqueTypes * 5;
  }

  /**
   * Gera senha segura aleatória
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += uppercase[array[0] % uppercase.length];
    password += lowercase[array[1] % lowercase.length];
    password += numbers[array[2] % numbers.length];
    password += special[array[3] % special.length];
    
    // Preencher o resto
    for (let i = 4; i < length; i++) {
      password += allChars[array[i] % allChars.length];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Verifica se senha precisa ser rotacionada
   */
  needsRotation(lastChangedDate: Date, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): boolean {
    if (!policy.maxAge) return false;
    
    const daysSinceChange = Math.floor(
      (Date.now() - lastChangedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceChange >= policy.maxAge;
  }
}

export const passwordService = PasswordService.getInstance();
