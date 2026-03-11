// Security configuration and validation
import { configService } from '@/services/configService';

interface SecurityValidation {
  isSecure: boolean;
  warnings: string[];
}

export class SecurityConfig {
  private static instance: SecurityConfig;
  
  private constructor() {}
  
  static getInstance(): SecurityConfig {
    if (!SecurityConfig.instance) {
      SecurityConfig.instance = new SecurityConfig();
    }
    return SecurityConfig.instance;
  }

  private async getConfigValue(key: string): Promise<string> {
    const config = await configService.loadConfig();
    return config[key as keyof typeof config] || '';
  }
  
  async validateProductionSecurity(): Promise<SecurityValidation> {
    const warnings: string[] = [];
    let isSecure = true;
    
    const encryptionKey = await this.getConfigValue('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length < 32) {
      warnings.push('ENCRYPTION_KEY not configured or too short - configure in Lovable Secrets');
      isSecure = false;
    }
    
    const sessionSecret = await this.getConfigValue('SESSION_SECRET');
    if (!sessionSecret || sessionSecret.length < 32) {
      warnings.push('SESSION_SECRET not configured or too short - configure in Lovable Secrets');
      isSecure = false;
    }
    
    const tokenSalt = await this.getConfigValue('TOKEN_SALT');
    if (!tokenSalt || tokenSalt.length < 16) {
      warnings.push('TOKEN_SALT not configured or too short - configure in Lovable Secrets');
      isSecure = false;
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      warnings.push('SUPABASE_URL not configured');
      isSecure = false;
    }
    
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseKey) {
      warnings.push('SUPABASE_ANON_KEY not configured');
      isSecure = false;
    }
    
    return { isSecure, warnings };
  }
  
  generateSecureKey(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }
  
  async logSecurityStatus(): Promise<void> {
    // Silenced for security
    return;
  }
}

export const securityConfig = SecurityConfig.getInstance();

if (import.meta.env.MODE === 'development') {
  securityConfig.logSecurityStatus();
}
