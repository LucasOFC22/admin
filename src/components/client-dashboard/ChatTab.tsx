
import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ChatTab = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: 'user' | 'support', timestamp: string}>>([]);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada para o suporte."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat com Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScrollArea className="h-64 border rounded p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Inicie uma conversa com nosso suporte</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatTab;
