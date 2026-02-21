import { useState } from 'react';
import { ModalState } from '../types';

export const useTicketsModals = () => {
  const [modals, setModals] = useState<ModalState>({
    showNewTicketDialog: false,
    acceptModalOpen: false,
    ticketToAccept: null,
    isAccepting: false,
    transferModalOpen: false,
    ticketToTransfer: null,
    closeConfirmOpen: false,
    ticketToClose: null,
    isClosing: false
  });

  const openNewTicketDialog = () => {
    setModals(prev => ({ ...prev, showNewTicketDialog: true }));
  };

  const closeNewTicketDialog = () => {
    setModals(prev => ({ ...prev, showNewTicketDialog: false }));
  };

  const openAcceptModal = (ticketId: string) => {
    setModals(prev => ({
      ...prev,
      acceptModalOpen: true,
      ticketToAccept: ticketId
    }));
  };

  const closeAcceptModal = () => {
    setModals(prev => ({
      ...prev,
      acceptModalOpen: false,
      ticketToAccept: null
    }));
  };

  const setIsAccepting = (value: boolean) => {
    setModals(prev => ({ ...prev, isAccepting: value }));
  };

  const setIsClosing = (value: boolean) => {
    setModals(prev => ({ ...prev, isClosing: value }));
  };

  const openTransferModal = (ticketId: string) => {
    setModals(prev => ({
      ...prev,
      transferModalOpen: true,
      ticketToTransfer: ticketId
    }));
  };

  const closeTransferModal = () => {
    setModals(prev => ({
      ...prev,
      transferModalOpen: false,
      ticketToTransfer: null
    }));
  };

  const openCloseConfirm = (ticketId: string, isPending: boolean) => {
    setModals(prev => ({
      ...prev,
      closeConfirmOpen: true,
      ticketToClose: { id: ticketId, isPending }
    }));
  };

  const closeCloseConfirm = () => {
    setModals(prev => ({
      ...prev,
      closeConfirmOpen: false,
      ticketToClose: null,
      isClosing: false
    }));
  };

  return {
    modals,
    openNewTicketDialog,
    closeNewTicketDialog,
    openAcceptModal,
    closeAcceptModal,
    setIsAccepting,
    setIsClosing,
    openTransferModal,
    closeTransferModal,
    openCloseConfirm,
    closeCloseConfirm
  };
};
