import { useEffect, useRef } from 'react';
import { requireAuthenticatedClient, getRealtimeClient } from '@/config/supabaseAuth';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { playGlobalNotificationSound } from '@/contexts/SoundNotificationContext';
import { showBrowserNotification } from '@/utils/browserNotifications';
import { useLocation } from 'react-router-dom';

export const useGlobalWhatsAppNotifications = () => {
  const { user } = useUnifiedAuth();
  const location = useLocation();

  const userFilasRef = useRef<number[]>([]);
  const userTicketsRef = useRef<Set<number>>(new Set());
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.id || !user?.supabase_id) return;

    let mounted = true;

    const loadUserFilas = async () => {
      try {
        const client = requireAuthenticatedClient();
        const { data: userData, error } = await client
          .from('usuarios')
          .select('filas')
          .eq('supabase_id', user.supabase_id)
          .maybeSingle();

        if (error) return;
        if (!mounted) return;

        userFilasRef.current = userData?.filas || [];
      } catch {
        // Silent fail
      }
    };

    const loadUserTickets = async () => {
      try {
        const client = requireAuthenticatedClient();
        const { data, error } = await client
          .from('chats_whatsapp')
          .select('id')
          .eq('adminid', user.id)
          .eq('ativo', true)
          .eq('mododeatendimento', 'Atendimento Humano')
          .eq('resolvido', false);

        if (error) return;
        if (!mounted) return;

        userTicketsRef.current = new Set((data || []).map(d => d.id));
      } catch {
        // Silent fail
      }
    };

    loadUserFilas();
    loadUserTickets();

    const realtimeClient = getRealtimeClient();

    // Realtime para tickets - usa cliente autenticado para subscriptions
    const ticketsChannel = realtimeClient
      .channel(`global-whatsapp-tickets-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats_whatsapp'
        },
        (payload) => {
          const ticket = (payload.new || payload.old) as any;
          if (!ticket) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Não notificar para Atendimento IA
            const isAtendimentoIA = ticket.mododeatendimento?.toLowerCase() === 'atendimento ia';
            const isValidForNotification = 
              ticket.adminid === user.id && 
              ticket.ativo === true && 
              ticket.mododeatendimento === 'Atendimento Humano' && 
              ticket.resolvido === false &&
              !isAtendimentoIA;
            
            if (isValidForNotification) {
              userTicketsRef.current.add(ticket.id);
            } else {
              userTicketsRef.current.delete(ticket.id);
            }
          } else if (payload.eventType === 'DELETE') {
            userTicketsRef.current.delete(ticket.id);
          }
        }
      )
      .subscribe();

    // Realtime para mensagens - usa cliente autenticado para subscriptions
    const messagesChannel = realtimeClient
      .channel(`global-whatsapp-messages-${user.supabase_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_whatsapp'
        },
        async (payload) => {
          const newMessage = payload.new as any;

          if (newMessage?.send !== 'cliente') {
            return;
          }

          const chatId = newMessage?.chatId as number | undefined;
          if (!chatId) return;

          let shouldNotify = userTicketsRef.current.has(chatId);

          if (!shouldNotify) {
            const client = requireAuthenticatedClient();
            const { data: ticket, error } = await client
              .from('chats_whatsapp')
              .select('adminid, filas, aceitoporadmin, ativo, mododeatendimento, resolvido')
              .eq('id', chatId)
              .single();

            if (!error && ticket) {
              // Não notificar para Atendimento IA ou outros modos que não sejam Atendimento Humano
              const isAtendimentoIA = ticket.mododeatendimento?.toLowerCase() === 'atendimento ia';
              const meetsFilters = 
                ticket.ativo === true && 
                ticket.mododeatendimento === 'Atendimento Humano' && 
                ticket.resolvido === false &&
                !isAtendimentoIA;

              if (!meetsFilters) return;

              if (ticket.adminid === user.id) {
                shouldNotify = true;
                userTicketsRef.current.add(chatId);
              } else if (!ticket.aceitoporadmin && ticket.filas) {
                let ticketFilas: number[] = [];
                try {
                  ticketFilas = typeof ticket.filas === 'string' 
                    ? JSON.parse(ticket.filas) 
                    : (ticket.filas || []);
                } catch {
                  ticketFilas = [];
                }
                
                const userHasNoRestriction = userFilasRef.current.length === 0;
                const userHasMatchingQueue = ticketFilas.some(f => userFilasRef.current.includes(Number(f)));
                
                if (userHasNoRestriction || userHasMatchingQueue) {
                  shouldNotify = true;
                }
              }
            }
          }

          if (!shouldNotify) {
            return;
          }

          const currentPath = pathnameRef.current;
          const isInWhatsAppPage = currentPath.includes('/whatsapp');
          
          if (!isInWhatsAppPage) {
            playGlobalNotificationSound();
            
            const client = requireAuthenticatedClient();
            const { data: ticketData } = await client
              .from('chats_whatsapp')
              .select('usuarioid')
              .eq('id', chatId)
              .single();

            if (ticketData?.usuarioid) {
              const { data: contactData } = await client
                .from('contatos_whatsapp')
                .select('nome, telefone')
                .eq('id', ticketData.usuarioid)
                .single();

              const contactName = contactData?.nome || contactData?.telefone || 'Cliente';
              const messagePreview = newMessage.message_text?.length > 50
                ? newMessage.message_text.substring(0, 50) + '...'
                : newMessage.message_text || 'Nova mensagem';

              showBrowserNotification(
                `WhatsApp: ${contactName}`,
                messagePreview,
                '/whatsapp'
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      realtimeClient.removeChannel(ticketsChannel);
      realtimeClient.removeChannel(messagesChannel);
    };
  }, [user?.id, user?.supabase_id]);
};
