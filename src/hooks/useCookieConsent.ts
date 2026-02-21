import { useCookieStore } from '@/stores/cookieStore';

/**
 * Hook simplificado para gerenciar consentimento de cookies
 */
export const useCookieConsent = () => {
  const store = useCookieStore();

  return {
    // Estado
    hasConsented: store.hasConsented,
    showBanner: store.showBanner,

    // Ações
    acceptCookies: store.acceptCookies,
    hideBanner: store.hideBanner,
    resetConsent: store.resetConsent,
  };
};