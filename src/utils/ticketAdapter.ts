import { WhatsAppTicket, FilaWhatsApp } from '@/hooks/useWhatsAppTickets';
import { Ticket, Queue } from '@/services/ticketService';

export const adaptWhatsAppTicket = (ticket: WhatsAppTicket): Ticket => ({
  id: String(ticket.id), // ID do contato (UUID)
  uuid: String(ticket.id),
  chatId: ticket.chatId, // ID numérico do chat para buscar mensagens
  status: ticket.resolvido 
    ? 'closed' 
    : (ticket.modoDeAtendimento || '').toLowerCase() === 'atendimento humano'
      ? (ticket.aceitoPorAdmin ? 'open' : 'pending')
      : 'open', // Bot sempre fica como 'open', nunca 'pending'
  userId: ticket.adminId,
  contactId: ticket.usuarioId,
  queueId: ticket.filas?.[0],
  whatsappId: '',
  unreadMessages: ticket.unreadCount || 0,
  lastMessage: ticket.lastMessage || '',
  lastMessageAt: ticket.atualizadoEm,
  createdAt: ticket.criadoEm,
  updatedAt: ticket.atualizadoEm,
  contact: {
    id: ticket.usuarioId,
    name: ticket.nome,
    number: ticket.telefone,
    profilePicUrl: ticket.picture,
    isGroup: ticket.isGroup || false,
  },
  queue: undefined,
  user: ticket.user ? { ...ticket.user, email: '' } : undefined,
  tags: ticket.tags?.map(t => ({
    id: String(t.id),
    name: t.name,
    color: t.color
  })) || [],
  adminIdPendente: ticket.adminIdPendente,
  modoDeAtendimento: ticket.modoDeAtendimento,
  aceitoPorAdmin: ticket.aceitoPorAdmin, // Importante para verificar status
  origemCampanhaId: ticket.origemCampanhaId,
  campanhaNome: ticket.campanhaNome,
});

export const adaptFila = (fila: FilaWhatsApp): Queue => ({
  id: fila.id.toString(),
  name: fila.name,
  color: fila.color
});
