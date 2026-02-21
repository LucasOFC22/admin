import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';

interface SessionWindowState {
  isExpired: boolean;           // Passou de 24 horas
  isNearExpiry: boolean;        // Passou de 12 horas mas menos de 24
  lastUpdatedAt: Date | null;
  hoursRemaining: number | null;
  minutesRemaining: number | null;
  isLoading: boolean;
  error: string | null;
}

const SESSION_WINDOW_HOURS = 24;
const NEAR_EXPIRY_HOURS = 12;

export const useSessionWindow = (chatId: string | undefined) => {
  const [state, setState] = useState<SessionWindowState>({
    isExpired: false,
    isNearExpiry: false,
    lastUpdatedAt: null,
    hoursRemaining: null,
    minutesRemaining: null,
    isLoading: true,
    error: null,
  });

  const fetchChatUpdatedAt = useCallback(async () => {
    if (!chatId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const authClient = requireAuthenticatedClient();
      // Buscar o campo atualizadoem da tabela chats_whatsapp
      const { data, error } = await authClient
        .from('chats_whatsapp')
        .select('atualizadoem')
        .eq('id', chatId)
        .maybeSingle();

      if (error) {
        console.error('[useSessionWindow] Erro ao buscar chat:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return;
      }

      if (!data?.atualizadoem) {
        // Sem data de atualização = considerar expirado
        setState({
          isExpired: true,
          isNearExpiry: false,
          lastUpdatedAt: null,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isLoading: false,
          error: null,
        });
        return;
      }

      const lastUpdatedTime = new Date(data.atualizadoem);
      const now = new Date();
      const diffMs = now.getTime() - lastUpdatedTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const remainingHours = Math.max(0, SESSION_WINDOW_HOURS - diffHours);
      const remainingMinutes = Math.max(0, Math.floor((remainingHours % 1) * 60));

      setState({
        isExpired: diffHours >= SESSION_WINDOW_HOURS,
        isNearExpiry: diffHours >= NEAR_EXPIRY_HOURS && diffHours < SESSION_WINDOW_HOURS,
        lastUpdatedAt: lastUpdatedTime,
        hoursRemaining: Math.floor(remainingHours),
        minutesRemaining: remainingMinutes,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useSessionWindow] Erro inesperado:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao verificar janela de sessão',
      }));
    }
  }, [chatId]);

  useEffect(() => {
    fetchChatUpdatedAt();

    // Atualizar a cada minuto para manter o contador atualizado
    const interval = setInterval(fetchChatUpdatedAt, 60000);

    return () => clearInterval(interval);
  }, [fetchChatUpdatedAt]);

  // Subscrição realtime para atualizações no chat
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`session-window-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats_whatsapp',
          filter: `id=eq.${chatId}`,
        },
        () => {
          // Atualizar quando o chat for atualizado
          fetchChatUpdatedAt();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchChatUpdatedAt]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchChatUpdatedAt();
  }, [fetchChatUpdatedAt]);

  return {
    ...state,
    refresh,
  };
};
