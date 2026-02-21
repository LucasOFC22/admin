import React, { memo } from 'react';
import { Message } from '@/services/ticketService';
import { Image, Video, FileAudio, Mic, FileText, MapPin, User, File, Camera } from 'lucide-react';
import { FormattedWhatsAppText } from '@/utils/whatsappFormatting';

interface QuotedMessageProps {
  quotedMsg: Message;
  fromMe: boolean;
  onClick?: () => void;
}

// Forma de onda estilizada para áudio - estilo WhatsApp
const AudioWaveform: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg viewBox="0 0 42 16" className="w-10 h-3.5">
    <rect x="0" y="5" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    <rect x="4" y="3" width="2" height="10" rx="1" fill={color} opacity="0.7" />
    <rect x="8" y="1" width="2" height="14" rx="1" fill={color} opacity="0.9" />
    <rect x="12" y="4" width="2" height="8" rx="1" fill={color} opacity="0.6" />
    <rect x="16" y="2" width="2" height="12" rx="1" fill={color} opacity="0.8" />
    <rect x="20" y="5" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    <rect x="24" y="3" width="2" height="10" rx="1" fill={color} opacity="0.7" />
    <rect x="28" y="6" width="2" height="4" rx="1" fill={color} opacity="0.4" />
    <rect x="32" y="4" width="2" height="8" rx="1" fill={color} opacity="0.6" />
    <rect x="36" y="5" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    <rect x="40" y="6" width="2" height="4" rx="1" fill={color} opacity="0.3" />
  </svg>
);

// Informações de mídia por tipo
const getMediaInfo = (mediaType: string | undefined) => {
  switch (mediaType) {
    case 'image':
      return { icon: Camera, label: 'Foto' };
    case 'video':
      return { icon: Video, label: 'Vídeo' };
    case 'audio':
      return { icon: FileAudio, label: 'Áudio' };
    case 'ptt':
      return { icon: Mic, label: 'Mensagem de voz' };
    case 'document':
      return { icon: FileText, label: 'Documento' };
    case 'sticker':
      return { icon: Image, label: 'Figurinha' };
    case 'location':
      return { icon: MapPin, label: 'Localização' };
    case 'vcard':
    case 'multi_vcard':
      return { icon: User, label: 'Contato' };
    default:
      return null;
  }
};

const QuotedMessage: React.FC<QuotedMessageProps> = memo(({ quotedMsg, fromMe, onClick }) => {
  const mediaInfo = getMediaInfo(quotedMsg.mediaType);
  
  // Quem enviou a mensagem citada
  const quotedFromMe = quotedMsg.fromMe;
  
  // Cores estilo WhatsApp - verde para você, azul para contato
  const indicatorColor = quotedFromMe ? '#00a884' : '#53bdeb';
  const senderColor = quotedFromMe ? '#00a884' : '#53bdeb';
  
  // Background baseado na bolha atual (outgoing vs incoming)
  const bgColor = fromMe 
    ? 'rgba(0, 0, 0, 0.05)' 
    : 'rgba(0, 0, 0, 0.03)';

  // Nome do remetente
  const senderName = quotedFromMe ? 'Você' : (quotedMsg.contact?.name || 'Contato');

  // Verificar tipos de mídia
  const hasVisualMedia = quotedMsg.mediaType === 'image' || 
                         quotedMsg.mediaType === 'video' || 
                         quotedMsg.mediaType === 'sticker';
  
  const hasMediaPreview = hasVisualMedia && quotedMsg.mediaUrl;
  const isAudio = quotedMsg.mediaType === 'audio' || quotedMsg.mediaType === 'ptt';

  // Cor do texto do preview
  const textColor = 'rgba(0, 0, 0, 0.6)';

  // Renderizar conteúdo da preview
  const renderPreviewContent = () => {
    if (isAudio) {
      const isPtt = quotedMsg.mediaType === 'ptt';
      return (
        <div className="flex items-center gap-1.5">
          <Mic size={13} style={{ color: isPtt ? '#53bdeb' : textColor }} />
          <AudioWaveform color={isPtt ? '#53bdeb' : textColor} />
        </div>
      );
    }
    
    if (mediaInfo) {
      const MediaIcon = mediaInfo.icon;
      const bodyText = quotedMsg.body && !quotedMsg.body.startsWith('http') ? quotedMsg.body : '';
      
      return (
        <span className="flex items-center gap-1" style={{ color: textColor }}>
          <MediaIcon size={13} className="flex-shrink-0" />
          <span className="truncate">{bodyText || mediaInfo.label}</span>
        </span>
      );
    }
    
    return (
      <span style={{ color: textColor }} className="line-clamp-1">
        <FormattedWhatsAppText text={quotedMsg.body || 'Mensagem'} />
      </span>
    );
  };

  return (
    <div
      className="flex overflow-hidden rounded-lg mb-1.5 cursor-pointer transition-all duration-150 hover:brightness-95 active:scale-[0.99]"
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Indicador colorido à esquerda */}
      <div 
        className="w-[3px] flex-shrink-0 rounded-l-lg"
        style={{ backgroundColor: indicatorColor }}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center min-w-0 py-2 px-2.5 gap-2">
        {/* Informações de texto */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Nome do remetente */}
          <div 
            className="text-[13px] font-medium truncate leading-tight"
            style={{ color: senderColor }}
          >
            {senderName}
          </div>
          
          {/* Preview da mensagem */}
          <div className="text-[12px] truncate leading-snug mt-0.5">
            {renderPreviewContent()}
          </div>
        </div>

        {/* Preview de mídia visual */}
        {hasMediaPreview && (
          <div className="relative flex-shrink-0 rounded-md overflow-hidden shadow-sm">
            <img 
              src={quotedMsg.mediaUrl}
              alt=""
              className="w-12 h-12 object-cover"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
            {quotedMsg.mediaType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-6 h-6 bg-white/95 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-0 h-0 border-l-[7px] border-l-gray-700 border-y-[5px] border-y-transparent ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Placeholder para documento/outros sem preview */}
        {mediaInfo && !hasMediaPreview && !isAudio && (
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
          >
            <File size={20} style={{ color: textColor }} />
          </div>
        )}
      </div>
    </div>
  );
});

QuotedMessage.displayName = 'QuotedMessage';

export { QuotedMessage };
export default QuotedMessage;
