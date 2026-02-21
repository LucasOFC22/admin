import React, { useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  fileName?: string;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName
}) => {
  const [zoom, setZoom] = React.useState(1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `download.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar:', error);
      window.open(mediaUrl, '_blank');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      {/* Header com botões */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <div className="text-white text-sm truncate max-w-[50%]">
          {fileName || 'Mídia'}
        </div>
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div 
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Imagem"
            className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[85vh]"
          />
        )}
      </div>
    </div>
  );
};