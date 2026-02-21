import React, { useEffect, useReducer, useRef } from 'react';
import { TicketListItemCustom } from './TicketListItemCustom';
import { Ticket } from '@/services/ticketService';
import { Skeleton } from '@/components/ui/skeleton';

// Interface para aceitar ambos os IDs do usuário
interface UserIdPair {
  id: string | null;
  supabase_id: string | null;
}

// Helper para verificar se adminId pertence ao usuário atual (aceita ambos IDs)
const isCurrentUserAdmin = (ticketAdminId: string | undefined | null, currentUser: UserIdPair | null): boolean => {
  if (!ticketAdminId || !currentUser) return false;
  return ticketAdminId === currentUser.id || ticketAdminId === currentUser.supabase_id;
};

interface TicketsListProps {
  tickets: Ticket[];
  selectedTicketId?: string;
  onSelectTicket: (ticketId: string) => void;
  onAcceptTicket?: (ticketId: string) => void;
  onTransferTicket?: (ticketId: string) => void;
  onCloseTicket?: (ticketId: string) => void;
  onAcceptTransfer?: (ticketId: string) => void;
  onRejectTransfer?: (ticketId: string) => void;
  currentUser?: UserIdPair | null;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

type Action =
  | { type: 'LOAD_TICKETS'; payload: Ticket[] }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'DELETE_TICKET'; payload: string }
  | { type: 'RESET' };

const reducer = (state: Ticket[], action: Action): Ticket[] => {
  switch (action.type) {
    case 'LOAD_TICKETS':
      return action.payload;
    case 'UPDATE_TICKET': {
      const index = state.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const newState = [...state];
        newState[index] = action.payload;
        return newState;
      }
      return [action.payload, ...state];
    }
    case 'DELETE_TICKET':
      return state.filter(t => t.id !== action.payload);
    case 'RESET':
      return [];
    default:
      return state;
  }
};

export const TicketsList: React.FC<TicketsListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onAcceptTicket,
  onTransferTicket,
  onCloseTicket,
  onAcceptTransfer,
  onRejectTransfer,
  currentUser,
  isLoading,
  onLoadMore,
  hasMore
}) => {
  const [localTickets, dispatch] = useReducer(reducer, tickets);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch({ type: 'LOAD_TICKETS', payload: tickets });
  }, [tickets]);

  // NOTA: Realtime é gerenciado pelo hook useWhatsAppTickets (pai)
  // Não precisamos de subscription duplicada aqui

  const handleScroll = () => {
    if (!scrollRef.current || !hasMore || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      onLoadMore?.();
    }
  };

  if (isLoading && localTickets.length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border-b">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (localTickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-muted-foreground">
          <p className="text-sm">Nenhum ticket encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto"
      onScroll={handleScroll}
    >
      {localTickets.map((ticket) => {
        // Usar helper para verificar se adminIdPendente ou adminId pertencem ao usuário atual
        const isTransferForMe = isCurrentUserAdmin(ticket.adminIdPendente, currentUser);
        const isAttendingByMe = isCurrentUserAdmin((ticket as any).adminId, currentUser);
        return (
          <TicketListItemCustom
            key={ticket.id}
            ticket={ticket}
            selected={ticket.id === selectedTicketId}
            onClick={() => onSelectTicket(ticket.id)}
            onAccept={onAcceptTicket ? () => onAcceptTicket(ticket.id) : undefined}
            onTransfer={onTransferTicket ? () => onTransferTicket(ticket.id) : undefined}
            onClose={onCloseTicket ? () => onCloseTicket(ticket.id) : undefined}
            onAcceptTransfer={isTransferForMe && onAcceptTransfer ? () => onAcceptTransfer(ticket.id) : undefined}
            onRejectTransfer={isTransferForMe && onRejectTransfer ? () => onRejectTransfer(ticket.id) : undefined}
            isTransferForMe={isTransferForMe}
            isAttendingByMe={isAttendingByMe}
          />
        );
      })}
      {isLoading && (
        <div className="p-3">
          <Skeleton className="h-16 w-full" />
        </div>
      )}
    </div>
  );
};
