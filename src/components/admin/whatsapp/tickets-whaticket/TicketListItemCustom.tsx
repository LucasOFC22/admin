import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, ArrowLeftRight, X, Users, RotateCcw, Clock, Bot, User, Megaphone } from 'lucide-react';
import { Ticket } from '@/services/ticketService';
import { cn } from '@/lib/utils';
import { parseISO, format, isSameDay } from 'date-fns';
import { ConnectionIcon } from './ConnectionIcon';

interface TicketListItemCustomProps {
  ticket: Ticket;
  selected: boolean;
  onClick: () => void;
  onAccept?: () => void;
  onTransfer?: () => void;
  onClose?: () => void;
  onAcceptTransfer?: () => void;
  onRejectTransfer?: () => void;
  canAccept?: boolean;
  canTransfer?: boolean;
  canClose?: boolean;
  isTransferForMe?: boolean;
  isAttendingByMe?: boolean;
}

const TicketListItemCustomBase = React.forwardRef<HTMLDivElement, TicketListItemCustomProps>(
  (
    {
      ticket,
      selected,
      onClick,
      onAccept,
      onTransfer,
      onClose,
      onAcceptTransfer,
      onRejectTransfer,
      canAccept = true,
      canTransfer = true,
      canClose = true,
      isTransferForMe = false,
      isAttendingByMe = false,
    },
    ref
  ) => {
    const [loading, setLoading] = useState(false);
    const hasUnread = Number(ticket.unreadMessages) > 0;

    const handleAction = async (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      setLoading(true);
      try {
        await action();
      } finally {
        setLoading(false);
      }
    };

    const truncate = (str: string | undefined, len: number) => {
      if (!str) return '';
      if (str.length > len) return str.substring(0, len) + '...';
      return str;
    };

    const formatLastMessage = (message: string | undefined) => {
      if (!message) return '';

      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('/storage/') || lowerMsg.includes('/media/')) {
        if (lowerMsg.match(/\.(mp3|ogg|opus|wav|m4a|aac)$/i) || lowerMsg.includes('audio')) {
          return '🎵 Áudio';
        }
        if (lowerMsg.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || lowerMsg.includes('image')) {
          return '📷 Imagem';
        }
        if (lowerMsg.match(/\.(mp4|avi|mov|mkv|webm)$/i) || lowerMsg.includes('video')) {
          return '🎬 Vídeo';
        }
        if (lowerMsg.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
          return '📄 Documento';
        }
        return '📎 Arquivo';
      }

      if (lowerMsg.startsWith('data:audio') || lowerMsg.startsWith('[audio]')) {
        return '🎵 Áudio';
      }
      if (lowerMsg.startsWith('data:image') || lowerMsg.startsWith('[image]') || lowerMsg.startsWith('[imagem]')) {
        return '📷 Imagem';
      }
      if (lowerMsg.startsWith('data:video') || lowerMsg.startsWith('[video]') || lowerMsg.startsWith('[vídeo]')) {
        return '🎬 Vídeo';
      }
      if (lowerMsg.startsWith('[sticker]') || lowerMsg.startsWith('[figurinha]')) {
        return '🎴 Figurinha';
      }
      if (lowerMsg.startsWith('[document]') || lowerMsg.startsWith('[documento]')) {
        return '📄 Documento';
      }
      if (lowerMsg.startsWith('[location]') || lowerMsg.startsWith('[localização]')) {
        return '📍 Localização';
      }
      if (lowerMsg.startsWith('[contact]') || lowerMsg.startsWith('[contato]')) {
        return '👤 Contato';
      }

      return truncate(message, 40);
    };

    const formatTime = (dateStr: string) => {
      const date = parseISO(dateStr);
      if (isSameDay(date, new Date())) {
        return format(date, 'HH:mm');
      }
      return format(date, 'dd/MM/yyyy');
    };

    const profilePicUrl = ticket.contact?.profilePicUrl;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-start gap-3 p-3 cursor-pointer transition-colors',
          hasUnread && 'ticket-unread',
          selected && 'bg-muted',
          isAttendingByMe && 'bg-primary/5 border-l-4 border-l-primary'
        )}
        style={{ borderBottom: '3px solid #d9d9d9' }}
        onClick={onClick}
      >
        {/* Avatar - Left side */}
        <div className="relative flex-shrink-0 self-center">
          <Avatar
            className={cn(
              'h-[50px] w-[50px] transition-all',
              hasUnread && 'avatar-ring-purple'
            )}
            style={{
              border: hasUnread ? '3px solid #9054bc' : '3px solid transparent',
              boxSizing: 'border-box',
            }}
          >
            <AvatarImage src={profilePicUrl} />
            <AvatarFallback>
              {ticket.contact?.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content - Middle */}
        <div className="flex-1 min-w-0 pr-[90px] sm:pr-[130px]">
          {/* Row 1: Channel Icon + Name */}
          <div className="flex items-center gap-1 mb-0.5">
            {ticket.contact?.isGroup && (
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
            )}
            {ticket.whatsapp?.channel && (
              <ConnectionIcon channel={ticket.whatsapp.channel} className="flex-shrink-0" />
            )}
            <span className="font-bold text-xs sm:text-sm truncate" style={{ color: 'inherit' }}>
              {truncate(ticket.contact?.name, 60)}
            </span>
          </div>

          {/* Row 2: Last Message */}
          <p
            className={cn(
              'text-[11px] sm:text-xs truncate mb-1',
              hasUnread ? 'text-[#9054BC] font-normal' : 'text-gray-500'
            )}
          >
            {ticket.lastMessage ? formatLastMessage(ticket.lastMessage) : <br />}
          </p>

          {/* Row 3: Tags + Queue + Transfer Indicator + Chatbot + Campanha (max 3 mobile, 5 desktop) */}
          <div className="flex flex-wrap gap-0.5 sm:gap-1 items-center overflow-hidden">
            {(() => {
              const allBadges: React.ReactNode[] = [];
              const maxItems = window.innerWidth < 640 ? 3 : 5;
              let count = 0;

              // Badge de Campanha (prioridade alta - aparece primeiro)
              if (ticket.origemCampanhaId && count < maxItems) {
                allBadges.push(
                  <Tooltip key="campanha">
                    <TooltipTrigger asChild>
                      <Badge
                        className="text-[9px] sm:text-[10px] px-1 py-0 h-3.5 sm:h-4 flex items-center gap-0.5"
                        style={{
                          backgroundColor: '#f59e0b20',
                          color: '#f59e0b',
                          border: '1px solid #f59e0b',
                          borderRadius: 3,
                        }}
                      >
                        <Megaphone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">{ticket.campanhaNome || 'Campanha'}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Origem: Campanha {ticket.campanhaNome}</TooltipContent>
                  </Tooltip>
                );
                count++;
              }

              if ((ticket.modoDeAtendimento || '').toLowerCase() === 'bot' && count < maxItems) {
                allBadges.push(
                  <Tooltip key="chatbot">
                    <TooltipTrigger asChild>
                      <Badge
                        className="text-[9px] sm:text-[10px] px-1 py-0 h-3.5 sm:h-4 flex items-center gap-0.5"
                        style={{
                          backgroundColor: '#0ea5e920',
                          color: '#0ea5e9',
                          border: '1px solid #0ea5e9',
                          borderRadius: 3,
                        }}
                      >
                        <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">Chatbot</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Atendimento pelo Bot</TooltipContent>
                  </Tooltip>
                );
                count++;
              }

              if (ticket.adminIdPendente && count < maxItems) {
                allBadges.push(
                  <Tooltip key="transfer-pending">
                    <TooltipTrigger asChild>
                      <Badge
                        className="text-[9px] sm:text-[10px] px-1 py-0 h-3.5 sm:h-4 flex items-center gap-0.5"
                        style={{
                          backgroundColor: '#f59e0b20',
                          color: '#f59e0b',
                          border: '1px solid #f59e0b',
                          borderRadius: 3,
                        }}
                      >
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">Transferência</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Aguardando aceitação de transferência</TooltipContent>
                  </Tooltip>
                );
                count++;
              }

              if (ticket.tags && ticket.tags.length > 0) {
                for (const tag of ticket.tags) {
                  if (count >= maxItems - 1) break;
                  allBadges.push(
                    <Badge
                      key={`tag-${tag.id}`}
                      className="text-[9px] sm:text-[10px] px-1 py-0 h-3.5 sm:h-4 max-w-[50px] sm:max-w-none truncate"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        border: `1px solid ${tag.color}`,
                        borderRadius: 3,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  );
                  count++;
                }
              }

              if (ticket.queueId && ticket.queue?.name && (!Array.isArray(ticket.queue) || (ticket.queue as any[]).length > 0) && count < maxItems) {
                allBadges.push(
                  <Badge
                    key="fila"
                    className="text-[9px] sm:text-[10px] font-bold px-1 py-0 h-3.5 sm:h-4 max-w-[60px] sm:max-w-none truncate"
                    style={{
                      backgroundColor: ticket.queue.color || '#7c7c7c',
                      color: 'white',
                      borderRadius: 3,
                    }}
                  >
                    {ticket.queue.name.toUpperCase()}
                  </Badge>
                );
                count++;
              }

              if (ticket.user?.name && count < maxItems) {
                allBadges.push(
                  <Tooltip key="attendant">
                    <TooltipTrigger asChild>
                      <Badge
                        className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 flex items-center gap-0.5"
                        style={{
                          backgroundColor: '#3b82f620',
                          color: '#3b82f6',
                          border: '1px solid #3b82f640',
                          borderRadius: 3,
                        }}
                      >
                        <User className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        <span className="max-w-[40px] sm:max-w-[80px] truncate">{ticket.user.name}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Atendente: {ticket.user.name}</TooltipContent>
                  </Tooltip>
                );
              }

              return allBadges;
            })()}
          </div>
        </div>

        {/* Time - Top Right */}
        {ticket.updatedAt && (
          <span
            className={cn(
              'absolute top-3 right-3 text-xs',
              hasUnread ? 'text-[#9054bc] font-bold' : 'text-gray-400'
            )}
          >
            {formatTime(ticket.updatedAt)}
          </span>
        )}

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-0.5 sm:gap-1">
          {isTransferForMe && onAcceptTransfer && onRejectTransfer && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 sm:p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={(e) => handleAction(e, onAcceptTransfer)}
                  >
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Aceitar transferência</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 sm:p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={(e) => handleAction(e, onRejectTransfer)}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Recusar transferência</TooltipContent>
              </Tooltip>
            </>
          )}

          {!isTransferForMe &&
            (ticket.status === 'pending' ||
              ticket.status === 'closed' ||
              ((ticket.modoDeAtendimento || '').toLowerCase() === 'bot' && ticket.aceitoPorAdmin !== true)) &&
            onAccept &&
            canAccept && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={(e) => handleAction(e, onAccept)}
                  >
                    {ticket.status === 'closed' ? (
                      <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{ticket.status === 'closed' ? 'Reabrir' : 'Aceitar'}</TooltipContent>
              </Tooltip>
            )}

          {!isTransferForMe &&
            (ticket.status === 'open' || ticket.status === 'group' || ticket.status === 'pending') &&
            onTransfer &&
            canTransfer && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={(e) => handleAction(e, onTransfer)}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Transferir</TooltipContent>
              </Tooltip>
            )}

          {!isTransferForMe &&
            (ticket.status === 'open' || ticket.status === 'group' || ticket.status === 'pending') &&
            onClose &&
            canClose && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-0.5 sm:p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={(e) => handleAction(e, onClose)}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{ticket.status === 'pending' ? 'Ignorar' : 'Fechar'}</TooltipContent>
              </Tooltip>
            )}
        </div>
      </div>
    );
  }
);

TicketListItemCustomBase.displayName = 'TicketListItemCustomBase';

export const TicketListItemCustom = React.memo(TicketListItemCustomBase, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.ticket.updatedAt === nextProps.ticket.updatedAt &&
    prevProps.ticket.unreadMessages === nextProps.ticket.unreadMessages &&
    prevProps.ticket.lastMessage === nextProps.ticket.lastMessage &&
    prevProps.ticket.status === nextProps.ticket.status &&
    prevProps.ticket.adminIdPendente === nextProps.ticket.adminIdPendente &&
    prevProps.ticket.user?.name === nextProps.ticket.user?.name &&
    prevProps.ticket.origemCampanhaId === nextProps.ticket.origemCampanhaId &&
    prevProps.ticket.campanhaNome === nextProps.ticket.campanhaNome &&
    prevProps.isTransferForMe === nextProps.isTransferForMe &&
    prevProps.isAttendingByMe === nextProps.isAttendingByMe &&
    prevProps.canAccept === nextProps.canAccept &&
    prevProps.canTransfer === nextProps.canTransfer &&
    prevProps.canClose === nextProps.canClose
  );
});

TicketListItemCustom.displayName = 'TicketListItemCustom';