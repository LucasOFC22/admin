import React from 'react';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { ChatSearchResult, MessageSearchResult } from '@/hooks/useGlobalMessageSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GlobalSearchResultsProps {
  searchTerm: string;
  chatResults: ChatSearchResult[];
  messageResults: MessageSearchResult[];
  isSearching: boolean;
  onSelectChat: (chatId: number) => void;
  onSelectMessage: (chatId: number, messageId: string) => void;
}

const highlightText = (text: string, term: string): React.ReactNode => {
  if (!term || term.length < 2) return text;
  
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? (
      <span key={i} className="bg-primary/30 text-primary-foreground rounded px-0.5 font-medium">
        {part}
      </span>
    ) : part
  );
};

// Use smart date formatting from centralized utility
import { formatSmartDate } from '@/utils/dateFormatters';
const formatDate = (dateStr: string): string => formatSmartDate(dateStr);

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({
  searchTerm,
  chatResults,
  messageResults,
  isSearching,
  onSelectChat,
  onSelectMessage
}) => {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
        <span className="text-muted-foreground text-sm">Buscando...</span>
      </div>
    );
  }

  if (!searchTerm || searchTerm.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
        <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <span className="text-muted-foreground">Digite pelo menos 2 caracteres para buscar</span>
      </div>
    );
  }

  if (chatResults.length === 0 && messageResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
        <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <span className="text-lg font-medium mb-1">Nenhum resultado</span>
        <span className="text-muted-foreground text-sm">
          Nenhuma conversa ou mensagem encontrada para "{searchTerm}"
        </span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {/* Seção Chats */}
        {chatResults.length > 0 && (
          <div>
            <div className="sticky top-0 bg-muted/50 backdrop-blur px-4 py-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chats ({chatResults.length})
              </span>
            </div>
            <div className="divide-y divide-border/50">
              {chatResults.map((chat) => (
                <div
                  key={`chat-${chat.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectChat(chat.chatId)}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={chat.avatar} alt={chat.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {chat.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        {highlightText(chat.nome, searchTerm)}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(chat.lastMessageDate)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {chat.lastMessage || 'Sem mensagens'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção Mensagens */}
        {messageResults.length > 0 && (
          <div>
            <div className="sticky top-0 bg-muted/50 backdrop-blur px-4 py-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5" />
                Mensagens ({messageResults.length})
              </span>
            </div>
            <div className="divide-y divide-border/50">
              {messageResults.map((msg) => (
                <div
                  key={`msg-${msg.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectMessage(msg.chatId, msg.id)}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={msg.avatar} alt={msg.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {msg.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-foreground truncate text-sm">
                          {msg.nome}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {msg.telefone}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {highlightText(msg.message_text, searchTerm)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
