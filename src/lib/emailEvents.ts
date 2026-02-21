/**
 * Eventos customizados para sistema de email
 * Permite comunicação entre componentes sem acoplamento direto
 */

export const EMAIL_EVENTS = {
  EMAIL_SENT: 'email:sent',
  EMAIL_RECEIVED: 'email:received',
  LOGS_UPDATED: 'email:logs-updated'
} as const;

/**
 * Dispara evento de email enviado
 * Componentes que enviam email devem chamar esta função após sucesso
 */
export const dispatchEmailSent = () => {
  window.dispatchEvent(new CustomEvent(EMAIL_EVENTS.EMAIL_SENT));
};

/**
 * Hook para ouvir evento de email enviado
 */
export const onEmailSent = (callback: () => void) => {
  window.addEventListener(EMAIL_EVENTS.EMAIL_SENT, callback);
  return () => window.removeEventListener(EMAIL_EVENTS.EMAIL_SENT, callback);
};
