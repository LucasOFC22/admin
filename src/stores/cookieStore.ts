import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CookieStore {
  showBanner: boolean;
  hasConsented: boolean;
  acceptCookies: () => void;
  hideBanner: () => void;
  resetConsent: () => void;
}

export const useCookieStore = create<CookieStore>()(
  persist(
    (set) => ({
      showBanner: true,
      hasConsented: false,

      acceptCookies: () => {
        // Criar cookie simples de consentimento
        document.cookie = 'cookie_consent=accepted; max-age=15552000; path=/';
        
        set({
          hasConsented: true,
          showBanner: false,
        });
      },

      hideBanner: () => {
        set({ showBanner: false });
      },

      resetConsent: () => {
        // Remover cookie de consentimento
        document.cookie = 'cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        
        set({
          hasConsented: false,
          showBanner: true,
        });
      },
    }),
    {
      name: 'cookie-consent',
      partialize: (state) => ({
        hasConsented: state.hasConsented,
      }),
    }
  )
);