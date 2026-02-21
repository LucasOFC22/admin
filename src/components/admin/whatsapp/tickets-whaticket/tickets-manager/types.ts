export interface Conexao {
  id: string;
  nome: string;
}

export interface Usuario {
  id: number;
  supabase_id: string;
  nome: string;
}

export interface TicketsManagerTabsProps {
  selectedTicketId?: string;
  onSelectTicket?: (ticketId: string | undefined) => void;
  onAcceptTicket?: (ticketId: string) => void;
  onTransferTicket?: (ticketId: string) => void;
  onCloseTicket?: (ticketId: string) => void;
  isAdmin?: boolean;
}

export interface FilterState {
  searchParam: string;
  searchInMessages: boolean;
  currentTab: 'open' | 'pending';
  showFilters: boolean;
  selectedFilas: string[];
  selectedConnections: string[];
  selectedModoAtendimento: string[];
  selectedUsers: string[];
  showAll: boolean;
  showResolved: boolean;
  sortOrder: 'asc' | 'desc';
}

export interface ModalState {
  showNewTicketDialog: boolean;
  acceptModalOpen: boolean;
  ticketToAccept: string | null;
  isAccepting: boolean;
  transferModalOpen: boolean;
  ticketToTransfer: string | null;
  closeConfirmOpen: boolean;
  ticketToClose: { id: string; isPending: boolean } | null;
  isClosing: boolean;
}
