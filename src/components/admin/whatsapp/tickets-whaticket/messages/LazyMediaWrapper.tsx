import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, Play } from 'lucide-react';

interface LazyMediaWrapperProps {
  children: React.ReactNode;
  isLoaded: boolean;
  type: 'image' | 'video';
  className?: string;
  aspectRatio?: string;
}

export const LazyMediaWrapper = memo(({ 
  children, 
  isLoaded, 
  type, 
  className,
  aspectRatio = 'aspect-video'
}: LazyMediaWrapperProps) => {
  return (
    <div className={cn("relative overflow-hidden rounded-lg", aspectRatio, className)}>
      {/* Placeholder blur animado */}
      <div 
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-500",
          "bg-gradient-to-br from-muted/80 via-muted to-muted/60",
          "backdrop-blur-sm",
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-background/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          {type === 'image' ? (
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-background/30 flex items-center justify-center">
              <Play className="w-6 h-6 text-muted-foreground/50 ml-0.5" />
            </div>
          )}
        </div>
      </div>
      
      {/* Conteúdo real */}
      <div className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-0"
      )}>
        {children}
      </div>
    </div>
  );
});

LazyMediaWrapper.displayName = 'LazyMediaWrapper';

// Hook para lazy loading com IntersectionObserver
export const useLazyLoad = (rootMargin = '200px') => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  const onLoad = () => setIsLoaded(true);

  return { elementRef, isInView, isLoaded, onLoad };
};
