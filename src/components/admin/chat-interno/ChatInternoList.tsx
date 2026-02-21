import React from 'react';
import { MessageSquare, Clock, MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatInterno } from '@/services/chatInterno/chatInternoService';

interface ChatInternoListProps {
  chats: ChatInterno[];
  selectedChatId?: string;
  isLoading: boolean;
  onSelectChat: (chatId: string) => void;
  onEditChat?: (chat: ChatInterno) => void;
  onDeleteChat?: (chatId: string) => void;
}

const ChatInternoList: React.FC<ChatInternoListProps> = ({
  chats,
  selectedChatId,
  isLoading,
  onSelectChat,
  onEditChat,
  onDeleteChat
}) => {
  if (isLoading) {
    return (
      <Card className="h-full border-0 shadow-lg bg-gradient-to-b from-card to-card/95 flex flex-col">
        <CardHeader className="py-4 border-b border-border/50 flex-shrink-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 flex-1 overflow-auto">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (chats.length === 0) {
    return (
      <Card className="h-full border-0 shadow-lg bg-gradient-to-b from-card to-card/95 flex flex-col">
        <CardHeader className="py-4 border-b border-border/50 flex-shrink-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma conversa</h3>
            <p className="text-muted-foreground text-sm max-w-[200px]">
              Crie uma nova conversa para começar a se comunicar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-0 shadow-lg bg-gradient-to-b from-card to-card/95">
      <CardHeader className="py-4 flex-shrink-0 border-b border-border/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Conversas
          <Badge variant="secondary" className="ml-auto text-xs">
            {chats.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
        <div 
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
        >
          <div className="p-3 space-y-2">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all duration-200 relative group
                  ${selectedChatId === chat.id 
                    ? 'bg-primary/10 shadow-md ring-1 ring-primary/30' 
                    : 'hover:bg-muted/60 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <Avatar className={`h-10 w-10 ring-2 ring-offset-2 ring-offset-background transition-all ${selectedChatId === chat.id ? 'ring-primary' : 'ring-muted'}`}>
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-medium">
                      {chat.titulo?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{chat.titulo}</h4>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {chat.unreadCount > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-primary hover:bg-primary shadow-sm">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </Badge>
                        )}
                        {(onEditChat || onDeleteChat) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              {onEditChat && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onEditChat(chat);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {onDeleteChat && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    {chat.lastMessage ? (
                      <>
                        <p className="text-xs text-muted-foreground truncate leading-relaxed">
                          <span className="font-medium text-foreground/70">{chat.lastMessage.sender_name}:</span>{' '}
                          {chat.lastMessage.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(chat.lastMessage.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic">Nenhuma mensagem ainda</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInternoList;
