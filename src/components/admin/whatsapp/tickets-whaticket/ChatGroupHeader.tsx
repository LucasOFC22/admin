import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, History, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatHistoryModal } from './ChatHistoryModal';

interface ChatGroupHeaderProps {
  chatId: number;
  startDate: string;
  isCurrentChat: boolean;
  messageCount: number;
  onViewNotes?: (chatId: number) => void;
}

export const ChatGroupHeader: React.FC<ChatGroupHeaderProps> = ({
  chatId,
  startDate,
  isCurrentChat,
  messageCount,
  onViewNotes,
}) => {
  const [showModal, setShowModal] = useState(false);
  const formattedDate = format(new Date(startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const handleClick = () => {
    if (!isCurrentChat) {
      setShowModal(true);
    }
  };

  const handleViewNotes = () => {
    onViewNotes?.(chatId);
  };

  return (
    <>
      <div className="flex justify-center my-3">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          className={cn(
            "px-4 py-2 rounded-xl inline-flex flex-col items-center transition-all duration-200",
            !isCurrentChat && "cursor-pointer hover:shadow-md active:scale-[0.98]"
          )}
          style={{
            backgroundColor: isCurrentChat ? '#dcf8c6' : '#e1f3fb',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div 
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: '#64748b' }}
          >
            {isCurrentChat ? (
              <MessageSquare className="h-3.5 w-3.5" />
            ) : (
              <History className="h-3.5 w-3.5" />
            )}
            <span>Conversa #{chatId}</span>
            <span>•</span>
            <span className="uppercase text-[10px] tracking-wide font-semibold">
              {isCurrentChat ? 'Atual' : 'Histórico'}
            </span>
            {!isCurrentChat && <ChevronRight className="h-3 w-3" />}
          </div>
          <div 
            className="text-[11px] mt-0.5"
            style={{ color: '#8696a0' }}
          >
            {formattedDate} • {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
          </div>
        </motion.div>
      </div>

      <ChatHistoryModal
        open={showModal}
        onClose={() => setShowModal(false)}
        chatId={chatId}
        startDate={startDate}
        messageCount={messageCount}
        onViewNotes={handleViewNotes}
      />
    </>
  );
};