import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import { Message, Ticket } from '@/services/ticketService';

interface ChatGroup {
  chatId: number;
  messages: Message[];
  startDate: string;
  isCurrentChat: boolean;
}

export const useMessagesState = (ticket: Ticket, messages: Message[]) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTicketId = useRef<string | null>(null);
  const hasScrolledRef = useRef(false);
  const prevMessagesCount = useRef(0);
  const scrollAttemptsRef = useRef(0);
  const [isScrollReady, setIsScrollReady] = useState(false);

  // Agrupar mensagens por chatId
  const chatGroups = useMemo((): ChatGroup[] => {
    if (!messages.length) return [];
    
    const groupsMap = new Map<number, Message[]>();
    const currentChatId = ticket.chatId;
    
    messages.forEach(msg => {
      const msgChatId = (msg as any).ticketId || currentChatId;
      if (!groupsMap.has(msgChatId)) {
        groupsMap.set(msgChatId, []);
      }
      groupsMap.get(msgChatId)!.push(msg);
    });

    const groups: ChatGroup[] = Array.from(groupsMap.entries()).map(([chatId, msgs]) => ({
      chatId,
      messages: msgs.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        if (tA !== tB) return tA - tB;
        // Desempate estável por received_at (se disponível no rawData) ou pelo id UUID
        const rA = new Date((a as any).rawData?.received_at || a.createdAt).getTime();
        const rB = new Date((b as any).rawData?.received_at || b.createdAt).getTime();
        if (rA !== rB) return rA - rB;
        // Último fallback: comparação lexicográfica do id (UUIDs gerados em sequência)
        return String(a.id).localeCompare(String(b.id));
      }),
      startDate: msgs[0]?.createdAt || new Date().toISOString(),
      isCurrentChat: chatId === currentChatId
    }));

    return groups.sort((a, b) => a.chatId - b.chatId);
  }, [messages, ticket.chatId]);

  // Reset da flag quando mudar de ticket
  useEffect(() => {
    if (ticket.id !== prevTicketId.current) {
      hasScrolledRef.current = false;
      prevMessagesCount.current = 0;
      scrollAttemptsRef.current = 0;
      prevTicketId.current = ticket.id;
      setIsScrollReady(false);
    }
  }, [ticket.id]);

  // Função de scroll robusta com múltiplas tentativas
  const scrollToBottom = (behavior: ScrollBehavior = 'instant') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Scroll inicial com múltiplas tentativas para garantir posicionamento correto
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
      prevMessagesCount.current = messages.length;
      scrollAttemptsRef.current = 0;

      // Função para tentar scroll múltiplas vezes
      const attemptScroll = () => {
        scrollToBottom('instant');
        scrollAttemptsRef.current++;
      };

      // Tentativa 1: Imediato (síncrono)
      attemptScroll();

      // Tentativa 2: Próximo frame de animação
      requestAnimationFrame(() => {
        attemptScroll();
        
        // Tentativa 3: Após micro delay para DOM estabilizar
        setTimeout(() => {
          attemptScroll();
          setIsScrollReady(true);
          
          // Tentativa 4: Backup após imagens começarem a carregar
          setTimeout(() => {
            attemptScroll();
          }, 100);
          
          // Tentativa 5: Final backup para mídias pesadas
          setTimeout(() => {
            attemptScroll();
          }, 300);
        }, 16);
      });

      return;
    }

    // Scroll suave para novas mensagens
    if (messages.length > prevMessagesCount.current) {
      prevMessagesCount.current = messages.length;
      scrollToBottom('smooth');
    }
  }, [messages.length, ticket.id]);

  // ResizeObserver para ajustar scroll quando conteúdo muda de tamanho (imagens carregando)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isScrollReady) return;

    let resizeTimeout: NodeJS.Timeout;
    let lastHeight = container.scrollHeight;
    
    const resizeObserver = new ResizeObserver(() => {
      // Só ajusta se a altura aumentou (conteúdo sendo adicionado/carregando)
      const currentHeight = container.scrollHeight;
      if (currentHeight > lastHeight && scrollAttemptsRef.current < 10) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // Verifica se está próximo do final antes de ajustar
          const isNearBottom = container.scrollTop + container.clientHeight >= lastHeight - 100;
          if (isNearBottom) {
            scrollToBottom('instant');
          }
          lastHeight = currentHeight;
        }, 50);
      }
    });

    resizeObserver.observe(container);
    
    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [isScrollReady]);

  return {
    messagesEndRef,
    containerRef,
    isScrollReady,
    chatGroups,
  };
};
