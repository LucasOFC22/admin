import React, { useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { VirtualizedTicketsList } from './VirtualizedTicketsList';
import { UserIdPair } from '../hooks/useTicketsFilters';

interface TicketsListContainerProps {
  tickets: any[];
  filas: Array<{ id: number; name: string; color: string }>;
  selectedTicketId?: string;
  currentTab: 'open' | 'pending';
  currentUser: UserIdPair | null;
  canAcceptTicket: boolean;
  canTransferTicket: boolean;
  canIgnoreTicket: boolean;
  canCloseTicket: boolean;
  filasPermitidas?: number[];
  hasFilasRestriction?: boolean;
  onSelectTicket?: (ticketId: string | undefined) => void;
  onOpenAcceptModal: (ticketId: string) => void;
  onOpenTransferModal: (ticketId: string) => void;
  onOpenCloseConfirm: (ticketId: string, isPending: boolean) => void;
  onAcceptTransfer: (ticketId: string) => void;
  onRejectTransfer: (ticketId: string) => void;

  // Infinite scroll
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const TicketsListContainer: React.FC<TicketsListContainerProps> = ({
  tickets,
  filas,
  selectedTicketId,
  currentTab,
  currentUser,
  canAcceptTicket,
  canTransferTicket,
  canIgnoreTicket,
  canCloseTicket,
  filasPermitidas = [],
  hasFilasRestriction = false,
  onSelectTicket,
  onOpenAcceptModal,
  onOpenTransferModal,
  onOpenCloseConfirm,
  onAcceptTransfer,
  onRejectTransfer,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  // Filtrar tickets por permissão de fila
  const filteredTickets = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return tickets;
    }

    return tickets.filter(ticket => {
      if (!ticket.chatId) return true;
      
      const rawFilas = ticket.filas;
      const ticketFilas = Array.isArray(rawFilas) ? rawFilas : (rawFilas ? [rawFilas] : []);
      
      if (ticketFilas.length === 0) {
        return filasPermitidas.includes(1);
      }
      
      return ticketFilas.some(filaId => 
        filasPermitidas.includes(Number(filaId))
      );
    });
  }, [tickets, filasPermitidas, hasFilasRestriction]);

  if (filteredTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Inbox size={48} className="text-muted-foreground/30 mb-4" />
        <span className="block text-lg font-semibold mb-2">
          Nada aqui!
        </span>
        <p className="text-sm text-muted-foreground">
          Nenhum atendimento encontrado com esse status ou termo pesquisado
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <VirtualizedTicketsList
        tickets={filteredTickets}
        filas={filas}
        selectedTicketId={selectedTicketId}
        currentTab={currentTab}
        currentUser={currentUser}
        canAcceptTicket={canAcceptTicket}
        canTransferTicket={canTransferTicket}
        canIgnoreTicket={canIgnoreTicket}
        canCloseTicket={canCloseTicket}
        onSelectTicket={onSelectTicket}
        onOpenAcceptModal={onOpenAcceptModal}
        onOpenTransferModal={onOpenTransferModal}
        onOpenCloseConfirm={onOpenCloseConfirm}
        onAcceptTransfer={onAcceptTransfer}
        onRejectTransfer={onRejectTransfer}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
};
