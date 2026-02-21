import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ArrowRightLeft, X, Users } from 'lucide-react';
import { Ticket } from '@/services/ticketService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketListItemProps {
  ticket: Ticket;
  selected: boolean;
  onClick: () => void;
  onAccept?: () => void;
  onTransfer?: () => void;
  onClose?: () => void;
}

export const TicketListItem: React.FC<TicketListItemProps> = ({
  ticket,
  selected,
  onClick,
  onAccept,
  onTransfer,
  onClose
}) => {
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={cn(
        'relative flex gap-3 p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors',
        selected && 'bg-muted'
      )}
      onClick={onClick}
    >
      {/* Queue color indicator */}
      {ticket.queue && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: ticket.queue.color }}
        />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0 ml-1">
        <Avatar className="h-12 w-12">
          <AvatarImage src={ticket.contact?.profilePicUrl} />
          <AvatarFallback>
            {ticket.contact?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {ticket.unreadMessages > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">
              {ticket.unreadMessages}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">
              {ticket.contact?.name || 'Sem nome'}
            </span>
            {ticket.contact?.isGroup && (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(ticket.updatedAt), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate mb-2">
          {ticket.lastMessage || 'Sem mensagens'}
        </p>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {ticket.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] h-5"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {ticket.status === 'pending' && onAccept && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={(e) => handleAction(e, onAccept)}
            >
              <Check className="h-3 w-3 mr-1" />
              Aceitar
            </Button>
          )}
          {onTransfer && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={(e) => handleAction(e, onTransfer)}
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Transferir
            </Button>
          )}
          {ticket.status === 'open' && onClose && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={(e) => handleAction(e, onClose)}
            >
              <X className="h-3 w-3 mr-1" />
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
