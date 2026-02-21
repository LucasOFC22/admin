import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { formatMessagePreview } from '@/utils/messagePreview';

export interface PendingChat {
  chat_id: number;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  message_count: number;
  waiting_time_minutes: number;
  created_at: string;
  updated_at: string;
  filas: string;
}

export const useWhatsAppPendingChats = (adminId: string | undefined) => {
  return useQuery({
    queryKey: ['whatsapp-pending-chats', adminId],
    queryFn: async (): Promise<PendingChat[]> => {
      if (!adminId) return [];

      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.rpc('get_whatsapp_pending_chats', {
        p_admin_id: adminId,
      });

      if (error) {
        console.error('Erro ao buscar chats pendentes:', error);
        throw error;
      }

      return ((data as any[]) || []).map(chat => ({
        ...chat,
        last_message: formatMessagePreview(chat.last_message, chat.last_message_type),
      })) as PendingChat[];
    },
    enabled: !!adminId,
    refetchInterval: 30000,
  });
};
