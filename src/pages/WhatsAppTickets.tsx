import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { TicketsCustomLayout, NewTicketModal } from '@/components/admin/whatsapp/tickets-whaticket';
import { useWhatsAppTickets } from '@/hooks/useWhatsAppTickets';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { TicketsContextProvider } from '@/contexts/TicketsContext';
import { QueuesSelectedProvider } from '@/contexts/QueuesSelectedContext';
import { ReplyMessageProvider } from '@/contexts/ReplyingMessageContext';
import { EditMessageProvider } from '@/contexts/EditingMessageContext';
import { ForwardMessageProvider } from '@/contexts/ForwardMessageContext';
import { adaptWhatsAppTicket, adaptFila } from '@/utils/ticketAdapter';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import '@/styles/whaticket-theme.css';

const WhatsAppTickets = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(chatId);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);

  const {
    tickets,
    filas,
    isLoading,
    error,
    acceptTicket,
    transferTicket,
    resolveTicket,
    reopenTicket,
    refetch
  } = useWhatsAppTickets();

  useEffect(() => {
    document.title = 'Chat WhatsApp - FP Transcargas Admin';
  }, []);

  useEffect(() => {
    if (chatId) {
      setSelectedChatId(chatId);
    }
  }, [chatId]);

  // Função para selecionar ticket e navegar para a rota
  const handleSelectTicket = useCallback((ticketId: string | undefined) => {
    setSelectedChatId(ticketId);
    if (ticketId) {
      navigate(`/whatsapp/${ticketId}`);
    } else {
      navigate('/whatsapp');
    }
  }, [navigate]);

  const handleAcceptTicket = useCallback(async (ticketId: string) => {
    if (!user?.id) return;
    await acceptTicket(ticketId, user.id);
  }, [acceptTicket, user?.id]);

  const handleTransferTicket = useCallback(async (ticketId: string, filaId: string, userId?: string) => {
    await transferTicket(ticketId, filaId, userId);
  }, [transferTicket]);

  const handleResolveTicket = useCallback(async (ticketId: string, silent: boolean = false) => {
    await resolveTicket(ticketId, silent);
    setSelectedChatId(undefined);
  }, [resolveTicket]);

  const handleReopenTicket = useCallback(async (ticketId: string) => {
    await reopenTicket(ticketId);
  }, [reopenTicket]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string, searchInMessages: boolean) => {
    setSearchQuery(query);
    // TODO: Implementar lógica de busca
  };

  const handleNewTicket = () => {
    setNewTicketModalOpen(true);
  };

  const handleCloseAll = async () => {
    // TODO: Implementar fechar todos os tickets
  };

  const adaptedTickets = tickets.map(adaptWhatsAppTicket);
  const adaptedFilas = filas.map(adaptFila);

  return (
    <ReplyMessageProvider>
      <EditMessageProvider>
        <ForwardMessageProvider>
          <TicketsContextProvider>
            <QueuesSelectedProvider>
              <PermissionGuard 
                permissions="admin.whatsapp.visualizar"
                showMessage={true}
              >
                <div className="flex flex-col h-full overflow-hidden">
                    <TicketsCustomLayout
                      tickets={adaptedTickets}
                      queues={adaptedFilas}
                      selectedTicketId={selectedChatId}
                      onSelectTicket={handleSelectTicket}
                      onAcceptTicket={handleAcceptTicket}
                      onTransferTicket={handleTransferTicket}
                      onResolveTicket={handleResolveTicket}
                      onReopenTicket={handleReopenTicket}
                      onSearch={handleSearch}
                      onNewTicket={handleNewTicket}
                      onCloseAll={handleCloseAll}
                      isLoading={isLoading}
                      isAdmin={true}
                    />
                  </div>

                  {user?.id && (
                    <NewTicketModal
                      open={newTicketModalOpen}
                      onClose={() => setNewTicketModalOpen(false)}
                      queues={adaptedFilas}
                      userId={user.id}
                    />
                  )}
                </PermissionGuard>
              </QueuesSelectedProvider>
          </TicketsContextProvider>
        </ForwardMessageProvider>
      </EditMessageProvider>
    </ReplyMessageProvider>
  );
};

export default WhatsAppTickets;
