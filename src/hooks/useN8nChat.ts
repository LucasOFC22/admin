
import { useState, useEffect, useCallback } from 'react';
import { N8nChatService } from '@/services/n8n/n8nChatService';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'agent' | 'bot' | 'admin';
  senderName?: string;
  senderEmail?: string;
  timestamp: string;
  isRead?: boolean;
}

interface ChatSession {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  status: 'active' | 'waiting' | 'closed';
  startedAt: string;
  lastActivity: string;
  lastMessage?: string;
  unreadCount: number;
}

export const useN8nChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();

  const loadMessages = useCallback(async (targetSessionId?: string) => {
    const currentSessionId = targetSessionId || sessionId;
    if (!currentSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedMessages = await N8nChatService.getMessages(currentSessionId);
      setMessages(fetchedMessages);
    } catch (err) {
      const errorMessage = 'Erro ao carregar mensagens';
      setError(errorMessage);
      notify.error('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, notify]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedSessions = await N8nChatService.getSessions();
      setSessions(fetchedSessions);
    } catch (err) {
      const errorMessage = 'Erro ao carregar sessões';
      setError(errorMessage);
      notify.error('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  const sendMessage = useCallback(async (
    content: string,
    sender: 'user' | 'agent' | 'bot' | 'admin' = 'user',
    senderName?: string,
    senderEmail?: string
  ) => {
    if (!sessionId) {
      notify.error('Erro', 'ID da sessão não encontrado');
      return false;
    }

    // Simular digitação antes de enviar
    setIsTyping(true);
    
    // Simular tempo de digitação baseado no tamanho da mensagem
    const typingTime = Math.min(Math.max(content.length * 30, 500), 2000);
    
    try {
      // Aguardar tempo de digitação
      await new Promise(resolve => setTimeout(resolve, typingTime));
      
      const success = await N8nChatService.sendMessage({
        sessionId,
        content,
        sender,
        senderName,
        senderEmail
      });

      if (success) {
        // Recarregar mensagens após enviar
        await loadMessages();
        notify.success('Sucesso', 'Mensagem enviada');
        return true;
      } else {
        notify.error('Erro', 'Falha ao enviar mensagem');
        return false;
      }
    } catch (err) {
      notify.error('Erro', 'Erro ao enviar mensagem');
      return false;
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, loadMessages, notify]);

  const updateSessionStatus = useCallback(async (
    targetSessionId: string,
    status: 'active' | 'waiting' | 'closed'
  ) => {
    try {
      const success = await N8nChatService.updateSessionStatus(targetSessionId, status);
      if (success) {
        await loadSessions();
        notify.success('Sucesso', 'Status atualizado');
      } else {
        notify.error('Erro', 'Falha ao atualizar status');
      }
      return success;
    } catch (err) {
      notify.error('Erro', 'Erro ao atualizar status');
      return false;
    }
  }, [loadSessions, notify]);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId, loadMessages]);

  return {
    messages,
    sessions,
    isLoading,
    isTyping,
    error,
    sendMessage,
    loadMessages,
    loadSessions,
    updateSessionStatus,
    refresh: () => {
      if (sessionId) loadMessages();
      loadSessions();
    }
  };
};
