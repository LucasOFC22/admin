import React, { memo, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Message, Ticket } from '@/services/ticketService';
import { QuotedMessage } from './QuotedMessage';
import { MessageTimestamp } from './MessageTimestamp';
import { MessageContent } from './MessageContent';
import { getMessageBubbleStyle } from './messageStyles';
import { useScrollToMessage } from '@/contexts/ScrollToMessageContext';
interface MessageItemProps {
  message: Message;
  ticket: Ticket;
  showSelectMessageCheckbox: boolean;
  selectedMessages: string[];
  setSelectedMessages: (messages: string[]) => void;
  // Media handlers
  mediaUrl?: string;
  isLoading: boolean;
  hasFailed: boolean;
  needsLazyLoad: boolean;
  onLoadAndOpenMedia: (message: Message, type: 'image' | 'video') => void;
  onDownloadMedia: (message: Message) => void;
  onFetchMediaUrl: (message: Message) => void;
  onMediaError: (messageId: string) => void;
  onRetryMedia: (message: Message) => void;
  onOpenLightbox: (url: string, type: 'image' | 'video') => void;
  onContextMenu: (message: Message, event: React.MouseEvent<HTMLElement>) => void;
}

// Extrair informações do documento
const getDocumentInfo = (message: Message) => {
  const data = (message as any).rawData?.message_data || {};
  const media = data.media || {};
  const doc = media.document || data.document || {};
  return {
    fileName: doc.filename || doc.fileName || data.fileName || data.filename || undefined,
    fileSize: doc.file_size || undefined,
    mimeType: doc.mime_type || undefined
  };
};

// Extrair caption da mídia
const getMediaCaption = (message: Message): string => {
  if (message.body && !message.body.startsWith('http')) {
    return message.body;
  }
  const data = (message as any).rawData?.message_data || {};
  return data.caption || data.media?.caption || '';
};

// Verificar se mídia já foi salva no storage
const isMediaSaved = (message: Message): boolean => {
  const data = (message as any).rawData?.message_data || {};
  return data.savedToStorage === true || !!data.storageUrl;
};

// Extrair reações da mensagem
const getMessageReactions = (message: Message): Array<{
  emoji: string;
  from: string;
  timestamp: string;
}> => {
  const data = (message as any).rawData?.message_data || {};
  return data.reactions || [];
};
export const MessageItem: React.FC<MessageItemProps> = memo(({
  message,
  ticket,
  showSelectMessageCheckbox,
  selectedMessages,
  setSelectedMessages,
  mediaUrl,
  isLoading,
  hasFailed,
  needsLazyLoad,
  onLoadAndOpenMedia,
  onDownloadMedia,
  onFetchMediaUrl,
  onMediaError,
  onRetryMedia,
  onOpenLightbox,
  onContextMenu
}) => {
  const { setMessageIdToScrollTo } = useScrollToMessage();
  const bubbleStyle = useMemo(() => getMessageBubbleStyle(message.fromMe, message.isPrivate || false), [message.fromMe, message.isPrivate]);
  const docInfo = useMemo(() => getDocumentInfo(message), [message]);
  const caption = useMemo(() => getMediaCaption(message), [message]);
  const isSaved = useMemo(() => isMediaSaved(message), [message]);
  const reactions = useMemo(() => getMessageReactions(message), [message]);
  const handleCheckboxChange = useCallback((checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedMessages([...selectedMessages, message.id]);
    } else {
      setSelectedMessages(selectedMessages.filter(id => id !== message.id));
    }
  }, [message.id, selectedMessages, setSelectedMessages]);
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    onContextMenu(message, e);
  }, [message, onContextMenu]);
  
  // Handler para clicar na mensagem citada e rolar até ela
  const handleQuotedClick = useCallback(() => {
    if (message.quotedMsg?.id) {
      setMessageIdToScrollTo(message.quotedMsg.id);
    }
  }, [message.quotedMsg?.id, setMessageIdToScrollTo]);
  const handleLoadAndOpenMedia = useCallback((type: 'image' | 'video') => {
    onLoadAndOpenMedia(message, type);
  }, [message, onLoadAndOpenMedia]);
  const handleDownloadMedia = useCallback(() => {
    onDownloadMedia(message);
  }, [message, onDownloadMedia]);
  const handleFetchMediaUrl = useCallback(() => {
    onFetchMediaUrl(message);
  }, [message, onFetchMediaUrl]);
  const handleMediaError = useCallback(() => {
    onMediaError(message.id);
  }, [message.id, onMediaError]);
  const handleRetryMedia = useCallback(() => {
    onRetryMedia(message);
  }, [message, onRetryMedia]);
  // Verificar se mensagem foi deletada
  const isDeleted = message.isDeleted === true;
  
  // Verificar se mensagem foi editada
  const isEdited = message.isEdited === true;
  
  return <div className="flex" style={{
    justifyContent: message.fromMe ? 'flex-end' : 'flex-start',
    marginTop: '2px',
    marginBottom: reactions.length > 0 ? '14px' : '0px'
  }}>
      {showSelectMessageCheckbox && <Checkbox checked={selectedMessages.includes(message.id)} onCheckedChange={handleCheckboxChange} className="mr-2 mt-2" />}
      
      {!message.fromMe && <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={ticket.contact?.profilePicUrl} />
          <AvatarFallback>
            {ticket.contact?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>}

      <div className="max-w-[calc(100vw-100px)] sm:max-w-[600px] relative" style={{
        ...bubbleStyle,
        opacity: isDeleted ? 0.6 : 1
      }} onContextMenu={handleContextMenu}>
        {message.quotedMsg && (
          <QuotedMessage 
            quotedMsg={message.quotedMsg}
            fromMe={message.fromMe}
            onClick={handleQuotedClick}
          />
        )}

        {isDeleted ? (
          <div className="flex items-center gap-2 italic text-gray-500">
            <span>🚫</span>
            <span className="text-sm">Esta mensagem foi apagada</span>
          </div>
        ) : (
          <MessageContent message={message} mediaUrl={mediaUrl} caption={caption} docInfo={docInfo} isSaved={isSaved} isLoading={isLoading} hasFailed={hasFailed} needsLazyLoad={needsLazyLoad} onLoadAndOpenMedia={handleLoadAndOpenMedia} onDownloadMedia={handleDownloadMedia} onFetchMediaUrl={handleFetchMediaUrl} onMediaError={handleMediaError} onRetryMedia={handleRetryMedia} onOpenLightbox={onOpenLightbox} />
        )}

        <div className="flex items-center justify-end gap-1">
          {isEdited && !isDeleted && (
            <span className="text-[10px] text-gray-400 italic">editada</span>
          )}
          <MessageTimestamp createdAt={message.createdAt} fromMe={message.fromMe} ack={message.ack} isPrivate={message.isPrivate} />
        </div>

        {/* Reactions - WhatsApp style: bottom left corner outside bubble */}
        {reactions.length > 0 && <div style={{
        zIndex: 10
      }} className="absolute -bottom-3 left-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 shadow-md border border-[#0b141a]/30 bg-slate-50">
            {reactions.map((reaction, index) => <span key={index} className="text-base leading-none" title={`Reação de ${reaction.from}`}>
                {reaction.emoji}
              </span>)}
            {reactions.length > 1 && <span className="text-[10px] text-gray-400 ml-0.5">{reactions.length}</span>}
          </div>}
      </div>
    </div>;
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render when relevant props change
  const prevReactions = (prevProps.message as any).rawData?.message_data?.reactions || [];
  const nextReactions = (nextProps.message as any).rawData?.message_data?.reactions || [];
  return prevProps.message.id === nextProps.message.id && prevProps.message.ack === nextProps.message.ack && prevProps.message.isDeleted === nextProps.message.isDeleted && prevProps.message.isEdited === nextProps.message.isEdited && prevProps.showSelectMessageCheckbox === nextProps.showSelectMessageCheckbox && prevProps.selectedMessages.includes(prevProps.message.id) === nextProps.selectedMessages.includes(nextProps.message.id) && prevProps.mediaUrl === nextProps.mediaUrl && prevProps.isLoading === nextProps.isLoading && prevProps.hasFailed === nextProps.hasFailed && JSON.stringify(prevReactions) === JSON.stringify(nextReactions);
});
MessageItem.displayName = 'MessageItem';