import React, { useState } from 'react';
import { Bell, Clock, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useWhatsAppPendingChats, PendingChat } from '@/hooks/useWhatsAppPendingChats';
import {
  useWhatsAppPriorityChats,
  PriorityChat,
  getPriorityColor,
  getPriorityLabel,
} from '@/hooks/useWhatsAppPriorityChats';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  adminId: string;
  onChatSelect?: (chatId: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  adminId,
  onChatSelect,
}) => {
  const [open, setOpen] = useState(false);
  const { data: pendingChats = [], isLoading: loadingPending } = useWhatsAppPendingChats(adminId);
  const { data: priorityChats = [], isLoading: loadingPriority } = useWhatsAppPriorityChats(adminId);

  const criticalCount = priorityChats.filter((c) => c.priority_level === 'critico').length;
  const totalPending = pendingChats.length;

  const handleChatClick = (chatId: number) => {
    onChatSelect?.(chatId);
    setOpen(false);
  };

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(criticalCount > 0 || totalPending > 0) && (
            <span
              className={cn(
                'absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold',
                criticalCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
              )}
            >
              {criticalCount > 0 ? criticalCount : totalPending}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Central de Notificações
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {totalPending} aguardando • {criticalCount} críticos
          </p>
        </div>

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="priority" className="rounded-none">
              Prioridade
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-none">
              Aguardando ({totalPending})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="priority" className="m-0">
            <ScrollArea className="h-80">
              {loadingPriority ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : priorityChats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum chat ativo
                </div>
              ) : (
                <div className="divide-y">
                  {priorityChats.map((chat) => (
                    <PriorityChatItem
                      key={chat.chat_id}
                      chat={chat}
                      onClick={() => handleChatClick(chat.chat_id)}
                      formatWaitingTime={formatWaitingTime}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            <ScrollArea className="h-80">
              {loadingPending ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : pendingChats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum chat aguardando
                </div>
              ) : (
                <div className="divide-y">
                  {pendingChats.map((chat) => (
                    <PendingChatItem
                      key={chat.chat_id}
                      chat={chat}
                      onClick={() => handleChatClick(chat.chat_id)}
                      formatWaitingTime={formatWaitingTime}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

interface PriorityChatItemProps {
  chat: PriorityChat;
  onClick: () => void;
  formatWaitingTime: (minutes: number) => string;
}

const PriorityChatItem: React.FC<PriorityChatItemProps> = ({
  chat,
  onClick,
  formatWaitingTime,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {chat.priority_level === 'critico' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {chat.contact_name}
            </span>
            <Badge className={cn('text-xs', getPriorityColor(chat.priority_level))}>
              {getPriorityLabel(chat.priority_level)}
            </Badge>
            {chat.chat_type === 'pending' && (
              <Badge variant="outline" className="text-xs">
                Aguardando
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground truncate">
            {chat.last_message || 'Sem mensagem'}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatWaitingTime(chat.waiting_minutes)}
            </span>
            <span>{chat.contact_phone}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface PendingChatItemProps {
  chat: PendingChat;
  onClick: () => void;
  formatWaitingTime: (minutes: number) => string;
}

const PendingChatItem: React.FC<PendingChatItemProps> = ({
  chat,
  onClick,
  formatWaitingTime,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {chat.contact_name}
            </span>
            <Badge variant="secondary" className="text-xs">
              {chat.message_count} msgs
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground truncate">
            {chat.last_message || 'Sem mensagem'}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Aguardando há {formatWaitingTime(chat.waiting_time_minutes)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
