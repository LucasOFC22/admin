import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { formatMessagePreview } from '@/utils/messagePreview';

export interface PriorityChat {
  chat_id: number;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_client_message_at: string;
  waiting_minutes: number;
  priority_level: 'critico' | 'alto' | 'medio' | 'baixo';
  priority_order: number;
  chat_type: 'pending' | 'open';
  admin_id: string | null;
  filas: string;
}

export const useWhatsAppPriorityChats = (adminId: string | undefined) => {
  return useQuery({
    queryKey: ['whatsapp-priority-chats', adminId],
    queryFn: async (): Promise<PriorityChat[]> => {
      if (!adminId) return [];

      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.rpc('get_whatsapp_priority_chats', {
        p_admin_id: adminId,
      });

      if (error) {
        console.error('Erro ao buscar chats por prioridade:', error);
        throw error;
      }

      return ((data as any[]) || []).map(chat => ({
        ...chat,
        last_message: formatMessagePreview(chat.last_message, chat.last_message_type),
      })) as PriorityChat[];
    },
    enabled: !!adminId,
    refetchInterval: 30000,
  });
};

export const getPriorityColor = (level: PriorityChat['priority_level']) => {
  switch (level) {
    case 'critico':
      return 'bg-red-500 text-white';
    case 'alto':
      return 'bg-orange-500 text-white';
    case 'medio':
      return 'bg-yellow-500 text-black';
    case 'baixo':
      return 'bg-green-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPriorityLabel = (level: PriorityChat['priority_level']) => {
  switch (level) {
    case 'critico':
      return 'Crítico';
    case 'alto':
      return 'Alto';
    case 'medio':
      return 'Médio';
    case 'baixo':
      return 'Baixo';
    default:
      return level;
  }
};
