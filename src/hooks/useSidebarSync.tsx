import { useEffect, useRef } from 'react';
import { useIsMobile } from './use-mobile';
import { useSidebarStore } from '@/stores/sidebarStore';

export function useSidebarSync() {
  const isMobile = useIsMobile();
  const { setIsMobile, setSidebarOpen } = useSidebarStore();
  const prevIsMobile = useRef<boolean | undefined>(undefined);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Primeira inicialização
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setIsMobile(isMobile);
      // No desktop, garantir sidebar aberto; no mobile, fechado
      setSidebarOpen(!isMobile);
      prevIsMobile.current = isMobile;
      return;
    }

    // Só executa se houve mudança real no breakpoint
    if (prevIsMobile.current !== isMobile) {
      setIsMobile(isMobile);
      // No desktop, abrir; no mobile, fechar
      setSidebarOpen(!isMobile);
      prevIsMobile.current = isMobile;
    }
  }, [isMobile, setIsMobile, setSidebarOpen]);

  return { isMobile };
}
