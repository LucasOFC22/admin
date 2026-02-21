import React, { useState, useRef, useEffect, memo } from 'react';
import { Loader2, AlertCircle, RefreshCw, Download, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageMessageProps {
  url: string;
  caption?: string;
  isSaved?: boolean;
  onClick: () => void;
  onError?: () => void;
  onRetry?: () => void;
  isLoading?: boolean;
  hasFailed?: boolean;
}

export const ImageMessage: React.FC<ImageMessageProps> = memo(({
  url,
  caption,
  isSaved,
  onClick,
  onError,
  onRetry,
  isLoading,
  hasFailed
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver para lazy loading
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } // Pre-load 300px antes de aparecer
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (hasFailed || imageError) {
    return (
      <div className="bg-muted border border-border rounded-lg p-4 flex items-center gap-3 min-w-[200px]">
        <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground block">Imagem não carregou</span>
          {caption && <span className="text-xs text-muted-foreground/70">{caption}</span>}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isLoading ? 'Baixando...' : 'Tentar Baixar'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative group max-w-[300px]">
      {/* Placeholder blur animado */}
      <div 
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-500 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-muted/80 via-muted to-muted/60",
          imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div 
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-background/30 to-transparent" 
          style={{ animationDuration: '1.5s' }} 
        />
        <div className="absolute inset-0 flex items-center justify-center min-h-[150px]">
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground/60 animate-spin" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
      </div>
      
      {/* Imagem - só renderiza quando está em view */}
      {isInView && url && (
        <img
          src={url}
          alt={caption || 'Imagem'}
          loading="lazy"
          className={cn(
            "max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-all duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onClick={onClick}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ maxHeight: '300px', objectFit: 'contain', minHeight: imageLoaded ? 'auto' : '150px' }}
        />
      )}

      {/* Placeholder mínimo quando não está em view */}
      {!isInView && (
        <div className="min-h-[150px] min-w-[200px] rounded-lg" />
      )}
      
      {/* Badge de salvo */}
      {isSaved && imageLoaded && (
        <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
          Salvo
        </div>
      )}
      
      {/* Caption */}
      {caption && imageLoaded && (
        <div className="mt-1 px-1">
          <p className="text-sm break-words">{caption}</p>
        </div>
      )}
    </div>
  );
});

ImageMessage.displayName = 'ImageMessage';
