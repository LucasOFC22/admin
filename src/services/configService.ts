import { secretService } from './supabase/secretService';
import { devLog, prodLog } from '@/utils/logger';

export interface AppConfig {
  ENCRYPTION_KEY?: string;
  SESSION_SECRET?: string;
  TOKEN_SALT?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

class ConfigService {
  private config: AppConfig = {};
  private isLoaded = false;

  async loadConfig(): Promise<AppConfig> {
    if (this.isLoaded) {
      return this.config;
    }

    try {
      const secrets = await secretService.getSecrets();
      
      // Carregar cada configuração dos secrets
      secrets.forEach(secret => {
        switch (secret.name) {
          case 'ENCRYPTION_KEY':
            this.config.ENCRYPTION_KEY = secret.value;
            break;
          case 'SESSION_SECRET':
            this.config.SESSION_SECRET = secret.value;
            break;
          case 'TOKEN_SALT':
            this.config.TOKEN_SALT = secret.value;
            break;
          case 'SUPABASE_URL':
            this.config.SUPABASE_URL = secret.value;
            break;
          case 'SUPABASE_ANON_KEY':
            this.config.SUPABASE_ANON_KEY = secret.value;
            break;
        }
      });

      this.isLoaded = true;
      
    } catch (error) {
      prodLog.error(error as Error, 'configService');
    }

    return this.config;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getSecurityKey(keyName: keyof AppConfig): string | undefined {
    return this.config[keyName];
  }
}

export const configService = new ConfigService();