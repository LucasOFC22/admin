import { useState, useEffect, useRef } from 'react';
import { formatMessagePreview } from '@/utils/messagePreview';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { supabaseWhatsAppService } from '@/services/whatsapp/supabaseIntegration';
import { whatsappDebug } from '@/utils/whatsappDebug';
import { useAuthState } from '@/hooks/useAuthState';
import { useAdvancedPermissions } from '@/hooks/useAdvancedPermissions';

export interface KanbanChat {
  id: string;
  contatoId: string;
  chatId: number;
  usuarioId: string;
  nome: string;
  telefone: string;
  picture?: string;
  email?: string;
  filas?: string;
  modoDeAtendimento: string;
  aceitoPorAdmin: boolean;
  adminId?: string;
  ativo: boolean;
  resolvido: boolean;
  criadoEm?: Date;
  podeEnviarMensagem: boolean;
  lastMessage?: string;
}

export const useWhatsAppKanban = () => {
  const [conversations, setConversations] = useState<KanbanChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar permissão para ver todos os tickets
  const { user } = useAuthState();
  const userCargoId = user?.cargo ? Number(user.cargo) : undefined;
  const { cargoPermissions, hasPermission } = useAdvancedPermissions(userCargoId);
  const canViewAllTickets = hasPermission(cargoPermissions, 'admin.whatsapp.ver_conversas_outros');

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const configured = await supabaseWhatsAppService.isConfigured();
      setIsConfigured(configured);
      
      if (!configured) {
        setError('WhatsApp não configurado');
        return;
      }

      whatsappDebug('📋 [useWhatsAppKanban] Carregando chats para kanban...');

      const authClient = requireAuthenticatedClient();
      
      // Buscar chats com filtros específicos para kanban
      const { data: chatsData, error: chatsError } = await authClient
        .from('chats_whatsapp')
        .select('*')
        .eq('mododeatendimento', 'Atendimento Humano')
        .eq('resolvido', false)
        .eq('ativo', true)
        .order('atualizadoem', { ascending: false });

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setConversations([]);
        return;
      }

      // Buscar contatos dos chats
      const contatoIds = [...new Set(chatsData.map(c => c.usuarioid))];
      const { data: contatosData, error: contatosError } = await authClient
        .from('contatos_whatsapp')
        .select('*')
        .in('id', contatoIds);

      if (contatosError) throw contatosError;

      const contatosMap: Record<string, any> = {};
      (contatosData || []).forEach(c => {
        contatosMap[c.id] = c;
      });

      // Buscar última mensagem de cada chat
      const chatIds = chatsData.map(c => c.id);
      const lastMessagesMap: Record<number, string> = {};
      
      if (chatIds.length > 0) {
        const { data: messagesData } = await authClient
          .from('mensagens_whatsapp')
          .select('chatId, message_text, message_type, message_data, created_at')
          .in('chatId', chatIds)
          .order('created_at', { ascending: false });

        const seenChats = new Set<number>();
        (messagesData || []).forEach(msg => {
          if (!seenChats.has(msg.chatId)) {
            const caption = msg.message_data?.caption || msg.message_data?.media?.caption || '';
            lastMessagesMap[msg.chatId] = formatMessagePreview(msg.message_text, msg.message_type, caption);
            seenChats.add(msg.chatId);
          }
        });
      }

      // Formatar conversas
      let formattedConversations: KanbanChat[] = chatsData.map(chat => {
        const contato = contatosMap[chat.usuarioid] || {};
        
        return {
          id: chat.id.toString(), // ID do chat (bigint) para operações no banco
          contatoId: chat.usuarioid,
          chatId: chat.id,
          usuarioId: chat.usuarioid,
          nome: contato.nome || `Usuário ${contato.telefone || chat.usuarioid}`,
          telefone: contato.telefone || '',
          picture: contato.perfil,
          email: contato.email,
          filas: chat.filas,
          modoDeAtendimento: chat.mododeatendimento || 'Bot',
          aceitoPorAdmin: chat.aceitoporadmin || false,
          adminId: chat.adminid,
          ativo: chat.ativo ?? false,
          resolvido: chat.resolvido ?? true,
          criadoEm: chat.criadoem ? new Date(chat.criadoem) : undefined,
          podeEnviarMensagem: chat.mododeatendimento === 'Atendimento Humano' && chat.aceitoporadmin,
          lastMessage: lastMessagesMap[chat.id] || ''
        };
      });

      // Filtrar por atendente se não tiver permissão de ver todos
      if (!canViewAllTickets && user?.id) {
        formattedConversations = formattedConversations.filter(
          conv => conv.adminId === user.id
        );
      }

      whatsappDebug(`📋 [useWhatsAppKanban] ${formattedConversations.length} chats formatados (canViewAll: ${canViewAllTickets})`);
      setConversations(formattedConversations);
      
    } catch (error) {
      console.error('Erro ao carregar chats kanban:', error);
      setError('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  // Referência para o canal Realtime
  const channelRef = useRef<ReturnType<typeof getRealtimeClient>['channel'] extends (...args: any[]) => infer R ? R : never>(null as any);

  useEffect(() => {
    // Só carrega quando as permissões estiverem prontas
    if (cargoPermissions !== undefined) {
      loadConversations();
    }

    // Realtime para chats - usa cliente autenticado para compatibilidade com RLS
    const realtimeClient = getRealtimeClient();
    
    console.log('[Realtime:Kanban] 📡 Criando canal para chats do Kanban');
    
    const chatsChannel = realtimeClient
      .channel('kanban-chats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats_whatsapp'
        },
        (payload) => {
          console.log('[Realtime:Kanban] 📥 Evento recebido', {
            eventType: payload.eventType,
            table: 'chats_whatsapp',
            newId: (payload.new as any)?.id,
            oldId: (payload.old as any)?.id
          });
          whatsappDebug('📋 [useWhatsAppKanban] Realtime event received');
          loadConversations();
        }
      )
      .subscribe((status, err) => {
        console.log(`[Realtime:Kanban] 📡 Status: ${status}`, err ? `Erro: ${JSON.stringify(err)}` : '');
        whatsappDebug(`📋 [useWhatsAppKanban] Channel status: ${status}`);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[Realtime:Kanban] 🔴 Canal com problema: ${status}`, err);
        }
      });

    channelRef.current = chatsChannel;

    return () => {
      if (channelRef.current) {
        realtimeClient.removeChannel(channelRef.current);
      }
    };
  }, [canViewAllTickets, user?.id, cargoPermissions]);

  return {
    conversations,
    isLoading,
    isConfigured,
    error,
    loadConversations
  };
};
