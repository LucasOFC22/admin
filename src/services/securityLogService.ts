/**
 * Serviço de Logging de Segurança
 * Registra eventos críticos de segurança para auditoria
 */
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { centralLogger } from '@/services/logger/centralLogger';

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'login_blocked'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'permission_change'
  | 'role_change'
  | 'config_change'
  | 'sensitive_data_access'
  | 'brute_force_detected'
  | 'suspicious_activity'
  | 'session_expired'
  | 'session_hijack_attempt'
  | 'api_rate_limit'
  | 'unauthorized_access';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface SecurityEvent {
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  description: string;
  metadata?: Record<string, any>;
  resource?: string;
  action?: string;
}

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

class SecurityLogService {
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
  private readonly ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém informações do cliente
   */
  private getClientInfo(): { userAgent: string; ip: string } {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ip: 'client' // IP real precisa ser obtido no servidor
    };
  }

  /**
   * Registra evento de segurança
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const clientInfo = this.getClientInfo();
    const timestamp = new Date().toISOString();

    const logEntry = {
      ...event,
      timestamp,
      ip_address: event.ip_address || clientInfo.ip,
      user_agent: event.user_agent || clientInfo.userAgent
    };

    // Log no console em desenvolvimento
    if (import.meta.env.DEV) {
      const severityColors = {
        low: '\x1b[32m', // verde
        medium: '\x1b[33m', // amarelo
        high: '\x1b[31m', // vermelho
        critical: '\x1b[35m' // magenta
      };
      console.log(
        `${severityColors[event.severity]}[SECURITY] [${event.severity.toUpperCase()}] ${event.event_type}\x1b[0m`,
        logEntry
      );
    }

    // Salvar no banco de dados
    try {
      const client = requireAuthenticatedClient();
      await client.from('security_logs').insert({
        tipo_evento: event.event_type,
        severidade: event.severity,
        usuario_id: event.user_id,
        usuario_email: event.user_email,
        ip_address: logEntry.ip_address,
        user_agent: logEntry.user_agent,
        descricao: event.description,
        recurso: event.resource,
        acao: event.action,
        metadata: event.metadata,
        criado_em: timestamp
      });
    } catch (error) {
      // Fallback para log central se tabela não existir
      await centralLogger.logError('SecurityLogService', 'logSecurityEvent', error as Error, logEntry);
    }

    // Alertar para eventos críticos
    if (event.severity === 'critical' || event.severity === 'high') {
      this.handleCriticalEvent(event);
    }
  }

  /**
   * Trata eventos críticos
   */
  private handleCriticalEvent(event: SecurityEvent): void {
    // Log crítico no sistema central
    centralLogger.logCritical('SecurityLogService', 'handleCriticalEvent', 
      `Evento de segurança crítico: ${event.event_type}`, {
        event,
        alertSent: true
      }
    );
  }

  /**
   * Registra tentativa de login
   */
  async logLoginAttempt(email: string, success: boolean, reason?: string): Promise<boolean> {
    const key = email.toLowerCase();
    const now = Date.now();

    // Obter tentativas existentes
    let attempts = this.loginAttempts.get(key) || [];
    
    // Filtrar tentativas antigas
    attempts = attempts.filter(a => now - a.timestamp < this.ATTEMPT_WINDOW);
    
    // Verificar se está bloqueado
    const failedAttempts = attempts.filter(a => !a.success);
    if (failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      await this.logSecurityEvent({
        event_type: 'login_blocked',
        severity: 'high',
        user_email: email,
        description: `Login bloqueado após ${this.MAX_LOGIN_ATTEMPTS} tentativas falhas`,
        metadata: { failedAttempts: failedAttempts.length, lockoutDuration: this.LOCKOUT_DURATION }
      });
      return false; // Indica que login deve ser bloqueado
    }

    // Adicionar nova tentativa
    attempts.push({ email, timestamp: now, success });
    this.loginAttempts.set(key, attempts);

    // Registrar evento
    if (success) {
      await this.logSecurityEvent({
        event_type: 'login_success',
        severity: 'low',
        user_email: email,
        description: 'Login realizado com sucesso'
      });
    } else {
      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - failedAttempts.length - 1;
      await this.logSecurityEvent({
        event_type: 'login_failed',
        severity: remainingAttempts <= 2 ? 'medium' : 'low',
        user_email: email,
        description: reason || 'Tentativa de login falhou',
        metadata: { remainingAttempts }
      });

      // Detectar possível brute force
      if (failedAttempts.length >= 3) {
        await this.logSecurityEvent({
          event_type: 'brute_force_detected',
          severity: 'high',
          user_email: email,
          description: 'Possível tentativa de brute force detectada',
          metadata: { attempts: failedAttempts.length + 1 }
        });
      }
    }

    return true; // Permite continuar
  }

  /**
   * Verifica se email está bloqueado
   */
  isEmailBlocked(email: string): { blocked: boolean; remainingTime?: number } {
    const key = email.toLowerCase();
    const now = Date.now();
    const attempts = this.loginAttempts.get(key) || [];
    
    const failedAttempts = attempts.filter(a => !a.success && now - a.timestamp < this.ATTEMPT_WINDOW);
    
    if (failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      const oldestAttempt = failedAttempts[0];
      const remainingTime = this.LOCKOUT_DURATION - (now - oldestAttempt.timestamp);
      
      if (remainingTime > 0) {
        return { blocked: true, remainingTime };
      }
    }

    return { blocked: false };
  }

  /**
   * Limpa tentativas após login bem-sucedido
   */
  clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email.toLowerCase());
  }

  /**
   * Registra alteração de permissões
   */
  async logPermissionChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    targetEmail: string,
    changes: Record<string, { from: any; to: any }>
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'permission_change',
      severity: 'medium',
      user_id: adminUserId,
      user_email: adminEmail,
      description: `Permissões alteradas para ${targetEmail}`,
      resource: 'usuarios',
      action: 'update',
      metadata: {
        targetUserId,
        targetEmail,
        changes
      }
    });
  }

  /**
   * Registra alteração de configuração sensível
   */
  async logConfigChange(
    userId: string,
    userEmail: string,
    configType: string,
    changes: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'config_change',
      severity: 'medium',
      user_id: userId,
      user_email: userEmail,
      description: `Configuração alterada: ${configType}`,
      resource: 'configuracoes',
      action: 'update',
      metadata: { configType, changes }
    });
  }

  /**
   * Registra acesso a dados sensíveis
   */
  async logSensitiveDataAccess(
    userId: string,
    userEmail: string,
    resource: string,
    action: string,
    details?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'sensitive_data_access',
      severity: 'low',
      user_id: userId,
      user_email: userEmail,
      description: details || `Acesso a dados sensíveis: ${resource}`,
      resource,
      action
    });
  }

  /**
   * Registra tentativa de acesso não autorizado
   */
  async logUnauthorizedAccess(
    userId: string | undefined,
    userEmail: string | undefined,
    resource: string,
    action: string
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'unauthorized_access',
      severity: 'high',
      user_id: userId,
      user_email: userEmail,
      description: `Tentativa de acesso não autorizado: ${action} em ${resource}`,
      resource,
      action
    });
  }

  /**
   * Registra logout
   */
  async logLogout(userId: string, userEmail: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'logout',
      severity: 'low',
      user_id: userId,
      user_email: userEmail,
      description: 'Logout realizado'
    });
  }

  /**
   * Registra alteração de senha
   */
  async logPasswordChange(userId: string, userEmail: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'password_change',
      severity: 'medium',
      user_id: userId,
      user_email: userEmail,
      description: 'Senha alterada'
    });
  }

  /**
   * Registra solicitação de reset de senha
   */
  async logPasswordResetRequest(email: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'password_reset_request',
      severity: 'low',
      user_email: email,
      description: 'Solicitação de reset de senha'
    });
  }
}

export const securityLogService = new SecurityLogService();
