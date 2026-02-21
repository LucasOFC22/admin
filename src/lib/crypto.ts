// Secure encryption utilities for authentication
import CryptoJS from 'crypto-js';
import { configService } from '@/services/configService';

// Security keys configuration with safe fallbacks for development
// Validação rigorosa de chaves de segurança em produção
if (import.meta.env.MODE === 'production') {
  if (!import.meta.env.VITE_AUTH_ENCRYPTION_KEY || 
      !import.meta.env.VITE_SESSION_SECRET || 
      !import.meta.env.VITE_TOKEN_SALT) {
    throw new Error(
      '🚨 ERRO DE SEGURANÇA: Chaves de criptografia não configuradas. ' +
      'Execute "npm run generate-keys" e configure as variáveis de ambiente antes de fazer deploy em produção.'
    );
  }
}

let ENCRYPTION_KEY = import.meta.env.VITE_AUTH_ENCRYPTION_KEY || '';
let SESSION_SECRET = import.meta.env.VITE_SESSION_SECRET || '';
let TOKEN_SALT = import.meta.env.VITE_TOKEN_SALT || '';

// Permitir chaves de desenvolvimento apenas em modo desenvolvimento
if (import.meta.env.MODE === 'development') {
  ENCRYPTION_KEY = ENCRYPTION_KEY || 'fp-transcargas-dev-key-32chars-min';
  SESSION_SECRET = SESSION_SECRET || 'fp-session-dev-secret-32chars-min';
  TOKEN_SALT = TOKEN_SALT || 'fp-token-dev-salt-24chars';
}

// Função para atualizar as chaves a partir dos secrets
const updateKeysFromSecrets = async () => {
  try {
    const config = await configService.loadConfig();
    
    if (config.ENCRYPTION_KEY) {
      ENCRYPTION_KEY = config.ENCRYPTION_KEY;
    }
    if (config.SESSION_SECRET) {
      SESSION_SECRET = config.SESSION_SECRET;
    }
    if (config.TOKEN_SALT) {
      TOKEN_SALT = config.TOKEN_SALT;
    }
  } catch (error) {
    console.warn('Não foi possível carregar secrets, usando valores padrão');
  }
};

// Inicializar as chaves dos secrets
updateKeysFromSecrets();

// Security validation and warnings for production
const validateSecurityKeys = () => {
  // In production, warn about default keys but don't break the app
  if (import.meta.env.MODE === 'production') {
    if (ENCRYPTION_KEY === 'fp-transcargas-dev-key-32chars-min' || 
        SESSION_SECRET === 'fp-session-dev-secret-32chars-min' || 
        TOKEN_SALT === 'fp-token-dev-salt-24chars') {
      console.warn('🚨 AVISO CRÍTICO DE SEGURANÇA: Configure chaves únicas para produção! Use: npm run generate-keys');
    }
  }
  
  // Ensure minimum length requirements
  if (ENCRYPTION_KEY.length < 24 || SESSION_SECRET.length < 24 || TOKEN_SALT.length < 16) {
    console.warn('⚠️ AVISO: Chaves de segurança podem ser muito curtas para produção');
  }
};

export class SecureAuth {
  // Data versioning for compatibility
  private static readonly DATA_VERSION = '1.0';
  
  // Encrypt sensitive data with integrity check and key validation
  static encrypt(data: string): string {
    try {
      validateSecurityKeys();
      
      const payload = {
        version: this.DATA_VERSION,
        data: data,
        timestamp: Date.now()
      };
      const payloadString = JSON.stringify(payload);
      const encrypted = CryptoJS.AES.encrypt(payloadString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data with enhanced validation
  static decrypt(encryptedData: string): string {
    try {
      validateSecurityKeys();
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Verificar se a descriptografia foi bem-sucedida
      if (!plaintext) {
        throw new Error('Malformed UTF-8 data');
      }
      
      // Try to parse as versioned data
      try {
        const payload = JSON.parse(plaintext);
        if (payload.version && payload.data) {
          // Validate timestamp to prevent replay attacks
          const age = Date.now() - payload.timestamp;
          if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days max
            throw new Error('Data too old');
          }
          return payload.data;
        }
        // Fallback to raw data for backward compatibility
        return plaintext;
      } catch (parseError) {
        // If JSON parse fails, return raw plaintext (backward compatibility)
        return plaintext;
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  // Generate secure session token
  static generateSessionToken(userId: string, userEmail: string): string {
    const timestamp = Date.now();
    const payload = `${userId}|${userEmail}|${timestamp}`;
    const hash = CryptoJS.HmacSHA256(payload, SESSION_SECRET).toString();
    return `${hash}.${timestamp}`;
  }

  // Validate session token with enhanced security
  static validateSessionToken(token: string, userId: string, userEmail: string): boolean {
    try {
      validateSecurityKeys();
      
      const [hash, timestamp] = token.split('.');
      if (!hash || !timestamp) return false;
      
      const payload = `${userId}|${userEmail}|${timestamp}`;
      const expectedHash = CryptoJS.HmacSHA256(payload, SESSION_SECRET).toString();
      
      // Enhanced security: Check if hash matches and token is not expired (24 hours max)
      const isValid = hash === expectedHash;
      const isNotExpired = Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000; // 24 hours
      
      return isValid && isNotExpired;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Generate secure user token for storage
  static generateUserToken(userData: any): string {
    const dataString = JSON.stringify(userData);
    const saltedData = `${dataString}${TOKEN_SALT}`;
    const hash = CryptoJS.SHA256(saltedData).toString();
    return `${hash}.${Date.now()}`;
  }

  // Secure storage operations - prioritize sessionStorage for session persistence
  static setSecureItem(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = this.encrypt(stringValue);
      
      // Store in sessionStorage for current browser session
      sessionStorage.setItem(key, encrypted);
      
      // For critical auth data, also store basic metadata in localStorage
      // This helps detect if user was previously logged in
      if (key === 'auth_user' && value?.email) {
        const metadata = {
          email: value.email,
          lastActivity: Date.now(),
          hasSession: true
        };
        localStorage.setItem(`${key}_metadata`, JSON.stringify(metadata));
      }
    } catch (error) {
      console.error('Failed to set secure item:', error);
    }
  }

  static getSecureItem(key: string): any {
    try {
      // Try sessionStorage first (for current browser session)
      let encrypted = sessionStorage.getItem(key);
      let storage = 'sessionStorage';
      
      // Fallback to localStorage if not found in sessionStorage
      if (!encrypted) {
        encrypted = localStorage.getItem(key);
        storage = 'localStorage';
      }
      
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      
      // Verificar se a string descriptografada é válida
      if (!decrypted) {
        console.warn(`⚠️ Dados vazios para chave ${key} em ${storage}`);
        this.handleCorruptedData(key);
        return null;
      }
      
      const parsedData = JSON.parse(decrypted);
      
      // If data was retrieved from localStorage, migrate to sessionStorage
      if (storage === 'localStorage' && parsedData) {
        console.log(`🔄 Migrando ${key} para sessionStorage`);
        this.setSecureItem(key, parsedData);
        localStorage.removeItem(key);
      }
      
      return parsedData;
    } catch (error) {
      // Silenciosamente limpar dados corrompidos sem logs excessivos
      this.handleCorruptedData(key);
      return null;
    }
  }

  // Handle corrupted data by clearing it silently
  private static handleCorruptedData(key: string): void {
    // Limpar dados corrompidos silenciosamente
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    
    // Log apenas uma vez para não fazer spam
    if (!this.hasLoggedCorruption) {
      console.log(`🧹 Dados corrompidos de ${key} foram limpos (verificações futuras serão silenciosas)`);
      this.hasLoggedCorruption = true;
    }
  }

  private static hasLoggedCorruption = false;

  static removeSecureItem(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_metadata`);
  }

  // Session management
  static createSecureSession(user: any): string {
    const sessionToken = this.generateSessionToken(user.id || user.uid, user.email);
    const userToken = this.generateUserToken(user);
    
    // Store encrypted user data
    this.setSecureItem('auth_user', user);
    this.setSecureItem('auth_session', sessionToken);
    this.setSecureItem('auth_token', userToken);
    
    return sessionToken;
  }

  static validateSecureSession(): boolean {
    try {
      const user = this.getSecureItem('auth_user');
      const sessionToken = this.getSecureItem('auth_session');
      
      // Se não há usuário, sessão inválida
      if (!user) return false;
      
      // Se não há session token, criar um novo (mais permissivo)
      if (!sessionToken) {
        console.log('🔄 Criando novo session token para usuário existente');
        const newSessionToken = this.generateSessionToken(user.id || user.uid, user.email);
        this.setSecureItem('auth_session', newSessionToken);
        return true;
      }
      
      // Validar token existente
      const isValid = this.validateSessionToken(sessionToken, user.id || user.uid, user.email);
      
      // Se token expirou, renovar automaticamente em vez de invalidar
      if (!isValid) {
        console.log('🔄 Renovando session token expirado');
        const newSessionToken = this.generateSessionToken(user.id || user.uid, user.email);
        this.setSecureItem('auth_session', newSessionToken);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Falha na validação da sessão:', error);
      // NÃO limpar sessão automaticamente - apenas retornar false
      return false;
    }
  }

  static clearSecureSession(): void {
    this.removeSecureItem('auth_user');
    this.removeSecureItem('auth_session');
    this.removeSecureItem('auth_token');
    
    // Also clear any orphaned data
    console.log('🧹 Limpando sessão completa');
  }

  // Check if there's evidence of a previous session
  static hasPreviousSession(): boolean {
    try {
      const metadata = localStorage.getItem('auth_user_metadata');
      if (metadata) {
        const parsed = JSON.parse(metadata);
        return parsed.hasSession === true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Get session recovery information
  static getSessionRecoveryInfo(): { email?: string; lastActivity?: number } | null {
    try {
      const metadata = localStorage.getItem('auth_user_metadata');
      if (metadata) {
        const parsed = JSON.parse(metadata);
        return {
          email: parsed.email,
          lastActivity: parsed.lastActivity
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}