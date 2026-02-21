import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Eye, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from "date-fns";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";

export interface KanbanCardTag {
  id: number;
  name: string;
  color: string;
}

export interface KanbanCardData {
  id: string;
  ticketId: number;
  uuid: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  updatedAt: string;
  unreadMessages: number;
  userName?: string;
  channel?: string;
  tags?: KanbanCardTag[];
  origemCampanhaId?: string;
  campanhaNome?: string;
}

const ChannelIcon: React.FC<{ channel?: string }> = ({ channel }) => {
  switch (channel) {
    case "facebook":
      return <FaFacebook className="h-4 w-4 text-[#3b5998]" />;
    case "instagram":
      return <FaInstagram className="h-4 w-4 text-[#e1306c]" />;
    case "whatsapp":
    default:
      return <FaWhatsapp className="h-4 w-4 text-[#25d366]" />;
  }
};

const formatTicketDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    if (isSameDay(date, new Date())) {
      return format(date, "HH:mm");
    }
    return format(date, "dd/MM/yyyy");
  } catch {
    return "";
  }
};

interface KanbanCardProps {
  card: KanbanCardData;
  isDragging?: boolean;
  onClick?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  isDragging,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border border-border rounded-lg p-2 sm:p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg scale-105",
        card.unreadMessages > 0 && "border-l-4 border-l-green-500"
      )}
    >
      {/* Campaign Badge */}
      {card.origemCampanhaId && (
        <div className="flex items-center gap-1 mb-1.5 text-xs">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 px-1.5 py-0">
            <Megaphone className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{card.campanhaNome || 'Campanha'}</span>
          </Badge>
        </div>
      )}
      
      {/* Header: Contact Name | Ticket number */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
          <ChannelIcon channel={card.channel} />
          <h4 className="font-semibold text-xs sm:text-sm truncate flex-1">
            {card.contactName}
          </h4>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap ml-1">
          #{card.ticketId}
        </span>
      </div>

      {/* Contact Number + Time */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{card.contactNumber}</span>
        <span
          className={cn(
            "text-[10px] sm:text-xs ml-1",
            card.unreadMessages > 0 ? "text-green-600 font-bold" : "text-muted-foreground"
          )}
        >
          {formatTicketDate(card.updatedAt)}
        </span>
      </div>

      {/* Last Message */}
      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mb-2 sm:mb-3">
        {card.lastMessage || "*Sem Mensagem*"}
      </p>

      {/* Footer: Button + Tags */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <Button
          size="sm"
          className="h-6 sm:h-7 text-[10px] sm:text-xs gap-1 bg-teal-600 hover:bg-teal-700 text-white px-2 sm:px-3"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <Eye className="h-3 w-3" />
          <span className="hidden xs:inline">VER</span>
        </Button>

        {card.tags?.slice(0, 2).map((tag) => (
          <Badge
            key={tag.id}
            className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name.toUpperCase().slice(0, 8)}
          </Badge>
        ))}
        {card.tags && card.tags.length > 2 && (
          <Badge className="text-[8px] sm:text-[10px] px-1 py-0.5 bg-muted text-muted-foreground">
            +{card.tags.length - 2}
          </Badge>
        )}

        {card.userName && (
          <Badge className="bg-gray-800 text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2 truncate max-w-[60px] sm:max-w-[80px]">
            {card.userName.toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
};
