import React, { useState, useCallback, useRef } from 'react';
import logoFpTranscargas from '@/assets/logo-fptranscargas.png';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollToMessageProvider } from '@/contexts/ScrollToMessageContext';
import { TicketsManagerTabs } from './TicketsManagerTabs';
import { Ticket as TicketComponent } from './Ticket';
import { Ticket, Queue } from '@/services/ticketService';
import { useIsMobile } from '@/hooks/use-mobile';

const defaultTicketsManagerWidth = 550;
const minTicketsManagerWidth = 404;
const maxTicketsManagerWidth = 700;

interface TicketsCustomLayoutProps {
  tickets: Ticket[];
  queues: Queue[];
  selectedTicketId?: string;
  onSelectTicket: (ticketId: string | undefined) => void;
  onAcceptTicket: (ticketId: string) => void;
  onTransferTicket: (ticketId: string, queueId: string, userId?: string) => void;
  onResolveTicket: (ticketId: string, silent: boolean) => void;
  onReopenTicket?: (ticketId: string) => void;
  onSearch: (query: string, searchInMessages: boolean) => void;
  onNewTicket: () => void;
  onCloseAll: () => void;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export const TicketsCustomLayout: React.FC<TicketsCustomLayoutProps> = ({
  tickets,
  queues,
  selectedTicketId,
  onSelectTicket,
  onAcceptTicket,
  onTransferTicket,
  onResolveTicket,
  onReopenTicket,
  onSearch,
  onNewTicket,
  onCloseAll,
  isLoading,
  isAdmin
}) => {
  const isMobile = useIsMobile();
  const [ticketsManagerWidth, setTicketsManagerWidth] = useState(
    () => {
      const saved = localStorage.getItem('ticketsManagerWidth');
      return saved ? parseInt(saved, 10) : defaultTicketsManagerWidth;
    }
  );
  const ticketsManagerWidthRef = useRef(ticketsManagerWidth);
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousemove', handleMouseMove, true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newWidth = e.clientX - document.body.offsetLeft;
    if (newWidth > minTicketsManagerWidth && newWidth < maxTicketsManagerWidth) {
      ticketsManagerWidthRef.current = newWidth;
      setTicketsManagerWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    localStorage.setItem('ticketsManagerWidth', ticketsManagerWidthRef.current.toString());
  }, [handleMouseMove]);

  const handleBack = useCallback(() => {
    onSelectTicket(undefined);
  }, [onSelectTicket]);

  // No mobile: se tem ticket selecionado, mostra só a conversa
  const showTicketsList = !isMobile || !selectedTicket;
  const showMessagesPanel = !isMobile || !!selectedTicket;

  return (
    <ScrollToMessageProvider>
      <TooltipProvider>
        <div className="whaticket-layout flex h-full relative">
          {/* Shared horizontal line - positioned below search bar */}
          {!isMobile && (
            <div 
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ 
                top: '53px',
                height: '1px',
                backgroundColor: 'rgba(0, 0, 0, 0.12)'
              }}
            />
          )}
          <div className="flex h-full w-full">
            {/* Tickets Manager Panel */}
            {showTicketsList && (
              <div 
                className="relative flex flex-col h-full overflow-hidden"
                style={{ width: isMobile ? '100%' : ticketsManagerWidth }}
              >
                <TicketsManagerTabs
                  selectedTicketId={selectedTicketId}
                  onSelectTicket={onSelectTicket}
                  onAcceptTicket={onAcceptTicket}
                  onTransferTicket={(ticketId) => onSelectTicket(ticketId)}
                  onCloseTicket={(ticketId) => onResolveTicket(ticketId, false)}
                  isAdmin={isAdmin}
                />
                {/* Dragger - apenas no desktop */}
                {!isMobile && (
                  <div
                    className="absolute top-0 right-0 bottom-0 w-[5px] cursor-ew-resize z-10"
                    style={{ 
                      backgroundColor: '#f4f7f9',
                      userSelect: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                  />
                )}
              </div>
            )}

            {/* Messages Panel */}
            {showMessagesPanel && (
              <div 
                className="flex-1 flex flex-col h-full"
                style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(0, 0, 0, 0.12)' }}
              >
                {selectedTicket ? (
                  <TicketComponent
                    ticket={selectedTicket}
                    queues={queues}
                    onResolve={(silent) => onResolveTicket(selectedTicket.id, silent)}
                    onTransfer={(queueId, userId) => onTransferTicket(selectedTicket.id, queueId, userId)}
                    onReopen={onReopenTicket ? () => onReopenTicket(selectedTicket.id) : undefined}
                    isAdmin={isAdmin}
                    onBack={isMobile ? handleBack : undefined}
                  />
                ) : (
                  <div className="flex flex-col h-full" style={{ background: 'var(--whaticket-bg-light, #f5f5f5)' }}>
                    {/* Empty header to align with search bar */}
                    <div style={{ height: '53px', flexShrink: 0 }} />
                    {/* Placeholder content */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <img 
                        src={logoFpTranscargas} 
                        alt="Logo"
                        className="max-h-32 max-w-full object-contain mb-4"
                      />
                      <span className="text-base font-semibold text-muted-foreground mb-2">
                        Selecione um ticket
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Escolha um ticket na lista para iniciar o atendimento
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </ScrollToMessageProvider>
  );
};
