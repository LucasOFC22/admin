import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatInterno, MensagemChatInterno } from '@/services/chatInterno/chatInternoService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface ChatInternoMessagesProps {
  chat?: ChatInterno;
  messages: MensagemChatInterno[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onBack?: () => void;
}

const ChatInternoMessages: React.FC<ChatInternoMessagesProps> = ({
  chat,
  messages,
  isLoading,
  onSendMessage,
  onBack
}) => {
  const { user } = useUnifiedAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  useLayoutEffect(() => {
    if (chat && messages.length > 0 && isInitialLoadRef.current) {
      scrollToBottom('auto');
      isInitialLoadRef.current = false;
    }
  }, [chat, messages.length]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && !isInitialLoadRef.current) {
      scrollToBottom('smooth');
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMessagesLengthRef.current = 0;
  }, [chat?.id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <Card className="h-full flex items-center justify-center border-0 shadow-lg bg-gradient-to-b from-card to-card/95">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Selecione uma conversa
          </h3>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Escolha uma conversa da lista ou crie uma nova para começar
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-0 shadow-lg bg-gradient-to-b from-card to-card/95">
      <CardHeader className="border-b border-border/50 flex-shrink-0 py-3 px-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium">
              {chat.titulo?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{chat.titulo}</h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Chat interno da equipe
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden bg-muted/20">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
        >
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.supabase_id;
              const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {showAvatar ? (
                    <Avatar className={`h-7 w-7 flex-shrink-0 mt-0.5 ${isOwnMessage ? 'ring-1 ring-primary/30' : 'ring-1 ring-muted'}`}>
                      <AvatarFallback className={`text-[10px] font-medium ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                        {message.sender_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-7 flex-shrink-0" />
                  )}
                  
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {showAvatar && !isOwnMessage && (
                      <span className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-1">
                        {message.sender_name}
                      </span>
                    )}
                    <div
                      className={`
                        rounded-2xl px-3.5 py-2 shadow-sm
                        ${isOwnMessage 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-card text-foreground rounded-bl-md border border-border/50'
                        }
                      `}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    <span className={`text-[10px] text-muted-foreground/70 mt-0.5 ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
                      {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>

      <div className="border-t border-border/50 p-3 flex-shrink-0 bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="resize-none min-h-[44px] max-h-[120px] rounded-xl border-border/50 bg-muted/50 focus:bg-background transition-colors text-sm"
            rows={1}
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="h-10 w-10 rounded-xl shadow-sm flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInternoMessages;
