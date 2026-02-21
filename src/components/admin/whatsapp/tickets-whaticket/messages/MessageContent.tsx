import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Message } from '@/services/ticketService';
import { FormattedWhatsAppText } from '@/utils/whatsappFormatting';
import {
  AudioMessage,
  ImageMessage,
  VideoMessage,
  StickerMessage,
  DocumentMessage,
  MediaPlaceholder,
  InteractiveMessage
} from './index';
import { BODY_CONTAINER_STYLE } from './messageStyles';

interface MessageContentProps {
  message: Message;
  mediaUrl?: string;
  caption: string;
  docInfo: { fileName?: string; fileSize?: number; mimeType?: string };
  isSaved: boolean;
  isLoading: boolean;
  hasFailed: boolean;
  needsLazyLoad: boolean;
  onLoadAndOpenMedia: (type: 'image' | 'video') => void;
  onDownloadMedia: () => void;
  onFetchMediaUrl: () => void;
  onMediaError: () => void;
  onRetryMedia: () => void;
  onOpenLightbox: (url: string, type: 'image' | 'video') => void;
}

// Verificar se o body deve ser mostrado
const shouldShowBody = (message: Message): boolean => {
  const body = message.body || '';
  if (!body.trim()) return false;
  if (body.startsWith('http://') || body.startsWith('https://')) return false;
  
  const mediaTypes = ['image', 'video', 'audio', 'document', 'sticker'];
  if (message.mediaType && mediaTypes.includes(message.mediaType)) {
    return false;
  }
  
  return true;
};

export const MessageContent: React.FC<MessageContentProps> = memo(({
  message,
  mediaUrl,
  caption,
  docInfo,
  isSaved,
  isLoading,
  hasFailed,
  needsLazyLoad,
  onLoadAndOpenMedia,
  onDownloadMedia,
  onFetchMediaUrl,
  onMediaError,
  onRetryMedia,
  onOpenLightbox,
}) => {
  const rawData = (message as any).rawData || {};
  const isInteractive = rawData.message_type === 'interactive' && rawData.send !== 'cliente';

  // Renderizar mídia
  const renderMedia = () => {
    // Se não tem URL e precisa lazy load, mostrar placeholder
    if (!mediaUrl && needsLazyLoad) {
      return (
        <div className="mb-2">
          <MediaPlaceholder
            type={message.mediaType as any}
            fileName={docInfo.fileName}
            isLoading={isLoading}
            onClick={() => {
              if (message.mediaType === 'image') {
                onLoadAndOpenMedia('image');
              } else if (message.mediaType === 'video') {
                onLoadAndOpenMedia('video');
              } else if (message.mediaType === 'document') {
                onDownloadMedia();
              } else {
                onFetchMediaUrl();
              }
            }}
          />
        </div>
      );
    }

    if (!mediaUrl) return null;

    return (
      <div className="mb-2">
        {/* Imagem */}
        {(message.mediaType === 'image' || message.mediaType?.startsWith('image')) && (
          <ImageMessage
            url={mediaUrl}
            caption={caption}
            isSaved={isSaved}
            onClick={() => onOpenLightbox(mediaUrl, 'image')}
            onError={onMediaError}
            onRetry={onRetryMedia}
            isLoading={isLoading}
            hasFailed={hasFailed}
          />
        )}

        {/* Áudio */}
        {(message.mediaType === 'audio' || message.mediaType === 'ptt') && (
          <AudioMessage
            url={mediaUrl}
            fromMe={message.fromMe}
            onError={onMediaError}
          />
        )}

        {/* Vídeo */}
        {(message.mediaType === 'video' || message.mediaType?.startsWith('video')) && (
          <VideoMessage
            url={mediaUrl}
            caption={caption}
            isSaved={isSaved}
            onClick={() => onOpenLightbox(mediaUrl, 'video')}
            onError={onMediaError}
            onRetry={onRetryMedia}
            isLoading={isLoading}
            hasFailed={hasFailed}
          />
        )}

        {/* Sticker */}
        {message.mediaType === 'sticker' && (
          <StickerMessage
            url={mediaUrl}
            isSaved={isSaved}
            onError={onMediaError}
          />
        )}

        {/* Documento */}
        {message.mediaType === 'document' && (
          <DocumentMessage
            url={mediaUrl}
            fileName={docInfo.fileName}
            fileSize={docInfo.fileSize}
            mimeType={docInfo.mimeType}
            caption={caption}
            isSaved={isSaved}
            onDownload={onDownloadMedia}
            isLoading={isLoading}
            hasFailed={hasFailed}
            onRetry={onRetryMedia}
            isFromMe={message.fromMe}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Renderizar mídia */}
      {message.mediaType && message.mediaType !== 'text' && message.mediaType !== 'interactive' && (
        renderMedia()
      )}

      {/* Renderizar mensagem interativa (FlowBuilder) */}
      {isInteractive && (
        <div style={{ padding: '3px 6px 6px 6px' }}>
          <InteractiveMessage 
            data={rawData.message_data?.interactive || rawData.message_data || {}} 
            messageText={rawData.message_text}
          />
        </div>
      )}

      {/* Corpo da mensagem (texto ou caption) */}
      <div style={BODY_CONTAINER_STYLE}>
        {message.isDeleted ? (
          <div style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.36)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X className="h-4 w-4" style={{ color: '#f55d65' }} />
            Esta mensagem foi apagada
          </div>
        ) : (
          !isInteractive && shouldShowBody(message) && (
            <p className="text-sm whitespace-pre-wrap">
              <FormattedWhatsAppText text={message.body} />
            </p>
          )
        )}
      </div>
    </>
  );
});

MessageContent.displayName = 'MessageContent';
