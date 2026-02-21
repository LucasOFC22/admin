import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoMessageProps {
  url: string;
  caption?: string;
  isSaved?: boolean;
  onClick: () => void;
  onError?: () => void;
  onRetry?: () => void;
  isLoading?: boolean;
  hasFailed?: boolean;
}

export const VideoMessage: React.FC<VideoMessageProps> = memo(({
  url,
  caption,
  isSaved,
  onClick,
  onError,
  onRetry,
  isLoading,
  hasFailed
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [duration, setDuration] = useState<string>('');
  const [isInView, setIsInView] = useState(false);

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
      { rootMargin: '200px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
    onError?.();
  };

  const handleLoadedMetadata = () => {
    setThumbnailLoaded(true);
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60);
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  if (hasFailed || videoError) {
    return (
      <div className="bg-muted border border-border rounded-lg p-4 flex items-center gap-3 min-w-[200px]">
        <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground block">Vídeo não carregou</span>
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
          thumbnailLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div 
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-background/30 to-transparent"
          style={{ animationDuration: '1.5s' }} 
        />
        <div className="absolute inset-0 flex items-center justify-center min-h-[180px] min-w-[200px]">
          {isLoading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground/60 animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-background/40 flex items-center justify-center backdrop-blur-sm">
              <Play className="h-7 w-7 text-muted-foreground/60 ml-1" />
            </div>
          )}
        </div>
      </div>
      
      {/* Thumbnail do vídeo - só renderiza quando está em view */}
      {isInView && url ? (
        <div 
          className="relative cursor-pointer"
          onClick={onClick}
        >
          <video
            ref={videoRef}
            src={url}
            className={cn(
              "max-w-full rounded-lg transition-opacity duration-300",
              thumbnailLoaded ? "opacity-100" : "opacity-0"
            )}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
            style={{ maxHeight: '250px', objectFit: 'contain', minHeight: thumbnailLoaded ? 'auto' : '180px' }}
          />
          
          {/* Play button overlay */}
          {thumbnailLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
              <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm hover:scale-105 transition-transform">
                <Play className="h-7 w-7 text-white fill-white ml-1" />
              </div>
            </div>
          )}
          
          {/* Duração */}
          {duration && thumbnailLoaded && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[180px] min-w-[200px] rounded-lg" />
      )}
      
      {/* Badge de salvo */}
      {isSaved && thumbnailLoaded && (
        <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
          Salvo
        </div>
      )}
      
      {/* Caption */}
      {caption && thumbnailLoaded && (
        <div className="mt-1 px-1">
          <p className="text-sm break-words">{caption}</p>
        </div>
      )}
    </div>
  );
});

VideoMessage.displayName = 'VideoMessage';
