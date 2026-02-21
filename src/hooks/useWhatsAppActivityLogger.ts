import { useCallback, useRef } from 'react';
import { useActivityLogger } from './useActivityLogger';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';

/**
 * Hook especializado para logging de atividades do WhatsApp Admin
 * Implementa debounce automático para prevenir loops infinitos
 */
export const useWhatsAppActivityLogger = () => {
  const { logActivity } = useActivityLogger();
  const lastLogTime = useRef<{ [key: string]: number }>({});
  const DEBOUNCE_MS = 2000; // 2 segundos entre logs da mesma ação

  const logWhatsAppActivity = useCallback(async (
    acao: string,
    detalhes?: Record<string, any>
  ): Promise<void> => {
    // Criar chave única para esta ação
    const logKey = `${acao}-${JSON.stringify(detalhes || {})}`;
    const now = Date.now();
    
    // Verificar se já foi logado recentemente
    if (lastLogTime.current[logKey] && (now - lastLogTime.current[logKey]) < DEBOUNCE_MS) {
      if (isWhatsAppDebugEnabled()) {
        console.debug(`[WhatsApp Logger] Ação "${acao}" ignorada (debounce)`);
      }
      return;
    }

    // Atualizar timestamp
    lastLogTime.current[logKey] = now;

    // Limpar timestamps antigos (mais de 10 segundos)
    Object.keys(lastLogTime.current).forEach(key => {
      if (now - lastLogTime.current[key] > 10000) {
        delete lastLogTime.current[key];
      }
    });

    // Registrar log
    await logActivity({
      acao,
      modulo: 'whatsapp',
      detalhes: {
        ...detalhes,
        timestamp: new Date().toISOString(),
        pagina: 'admin-whatsapp'
      }
    });
  }, [logActivity]);

  return { logWhatsAppActivity };
};
