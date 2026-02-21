/**
 * TokenStore - Armazena o access token exclusivamente em memória (variável JS).
 * 
 * REGRAS:
 * - NUNCA armazenar em localStorage, sessionStorage ou cookies acessíveis.
 * - O token é volátil: ao recarregar a página, é perdido e renovado via refresh.
 * - O refresh token é gerenciado pelo backend via cookie httpOnly (Set-Cookie).
 */

import { devLog } from '@/utils/logger';

export interface TokenData {
  accessToken: string;
  /** Timestamp (ms) em que o token expira */
  expiresAt: number;
}

class TokenStore {
  private tokenData: TokenData | null = null;
  private onTokenExpiredCallback: (() => void) | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Armazena o access token em memória e agenda o callback de expiração.
   * @param accessToken - O JWT de acesso
   * @param expiresIn - Tempo de vida em segundos (ex: 600 = 10 min)
   */
  setToken(accessToken: string, expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000;

    this.tokenData = { accessToken, expiresAt };

    // Agendar callback proativo ~30s antes da expiração
    this.scheduleExpiryWarning(expiresIn);

    devLog.log(`[TokenStore] Token armazenado em memória (expira em ${expiresIn}s)`);
  }

  /**
   * Retorna o access token se ainda válido, ou null se expirado/ausente.
   */
  getToken(): string | null {
    if (!this.tokenData) return null;

    // Considerar expirado com margem de 5s
    if (Date.now() >= this.tokenData.expiresAt - 5000) {
      devLog.log('[TokenStore] Token expirado ou prestes a expirar');
      return null;
    }

    return this.tokenData.accessToken;
  }

  /**
   * Retorna o access token mesmo que expirado (para debug/logging).
   */
  getRawToken(): string | null {
    return this.tokenData?.accessToken || null;
  }

  /**
   * Verifica se existe um token (válido ou não) em memória.
   */
  hasToken(): boolean {
    return !!this.tokenData?.accessToken;
  }

  /**
   * Verifica se o token ainda é válido (não expirado).
   */
  isTokenValid(): boolean {
    if (!this.tokenData) return false;
    return Date.now() < this.tokenData.expiresAt - 5000;
  }

  /**
   * Retorna os segundos restantes até a expiração.
   */
  getTimeToExpiry(): number {
    if (!this.tokenData) return 0;
    const remaining = (this.tokenData.expiresAt - Date.now()) / 1000;
    return Math.max(0, Math.floor(remaining));
  }

  /**
   * Remove o token da memória e cancela timers.
   */
  clearToken(): void {
    this.tokenData = null;
    this.clearExpiryTimer();
    devLog.log('[TokenStore] Token removido da memória');
  }

  /**
   * Registra callback para quando o token estiver prestes a expirar.
   * O callback é chamado ~30s antes da expiração para renovação proativa.
   */
  onTokenExpiring(callback: () => void): void {
    this.onTokenExpiredCallback = callback;
  }

  /**
   * Agenda notificação de expiração iminente.
   */
  private scheduleExpiryWarning(expiresIn: number): void {
    this.clearExpiryTimer();

    // Disparar callback 30s antes da expiração (mínimo 5s)
    const warningTime = Math.max(5, expiresIn - 30) * 1000;

    this.expiryTimer = setTimeout(() => {
      devLog.log('[TokenStore] ⏰ Token expirando em breve, disparando callback...');
      this.onTokenExpiredCallback?.();
    }, warningTime);
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  /**
   * Limpa tudo (usado no logout).
   */
  destroy(): void {
    this.clearToken();
    this.onTokenExpiredCallback = null;
  }
}

/** Singleton global do token store */
export const tokenStore = new TokenStore();
