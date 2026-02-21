import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/services/ticketService';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { Bot, User, Clock, CheckCircle2 } from 'lucide-react';

interface TicketInfoProps {
  ticket: Ticket;
  onClickAvatar?: () => void;
}

type TicketStatus = 'em_atendimento' | 'aguardando' | 'chatbot' | 'encerrado';

const getTicketStatus = (ticket: Ticket): TicketStatus => {
  if (ticket.status === 'closed') return 'encerrado';
  
  const modo = (ticket.modoDeAtendimento || '').toLowerCase();
  
  if (modo === 'bot') return 'chatbot';
  
  if (modo === 'atendimento humano') {
    return ticket.aceitoPorAdmin ? 'em_atendimento' : 'aguardando';
  }
  
  // Fallback baseado no status
  if (ticket.status === 'pending') return 'aguardando';
  return 'em_atendimento';
};

const statusConfig: Record<TicketStatus, { label: string; icon: React.ElementType; bgColor: string; textColor: string }> = {
  em_atendimento: {
    label: 'Em Atendimento',
    icon: User,
    bgColor: 'hsl(142 76% 36% / 0.15)',
    textColor: 'hsl(142 76% 36%)',
  },
  aguardando: {
    label: 'Aguardando',
    icon: Clock,
    bgColor: 'hsl(45 93% 47% / 0.15)',
    textColor: 'hsl(45 93% 47%)',
  },
  chatbot: {
    label: 'Chatbot',
    icon: Bot,
    bgColor: 'hsl(199 89% 48% / 0.15)',
    textColor: 'hsl(199 89% 48%)',
  },
  encerrado: {
    label: 'Encerrado',
    icon: CheckCircle2,
    bgColor: 'hsl(220 9% 46% / 0.15)',
    textColor: 'hsl(220 9% 46%)',
  },
};

export const TicketInfo: React.FC<TicketInfoProps> = ({ ticket, onClickAvatar }) => {
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminName = async () => {
      if (!ticket.userId) {
        setAdminName(null);
        return;
      }

      try {
        const supabase = requireAuthenticatedClient();
        const { data, error } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('supabase_id', ticket.userId)
          .maybeSingle();

        if (!error && data) {
          setAdminName(data.nome);
        }
      } catch (err) {
        console.error('Erro ao buscar nome do admin:', err);
      }
    };

    fetchAdminName();
  }, [ticket.userId]);

  const status = getTicketStatus(ticket);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col flex-1 min-w-0 px-1 sm:px-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <Avatar
          className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer flex-shrink-0"
          onClick={onClickAvatar}
        >
          <AvatarImage src={ticket.contact?.profilePicUrl} />
          <AvatarFallback className="text-xs sm:text-sm">
            {ticket.contact?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[150px]">
              {ticket.contact?.name || 'Sem nome'}
            </span>
            <Badge 
              variant="outline" 
              className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-[18px] flex items-center gap-1 border-0 font-medium"
              style={{
                backgroundColor: config.bgColor,
                color: config.textColor,
              }}
            >
              <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{config.label}</span>
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:inline">
              #{String(ticket.id).substring(0, 6)}
            </span>
          </div>
          {adminName && (
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate block max-w-[120px] sm:max-w-none">
              Atribuído à: {adminName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
