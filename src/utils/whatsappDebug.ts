/**
 * Utilitário centralizado para debug do WhatsApp
 * Ativado via localStorage.debug_whatsapp = '1'
 */

export const isWhatsAppDebugEnabled = (): boolean =>
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.localStorage?.getItem('debug_whatsapp') === '1';

/**
 * Log condicional para debug do WhatsApp
 * Só exibe logs se debug_whatsapp estiver ativado
 */
export const whatsappDebug = (message: string, ...args: unknown[]): void => {
  if (isWhatsAppDebugEnabled()) {
    console.debug(message, ...args);
  }
};
