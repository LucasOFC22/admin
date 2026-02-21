
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { n8nChatService } from '@/services/n8n/chatService';

interface QuoteChatProps {
  quote: any;
  currentUser: any;
  onMessageSent?: (quoteId: string) => void;
}

const QuoteChat: React.FC<QuoteChatProps> = ({ 
  quote, 
  currentUser, 
  onMessageSent 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quote?.id) return;
    
    const loadMessages = async () => {
      try {
        const msgs = await n8nChatService.getMessages(quote.id);
        setMessages(msgs);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    };

    loadMessages();
  }, [quote?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Usuário';
    
    if (user.nome && user.nome.trim()) {
      return user.nome.trim();
    }
    
    if (user.name && user.name.trim()) {
      return user.name.trim();
    }
    
    if (user.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Usuário';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !quote?.id || isSending) return;

    setIsSending(true);
    try {
      const senderName = getUserDisplayName(currentUser);
      
      const messageData = {
        isAdmin: false,
        mensagem: newMessage.trim(),
        nomeRemetente: senderName,
        remetente: 'user' as const
      };
      
      await n8nChatService.sendMessage(quote.id, messageData);
      setNewMessage('');
      
      if (onMessageSent) {
        onMessageSent(quote.id);
      }

      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem foi enviada para nossa equipe.",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderIcon = (message: any) => {
    if (!message.isAdmin) {
      return <User className="h-4 w-4 text-white" />;
    }
    
    if (message.sender === 'bot' || message.sender === 'system') {
      return <Bot className="h-4 w-4 text-white" />;
    }
    
    return <User className="h-4 w-4 text-white" />;
  };

  const getSenderColor = (message: any) => {
    if (!message.isAdmin) {
      return 'bg-gradient-to-br from-corporate-500 to-corporate-600';
    }
    
    if (message.sender === 'bot' || message.sender === 'system') {
      return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
    
    return 'bg-gradient-to-br from-blue-500 to-blue-600';
  };

  const getSenderDisplayName = (message: any) => {
    if (!message.isAdmin) {
      return 'Você';
    }
    
    if (message.sender === 'bot' || message.sender === 'system') {
      return 'Sistema';
    }
    
    if (message.nomeRemetente && message.nomeRemetente.trim()) {
      return message.nomeRemetente.trim();
    }
    
    return 'Atendente';
  };

  const getSenderBadgeText = (message: any) => {
    if (!message.isAdmin) {
      return 'Cliente';
    }
    
    if (message.sender === 'bot' || message.sender === 'system') {
      return 'Sistema';
    }
    
    return message.jobTitle || 'Atendente';
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      return format(date, 'HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar timestamp:', error);
      return '';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-corporate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-corporate-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-corporate-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-corporate-800">
                Chat da Cotação
              </CardTitle>
              <p className="text-sm text-corporate-600">
                Converse diretamente com nossa equipe
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white border-corporate-200">
            {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Inicie uma conversa
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Envie uma mensagem para nossa equipe. Responderemos o mais breve possível!
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${!message.isAdmin ? 'justify-end' : 'justify-start'} group/message`}
                  >
                    <div className={`flex max-w-[80%] ${!message.isAdmin ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                      <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                        <AvatarFallback className={`text-xs font-bold ${getSenderColor(message)} text-white`}>
                          {getSenderIcon(message)}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex flex-col ${!message.isAdmin ? 'items-end' : 'items-start'} space-y-1`}>
                        <div className={`flex items-center gap-2 ${!message.isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs font-medium text-gray-600">
                            {getSenderDisplayName(message)}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 ${getSenderColor(message)} text-white border-transparent`}
                          >
                            {getSenderBadgeText(message)}
                          </Badge>
                        </div>
                        
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-full break-words shadow-sm border ${
                            !message.isAdmin
                              ? 'bg-gradient-to-br from-corporate-500 to-corporate-600 text-white rounded-br-md border-corporate-500'
                              : 'bg-white text-gray-800 rounded-bl-md border-gray-200'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.mensagem}
                          </p>
                        </div>

                        <span className="text-xs text-gray-400 px-1">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
        
        <div className="border-t bg-gray-50 p-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] max-h-[120px] resize-none border-gray-200 focus:border-corporate-500 bg-white"
                rows={1}
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-gradient-to-r from-corporate-500 to-corporate-600 hover:from-corporate-600 hover:to-corporate-700 text-white px-4 py-2 h-[44px] shadow-md"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <MessageCircle size={12} />
            Nossa equipe responderá em breve
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteChat;
