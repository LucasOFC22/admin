import React, { useState, useContext, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Ticket } from '@/services/ticketService';
import { MessageOptionsMenu } from './MessageOptionsMenu';
import { ReplyMessageContext } from '@/contexts/ReplyingMessageContext';
import { ForwardMessageContext } from '@/contexts/ForwardMessageContext';
import { useScrollToMessage } from '@/contexts/ScrollToMessageContext';
import { MediaLightbox } from '@/components/ui/media-lightbox';
import { ChatGroupHeader } from './ChatGroupHeader';
import { MessageItem, DateSeparator, useMessagesState, useMediaHandlers } from './messages';
import whatsBackground from '@/assets/wa-background.png';
import '@/styles/whaticket-theme.css';
import { Upload } from 'lucide-react';

interface MessagesListProps {
  ticket: Ticket;
  messages: Message[];
  onFileDrop?: (files: File[]) => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({ ticket, messages, onFileDrop }) => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; fileName?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const { showSelectMessageCheckbox, selectedMessages, setSelectedMessages } = useContext(ForwardMessageContext);
  const { messageIdToScrollTo, clearScrollTarget } = useScrollToMessage();

  // Custom hooks para estado e handlers de mídia
  const { messagesEndRef, containerRef, isScrollReady, chatGroups } = useMessagesState(ticket, messages);
  const {
    failedMediaIds,
    loadingMediaIds,
    loadedMediaUrls,
    fetchMediaUrl,
    handleMediaError,
    handleRetryMedia,
    needsLazyLoad,
    getEffectiveMediaUrl,
  } = useMediaHandlers();

  // Scroll to specific message when coming from search or quoted click
  useEffect(() => {
    if (messageIdToScrollTo && isScrollReady && messages.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Try to find by id first (UUID)
        let targetElement = document.getElementById(`message-${messageIdToScrollTo}`);
        
        // Fallback: try to find by data-message-id (wamid for quoted messages not in state)
        if (!targetElement) {
          targetElement = document.querySelector(`[data-message-id="${messageIdToScrollTo}"]`) as HTMLElement;
        }
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.classList.add('message-highlight');
          
          // Remove highlight after animation
          setTimeout(() => {
            targetElement?.classList.remove('message-highlight');
            clearScrollTarget();
          }, 2000);
        } else {
          clearScrollTarget();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [messageIdToScrollTo, isScrollReady, messages.length, clearScrollTarget]);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsDragging(false);
      }
    }
  }, [containerRef]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onFileDrop) {
      onFileDrop(files);
    }
  }, [onFileDrop]);


  // Handler para carregar e abrir mídia no lightbox
  const handleLoadAndOpenMedia = useCallback(async (message: Message, type: 'image' | 'video') => {
    const url = message.mediaUrl || loadedMediaUrls.get(message.id) || await fetchMediaUrl(message);
    if (url) {
      setLightboxMedia({ url, type });
      setLightboxOpen(true);
    }
  }, [fetchMediaUrl, loadedMediaUrls]);

  // Handler para download de mídia
  const handleDownloadMedia = useCallback(async (message: Message) => {
    const url = message.mediaUrl || loadedMediaUrls.get(message.id) || await fetchMediaUrl(message);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `media_${message.id}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [fetchMediaUrl, loadedMediaUrls]);

  const handleMessageClick = useCallback((message: Message, event: React.MouseEvent<HTMLElement>) => {
    setSelectedMessage(message);
    setMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuPosition(null);
    setSelectedMessage(null);
  }, []);

  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingMessage(selectedMessage as any);
    }
    handleCloseMenu();
  }, [selectedMessage, setReplyingMessage, handleCloseMenu]);

  const openLightbox = useCallback((url: string, type: 'image' | 'video', fileName?: string) => {
    setLightboxMedia({ url, type, fileName });
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxMedia(null);
  }, []);

  // Verificar se mídia é permanente
  const isMediaPermanent = useCallback((message: Message): boolean => {
    const rawData = (message as any).rawData || {};
    return rawData.media_permanent === true;
  }, []);

  // Verificar se mensagem tem mídia que pode ser salva
  const hasDownloadableMedia = useCallback((message: Message): boolean => {
    const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'];
    return getEffectiveMediaUrl(message) != null && mediaTypes.includes(message.mediaType || '');
  }, [getEffectiveMediaUrl]);

  // Verificar se deve mostrar separador de data
  const shouldShowDateSeparator = useCallback((messagesList: Message[], index: number): boolean => {
    if (index === 0) return true;
    return format(new Date(messagesList[index - 1].createdAt), 'yyyy-MM-dd') !== 
           format(new Date(messagesList[index].createdAt), 'yyyy-MM-dd');
  }, []);

  // Renderizar uma mensagem
  const renderMessage = useCallback((message: Message, index: number, messagesList: Message[]) => {
    const showDate = shouldShowDateSeparator(messagesList, index);
    const mediaUrl = getEffectiveMediaUrl(message);
    const isLoading = loadingMediaIds.has(message.id);
    const hasFailed = failedMediaIds.has(message.id);
    const needsLazy = needsLazyLoad(message);

    return (
      <div key={message.id} id={`message-${message.id}`} data-message-id={(message as any).rawData?.message_id}>
        {showDate && <DateSeparator date={message.createdAt} />}
        <MessageItem
          message={message}
          ticket={ticket}
          showSelectMessageCheckbox={showSelectMessageCheckbox}
          selectedMessages={selectedMessages}
          setSelectedMessages={setSelectedMessages}
          mediaUrl={mediaUrl}
          isLoading={isLoading}
          hasFailed={hasFailed}
          needsLazyLoad={needsLazy}
          onLoadAndOpenMedia={handleLoadAndOpenMedia}
          onDownloadMedia={handleDownloadMedia}
          onFetchMediaUrl={fetchMediaUrl}
          onMediaError={handleMediaError}
          onRetryMedia={handleRetryMedia}
          onOpenLightbox={openLightbox}
          onContextMenu={handleMessageClick}
        />
      </div>
    );
  }, [
    ticket,
    showSelectMessageCheckbox,
    selectedMessages,
    setSelectedMessages,
    getEffectiveMediaUrl,
    loadingMediaIds,
    failedMediaIds,
    needsLazyLoad,
    handleLoadAndOpenMedia,
    handleDownloadMedia,
    fetchMediaUrl,
    handleMediaError,
    handleRetryMedia,
    openLightbox,
    handleMessageClick,
    shouldShowDateSeparator,
  ]);

  return (
    <>
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Overlay de drag & drop - fora do container com scroll */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-primary/30 backdrop-blur-md z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="bg-background/95 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl border-2 border-dashed border-primary"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload className="h-12 w-12 text-primary" />
                </motion.div>
                <p className="text-xl font-semibold text-foreground">Solte os arquivos aqui</p>
                <p className="text-sm text-muted-foreground">Arraste imagens, vídeos ou documentos</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={containerRef}
          className="whaticket-messages whaticket-scrollbar flex-1 overflow-auto px-2 sm:px-5 pt-4 sm:pt-5 pb-2"
          style={{
            backgroundImage: `url(${whatsBackground})`,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px',
            opacity: isScrollReady ? 1 : 0,
            transition: 'opacity 0.15s ease-in-out'
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Renderizar grupos de chat - sempre mostrar headers */}
          {chatGroups.map((group) => (
            <div key={group.chatId}>
              <ChatGroupHeader
                chatId={group.chatId}
                startDate={group.startDate}
                isCurrentChat={group.chatId === ticket?.chatId}
                messageCount={group.messages.length}
              />
              {group.messages.map((message, index) =>
                renderMessage(message, index, group.messages)
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Menu de contexto */}
      {selectedMessage && (
        <MessageOptionsMenu
          message={selectedMessage}
          menuPosition={menuPosition}
          open={Boolean(menuPosition)}
          onClose={handleCloseMenu}
          onReply={handleReply}
          canSaveMedia={hasDownloadableMedia(selectedMessage)}
          isMediaPermanent={isMediaPermanent(selectedMessage)}
        />
      )}

      {/* Lightbox para imagens e vídeos */}
      {lightboxMedia && (
        <MediaLightbox
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          fileName={lightboxMedia.fileName}
        />
      )}
    </>
  );
};
