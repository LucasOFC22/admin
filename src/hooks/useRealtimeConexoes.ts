import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ConexaoUpdate {
  id: string;
  nome?: string;
  status: string;
  qrcode?: string;
  updated_at: string;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
}

export const useRealtimeConexoes = (onUpdate: (conexao: ConexaoUpdate) => void) => {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Realtime usa cliente anônimo (subscriptions não requerem auth)
      channel = supabase
        .channel('conexoes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conexoes',
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const newData = payload.new as ConexaoUpdate;
              onUpdate(newData);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [onUpdate]);
};
