import { toast } from '@/lib/toast';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { checkQueueAccess } from '@/hooks/useTicketAccessGuard';
import { logsWhatsAppService } from '@/services/whatsapp/logsWhatsAppService';
import { ticketLimitService } from '@/services/whatsapp/ticketLimitService';

interface UseTicketsActionsParams {
  tickets: any[];
  filasPermitidas: number[];
  hasFilasRestriction: boolean;
  resolveTicket: (ticketId: string, silent?: boolean) => Promise<void>;
  cancelTicket: (ticketId: string, silent?: boolean) => Promise<void>;
  reopenTicket: (ticketId: string) => Promise<void>;
  onAcceptTicket?: (ticketId: string) => void;
  modals: {
    ticketToAccept: string | null;
    ticketToTransfer: string | null;
    ticketToClose: { id: string; isPending: boolean } | null;
  };
  closeAcceptModal: () => void;
  closeTransferModal: () => void;
  closeCloseConfirm: () => void;
  setIsAccepting: (value: boolean) => void;
  setIsClosing: (value: boolean) => void;
}

export const useTicketsActions = ({
  tickets,
  filasPermitidas,
  hasFilasRestriction,
  resolveTicket,
  cancelTicket,
  reopenTicket,
  onAcceptTicket,
  modals,
  closeAcceptModal,
  closeTransferModal,
  closeCloseConfirm,
  setIsAccepting,
  setIsClosing
}: UseTicketsActionsParams) => {

  const handleCloseAll = async () => {
    const openTicketsList = tickets.filter(t => !t.resolvido && t.ativo);
    
    if (openTicketsList.length === 0) {
      toast.info('Não há tickets abertos para fechar');
      return;
    }

    try {
      for (const ticket of openTicketsList) {
        await resolveTicket(String(ticket.id));
      }
      
      await logsWhatsAppService.registrarLog({
        acao: 'tickets_fechados_em_massa',
        detalhes: {
          quantidade: openTicketsList.length,
          ticket_ids: openTicketsList.map(t => String(t.chatId || t.id))
        }
      });
      
      toast.success(`${openTicketsList.length} tickets fechados com sucesso!`);
    } catch (error) {
      toast.error('Erro ao fechar tickets');
    }
  };

  const handleAcceptWithQueue = async (queueId?: string, queueName?: string) => {
    if (!modals.ticketToAccept) return;
    
    if (queueId && !checkQueueAccess(Number(queueId), filasPermitidas, hasFilasRestriction)) {
      toast.error('Você não tem permissão para acessar esta fila');
      return;
    }
    
    setIsAccepting(true);
    try {
      const supabase = requireAuthenticatedClient();
      // Buscar o ticket e usar o chatId correto
      const ticket = tickets.find(t => String(t.id) === String(modals.ticketToAccept));
      const chatId = ticket?.chatId;
      const isClosed = ticket?.resolvido === true;
      
      if (!chatId) {
        toast.error('Ticket não possui chat ativo');
        setIsAccepting(false);
        return;
      }
      
      if (queueId) {
        await supabase
          .from('chats_whatsapp')
          .update({ filas: [queueId] })
          .eq('id', chatId);
      }
      
      // Se ticket está fechado, usar reopenTicket, senão usar onAcceptTicket
      if (isClosed) {
        await reopenTicket(modals.ticketToAccept);
        const successMessage = queueName 
          ? `Ticket reaberto com sucesso! Departamento: ${queueName}`
          : 'Ticket reaberto com sucesso!';
        toast.success(successMessage);
      } else if (onAcceptTicket) {
        await onAcceptTicket(modals.ticketToAccept);
        const successMessage = queueName 
          ? `Ticket aceito com sucesso! Departamento: ${queueName}`
          : 'Ticket aceito com sucesso!';
        toast.success(successMessage);
      }
      
      closeAcceptModal();
    } catch (error) {
      console.error('Erro ao aceitar/reabrir ticket:', error);
      toast.error('Erro ao processar ticket');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleTransfer = async (options: { queueId?: string; userId?: string; message?: string }) => {
    if (!modals.ticketToTransfer) return;
    
    if (options.queueId && !checkQueueAccess(Number(options.queueId), filasPermitidas, hasFilasRestriction)) {
      toast.error('Você não tem permissão para transferir para esta fila');
      return;
    }
    
    try {
      const supabase = requireAuthenticatedClient();
      const ticket = tickets.find(t => t.id === modals.ticketToTransfer || t.contatoId === modals.ticketToTransfer);
      const chatId = ticket?.chatId;
      
      if (!chatId) {
        toast.error('Ticket não possui chat ativo');
        return;
      }
      
      // Obter ID do usuário atual (admin que está transferindo)
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      // Base: sempre reseta o ticket ao transferir
      const updateData: any = {
        adminid: null,
        aceitoporadmin: false,
      };
      
      // Transferência para FILA
      if (options.queueId) {
        updateData.filas = [options.queueId];
      }
      
      // Transferência para USUÁRIO
      if (options.userId) {
        updateData.adminid_pendente = options.userId;
        updateData.adminid_antigo = currentUserId;
        updateData.atualizadoem = new Date().toISOString();
      }
      
      await supabase
        .from('chats_whatsapp')
        .update(updateData)
        .eq('id', chatId);
      
      toast.success('Ticket transferido com sucesso!');
      closeTransferModal();
    } catch (error) {
      console.error('Erro ao transferir ticket:', error);
      toast.error('Erro ao transferir ticket');
    }
  };

  const handleConfirmClose = async (silent: boolean = false) => {
    if (!modals.ticketToClose) return;
    
    setIsClosing(true);
    
    try {
      const ticket = tickets.find(t => t.chatId?.toString() === modals.ticketToClose!.id || t.id === modals.ticketToClose!.id);
      const ticketId = ticket?.id || modals.ticketToClose.id;
      
      // Fechar o modal imediatamente para melhor UX
      const isPending = modals.ticketToClose.isPending;
      closeCloseConfirm();
      
      // Executar a operação em background
      if (isPending) {
        await cancelTicket(ticketId, silent);
      } else {
        await resolveTicket(ticketId, silent);
      }
    } catch (error) {
      console.error('Erro ao encerrar ticket:', error);
      toast.error('Erro ao encerrar ticket');
    } finally {
      setIsClosing(false);
    }
  };

  return {
    handleCloseAll,
    handleAcceptWithQueue,
    handleTransfer,
    handleConfirmClose
  };
};
