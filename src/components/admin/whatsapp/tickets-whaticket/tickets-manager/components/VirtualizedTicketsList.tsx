import React, { useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { TicketListItemCustom } from '../../TicketListItemCustom';
import { adaptWhatsAppTicket } from '@/utils/ticketAdapter';
import { Ticket } from '@/services/ticketService';
import { UserIdPair } from '../hooks/useTicketsFilters';

// Helper para verificar se adminId pertence ao usuário atual (aceita ambos IDs)
const isCurrentUserAdmin = (ticketAdminId: string | undefined | null, currentUser: UserIdPair | null): boolean => {
  if (!ticketAdminId || !currentUser) return false;
  return ticketAdminId === currentUser.id || ticketAdminId === currentUser.supabase_id;
};

interface VirtualizedTicketsListProps {
  tickets: any[];
  filas: Array<{ id: number; name: string; color: string }>;
  selectedTicketId?: string;
  currentTab: 'open' | 'pending';
  currentUser: UserIdPair | null;
  canAcceptTicket: boolean;
  canTransferTicket: boolean;
  canIgnoreTicket: boolean;
  canCloseTicket: boolean;
  onSelectTicket?: (ticketId: string | undefined) => void;
  onOpenAcceptModal: (ticketId: string) => void;
  onOpenTransferModal: (ticketId: string) => void;
  onOpenCloseConfirm: (ticketId: string, isPending: boolean) => void;
  onAcceptTransfer: (ticketId: string) => void;
  onRejectTransfer: (ticketId: string) => void;

  // Infinite scroll (carregar mais conforme rola)
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

interface TicketRowData {
  tickets: any[];
  filas: Array<{ id: number; name: string; color: string }>;
  selectedTicketId?: string;
  currentTab: 'open' | 'pending';
  currentUser: UserIdPair | null;
  canAcceptTicket: boolean;
  canTransferTicket: boolean;
  canIgnoreTicket: boolean;
  canCloseTicket: boolean;
  onSelectTicket: (ticketId: string) => void;
  onOpenAcceptModal: (ticketId: string) => void;
  onOpenTransferModal: (ticketId: string) => void;
  onOpenCloseConfirm: (ticketId: string, isPending: boolean) => void;
  onAcceptTransfer: (ticketId: string) => void;
  onRejectTransfer: (ticketId: string) => void;
}

const ITEM_HEIGHT = 95;

const TicketRowBase = React.forwardRef<HTMLDivElement, ListChildComponentProps<TicketRowData>>(
  ({ index, style, data }, ref) => {
    const {
      tickets,
      filas,
      selectedTicketId,
      currentTab,
      currentUser,
      canAcceptTicket,
      canTransferTicket,
      canIgnoreTicket,
      canCloseTicket,
      onSelectTicket,
      onOpenAcceptModal,
      onOpenTransferModal,
      onOpenCloseConfirm,
      onAcceptTransfer,
      onRejectTransfer
    } = data;

    const ticket = tickets[index];
    const adaptedTicket = adaptWhatsAppTicket(ticket);
    const filaId = ticket.filas?.[0];
    const fila = filaId ? filas.find(f => String(f.id) === String(filaId)) : null;

    if (fila) {
      adaptedTicket.queue = {
        id: String(fila.id),
        name: fila.name,
        color: fila.color
      };
    } else {
      adaptedTicket.queue = {
        id: '0',
        name: 'SEM FILA',
        color: '#7c7c7c'
      };
    }

    const isPending = currentTab === 'pending';
    // Usar helper para verificar se adminIdPendente ou adminid pertencem ao usuário atual
    const isTransferForMe = isCurrentUserAdmin(ticket.adminIdPendente, currentUser);
    const isAttendingByMe = isCurrentUserAdmin(ticket.adminid, currentUser);
    const isClosed = ticket.resolvido === true;

    return (
      <div ref={ref} style={style}>
        <TicketListItemCustom
          ticket={adaptedTicket}
          selected={selectedTicketId === String(ticket.id)}
          onClick={() => onSelectTicket(String(ticket.id))}
          onAccept={(isPending || isClosed) ? () => onOpenAcceptModal(String(ticket.id)) : undefined}
          onTransfer={() => onOpenTransferModal(String(ticket.id))}
          onClose={() => onOpenCloseConfirm(String(ticket.chatId || ticket.id), isPending)}
          onAcceptTransfer={isTransferForMe ? () => onAcceptTransfer(String(ticket.id)) : undefined}
          onRejectTransfer={isTransferForMe ? () => onRejectTransfer(String(ticket.id)) : undefined}
          canAccept={canAcceptTicket}
          canTransfer={canTransferTicket}
          canClose={isPending ? canIgnoreTicket : canCloseTicket}
          isTransferForMe={isTransferForMe}
          isAttendingByMe={isAttendingByMe}
        />
      </div>
    );
  }
);

TicketRowBase.displayName = 'TicketRowBase';

const TicketRow = React.memo(TicketRowBase);
TicketRow.displayName = 'TicketRow';

export const VirtualizedTicketsList: React.FC<VirtualizedTicketsListProps> = ({
  tickets,
  filas,
  selectedTicketId,
  currentTab,
  currentUser,
  canAcceptTicket,
  canTransferTicket,
  canIgnoreTicket,
  canCloseTicket,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(500);
  const loadMoreLockRef = useRef(false);

  // Detectar altura do container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Memoizar callbacks
  const handleSelectTicket = useCallback((ticketId: string) => {
    onSelectTicket?.(ticketId);
  }, [onSelectTicket]);

  const handleOpenAcceptModal = useCallback((ticketId: string) => {
    onOpenAcceptModal(ticketId);
  }, [onOpenAcceptModal]);

  const handleOpenTransferModal = useCallback((ticketId: string) => {
    onOpenTransferModal(ticketId);
  }, [onOpenTransferModal]);

  const handleOpenCloseConfirm = useCallback((ticketId: string, isPending: boolean) => {
    onOpenCloseConfirm(ticketId, isPending);
  }, [onOpenCloseConfirm]);

  const handleAcceptTransfer = useCallback((ticketId: string) => {
    onAcceptTransfer(ticketId);
  }, [onAcceptTransfer]);

  const handleRejectTransfer = useCallback((ticketId: string) => {
    onRejectTransfer(ticketId);
  }, [onRejectTransfer]);

  const maybeLoadMore = useCallback(() => {
    if (!onLoadMore) return;
    if (!hasMore) return;
    if (isLoadingMore) return;
    if (loadMoreLockRef.current) return;

    loadMoreLockRef.current = true;
    onLoadMore();

    // solta o lock logo em seguida pra não disparar em loop
    setTimeout(() => {
      loadMoreLockRef.current = false;
    }, 250);
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Dados para a lista virtualizada
  const itemData: TicketRowData = React.useMemo(() => ({
    tickets,
    filas,
    selectedTicketId,
    currentTab,
    currentUser,
    canAcceptTicket,
    canTransferTicket,
    canIgnoreTicket,
    canCloseTicket,
    onSelectTicket: handleSelectTicket,
    onOpenAcceptModal: handleOpenAcceptModal,
    onOpenTransferModal: handleOpenTransferModal,
    onOpenCloseConfirm: handleOpenCloseConfirm,
    onAcceptTransfer: handleAcceptTransfer,
    onRejectTransfer: handleRejectTransfer
  }), [
    tickets,
    filas,
    selectedTicketId,
    currentTab,
    currentUser,
    canAcceptTicket,
    canTransferTicket,
    canIgnoreTicket,
    canCloseTicket,
    handleSelectTicket,
    handleOpenAcceptModal,
    handleOpenTransferModal,
    handleOpenCloseConfirm,
    handleAcceptTransfer,
    handleRejectTransfer
  ]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <List
        height={containerHeight}
        width="100%"
        itemCount={tickets.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={5}
        onItemsRendered={({ visibleStopIndex }) => {
          // Quando chega perto do final, busca o próximo lote
          if (visibleStopIndex >= tickets.length - 10) {
            maybeLoadMore();
          }
        }}
      >
        {TicketRow}
      </List>

      {/* Indicador simples de carregamento no fim */}
      {isLoadingMore && (
        <div className="py-2 text-center text-xs text-muted-foreground">
          Carregando mais...
        </div>
      )}
    </div>
  );
};
