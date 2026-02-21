
import { useState } from 'react';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  sender: 'admin' | 'user';
  timestamp: Date;
}

interface LiveChatProps {
  session?: any;
}

const LiveChat = ({ session }: LiveChatProps) => {
  const [message, setMessage] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Preciso de uma cotação para transporte de São Paulo para Rio de Janeiro.',
      sender: 'user',
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '2',
      content: 'Olá! Claro, posso ajudar você com isso. Que tipo de carga será transportada?',
      sender: 'admin',
      timestamp: new Date(Date.now() - 28 * 60 * 1000)
    },
    {
      id: '3',
      content: 'São equipamentos eletrônicos, cerca de 500kg.',
      sender: 'user',
      timestamp: new Date(Date.now() - 25 * 60 * 1000)
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  if (!session) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Nenhuma conversa ativa no momento</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {session.userName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{session.userName || 'Usuário'}</CardTitle>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone size={16} />
            </Button>
            <Button variant="outline" size="sm">
              <Video size={16} />
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LiveChat;
