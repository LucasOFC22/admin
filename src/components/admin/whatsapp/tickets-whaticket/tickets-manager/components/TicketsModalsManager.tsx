import React from 'react';
import NewTicketDialog from '../../NewTicketDialog';
import { AcceptTicketModal } from '../../AcceptTicketModal';
import { TransferTicketModal } from '../../TransferTicketModal';
import { CloseTicketModal } from '@/components/admin/whatsapp/CloseTicketModal';
import { ModalState } from '../types';

interface TicketsModalsManagerProps {
  modals: ModalState;
  filas: Array<{ id: number; name: string; color: string }>;
  tickets: any[];
  onCloseNewTicketDialog: () => void;
  onCloseAcceptModal: () => void;
  onCloseTransferModal: () => void;
  onCloseCloseConfirm: () => void;
  onAcceptWithQueue: (queueId?: string, queueName?: string) => void;
  onTransfer: (options: { queueId?: string; userId?: string; message?: string }) => void;
  onConfirmClose: (silent: boolean) => void;
  canCloseSilently?: boolean;
}

export const TicketsModalsManager: React.FC<TicketsModalsManagerProps> = ({
  modals,
  filas,
  tickets,
  onCloseNewTicketDialog,
  onCloseAcceptModal,
  onCloseTransferModal,
  onCloseCloseConfirm,
  onAcceptWithQueue,
  onTransfer,
  onConfirmClose,
  canCloseSilently = false
}) => {
  const queuesFormatted = filas.map(f => ({ id: String(f.id), name: f.name, color: f.color || '#6b7280' }));

  return (
    <>
      {modals.showNewTicketDialog && (
        <NewTicketDialog 
          open={modals.showNewTicketDialog}
          onOpenChange={onCloseNewTicketDialog}
        />
      )}

      <AcceptTicketModal
        open={modals.acceptModalOpen}
        onClose={onCloseAcceptModal}
        onAccept={onAcceptWithQueue}
        queues={queuesFormatted}
        isLoading={modals.isAccepting}
      />

      <TransferTicketModal
        open={modals.transferModalOpen}
        onClose={onCloseTransferModal}
        onTransfer={onTransfer}
        queues={queuesFormatted}
        ticket={tickets.find(t => t.id === modals.ticketToTransfer)}
      />

      <CloseTicketModal
        open={modals.closeConfirmOpen}
        onClose={onCloseCloseConfirm}
        onConfirm={onConfirmClose}
        isPending={modals.ticketToClose?.isPending}
        canCloseSilently={canCloseSilently}
        isLoading={modals.isClosing}
      />
    </>
  );
};
