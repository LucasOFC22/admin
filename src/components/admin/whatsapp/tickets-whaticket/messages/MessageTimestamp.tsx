import React, { memo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { TIMESTAMP_STYLE } from './messageStyles';

interface MessageTimestampProps {
  createdAt: string;
  fromMe: boolean;
  ack?: number;
  isPrivate?: boolean;
}

const formatMessageDate = (date: string) => {
  const messageDate = new Date(date);
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm', { locale: ptBR });
  } else if (isYesterday(messageDate)) {
    return `Ontem ${format(messageDate, 'HH:mm', { locale: ptBR })}`;
  } else {
    return format(messageDate, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  }
};

const renderAckIcon = (ack?: number) => {
  if (!ack) return null;
  if (ack === 0) {
    return <Clock className="h-4 w-4" style={{ color: '#999', fontSize: '18px' }} />;
  }
  if (ack === 1) {
    return <Check className="h-4 w-4" style={{ color: '#999', fontSize: '18px' }} />;
  }
  if (ack === 2) {
    return <CheckCheck className="h-4 w-4" style={{ color: '#999', fontSize: '18px' }} />;
  }
  if (ack === 3 || ack === 4) {
    return <CheckCheck className="h-4 w-4" style={{ color: '#4285f4', fontSize: '18px' }} />;
  }
  return null;
};

export const MessageTimestamp: React.FC<MessageTimestampProps> = memo(({ 
  createdAt, 
  fromMe, 
  ack, 
  isPrivate 
}) => {
  return (
    <div style={TIMESTAMP_STYLE}>
      {isPrivate && (
        <span style={{ fontSize: '10px', marginRight: '4px' }}>
          PRIVADA
        </span>
      )}
      <span>{formatMessageDate(createdAt)}</span>
      {fromMe && renderAckIcon(ack)}
    </div>
  );
});

MessageTimestamp.displayName = 'MessageTimestamp';
