import React, { useState, useMemo, useCallback } from 'react';
import { Search, MessageSquare, ArrowRight, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/ticketService';

interface MessageSearchPanelProps {
  messages: Message[];
  onScrollToMessage: (messageId: string) => void;
  onSwitchToChat: () => void;
}

export const MessageSearchPanel: React.FC<MessageSearchPanelProps> = ({
  messages,
  onScrollToMessage,
  onSwitchToChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return messages.filter((msg) => {
      const body = msg.body?.toLowerCase() || '';
      return body.includes(term);
    });
  }, [messages, searchTerm]);

  const handleResultClick = useCallback((messageId: string) => {
    onSwitchToChat();
    // Small delay to allow tab switch before scrolling
    setTimeout(() => {
      onScrollToMessage(messageId);
    }, 100);
  }, [onScrollToMessage, onSwitchToChat]);

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar nas mensagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!searchTerm.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Digite para pesquisar nas mensagens</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma mensagem encontrada</p>
              <p className="text-xs mt-1">Tente outro termo de busca</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-2 mb-2">
                {filteredMessages.length} {filteredMessages.length === 1 ? 'resultado' : 'resultados'}
              </p>
              
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleResultClick(message.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    "hover:bg-muted/80 active:scale-[0.99]",
                    "border border-transparent hover:border-border",
                    "group"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      message.fromMe 
                        ? "bg-emerald-100 dark:bg-emerald-900/50" 
                        : "bg-muted"
                    )}>
                      <User className={cn(
                        "h-4 w-4",
                        message.fromMe 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-medium",
                          message.fromMe 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-foreground/80"
                        )}>
                          {message.fromMe ? 'Você' : 'Contato'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(message.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {highlightText(truncateText(message.body || ''), searchTerm)}
                      </p>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
