import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TicketsCustomLayout, NewTicketModal } from '@/components/admin/whatsapp/tickets-whaticket';
import { useWhatsAppTickets } from '@/hooks/useWhatsAppTickets';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { TicketsContextProvider } from '@/contexts/TicketsContext';
import { QueuesSelectedProvider } from '@/contexts/QueuesSelectedContext';
import { ReplyMessageProvider } from '@/contexts/ReplyingMessageContext';
import { EditMessageProvider } from '@/contexts/EditingMessageContext';
import { ForwardMessageProvider } from '@/contexts/ForwardMessageContext';
import { adaptWhatsAppTicket, adaptFila } from '@/utils/ticketAdapter';
import { useTicketAccessGuard } from '@/hooks/useTicketAccessGuard';
import { toast } from '@/lib/toast';
import '@/styles/whaticket-theme.css';

const WhatsAppManagementBoard = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(chatId);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);

  // Verificar acesso à fila do ticket selecionado
  const { hasAccess, isLoading: isCheckingAccess } = useTicketAccessGuard(chatId);

  // Se não tem acesso, redirecionar para a lista
  useEffect(() => {
    if (chatId && !isCheckingAccess && !hasAccess) {
      toast.error('Você não tem permissão para acessar este chat');
      navigate('/whatsapp');
      setSelectedChatId(undefined);
    }
  }, [chatId, hasAccess, isCheckingAccess, navigate]);

  const {
    tickets,
    filas,
    isLoading,
    acceptTicket,
    transferTicket,
    resolveTicket,
    reopenTicket,
    refetch,
  } = useWhatsAppTickets();

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

    const t = tickets.find(x => String(x.id) === String(ticketId) || String(x.chatId) === String(ticketId));
    if (t?.resolvido === true) {
      await reopenTicket(ticketId);
      return;
    }

    await acceptTicket(ticketId, user.id);
  }, [acceptTicket, reopenTicket, tickets, user?.id]);

  const handleTransferTicket = useCallback(async (ticketId: string, filaId: string, userId?: string) => {
    await transferTicket(ticketId, filaId, userId);
  }, [transferTicket]);

  const handleResolveTicket = useCallback(async (ticketId: string) => {
    await resolveTicket(ticketId);
    setSelectedChatId(undefined);
  }, [resolveTicket]);

  const handleReopenTicket = useCallback(async (ticketId: string) => {
    await reopenTicket(ticketId);
    await refetch(); // Forçar atualização para refletir o novo status
  }, [reopenTicket, refetch]);

  const handleSearch = (query: string, searchInMessages: boolean) => {
    // TODO: Implementar lógica de busca
  };

  const handleNewTicket = () => {
    setNewTicketModalOpen(true);
  };

  // Callback após criar ticket - atualiza lista e seleciona o novo ticket
  const handleTicketCreated = useCallback(async (contatoId: string) => {
    await refetch();
    handleSelectTicket(contatoId);
  }, [refetch, handleSelectTicket]);

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
                  onTicketCreated={handleTicketCreated}
                />
              )}
            </QueuesSelectedProvider>
          </TicketsContextProvider>
        </ForwardMessageProvider>
      </EditMessageProvider>
    </ReplyMessageProvider>
  );
};

export default WhatsAppManagementBoard;
