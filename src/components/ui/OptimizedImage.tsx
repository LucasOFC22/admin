import React, { useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
}

// ✅ OTIMIZAÇÃO: Componente de imagem otimizada
const OptimizedImage = React.memo(({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  priority = false,
  onLoad
}: OptimizedImageProps) => {
  // ✅ OTIMIZAÇÃO 1: Gerar srcSet responsivo
  const srcSet = useMemo(() => {
    if (!src.includes('unsplash.com')) return undefined;
    
    const baseSrc = src.split('?')[0];
    const params = new URLSearchParams(src.split('?')[1] || '');
    
    return [
      `${baseSrc}?${params.toString()}&w=400 400w`,
      `${baseSrc}?${params.toString()}&w=800 800w`,
      `${baseSrc}?${params.toString()}&w=1200 1200w`,
      `${baseSrc}?${params.toString()}&w=1600 1600w`
    ].join(', ');
  }, [src]);

  // ✅ OTIMIZAÇÃO 2: Sizes responsivas
  const sizes = useMemo(() => {
    return '(max-width: 640px) 400px, (max-width: 1024px) 800px, (max-width: 1280px) 1200px, 1600px';
  }, []);

  // ✅ OTIMIZAÇÃO 3: WebP/AVIF support
  const optimizedSrc = useMemo(() => {
    if (!src.includes('unsplash.com')) return src;
    
    const url = new URL(src);
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('q', '80');
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    
    return url.toString();
  }, [src, width, height]);

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : loading}
      decoding="async"
      onLoad={onLoad}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: width && height ? `${width}px ${height}px` : 'auto'
      }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ✅ OTIMIZAÇÃO: Hook para intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const targetRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [targetRef, isIntersecting] as const;
};

// ✅ OTIMIZAÇÃO: Componente com lazy loading
export const LazyOptimizedImage = React.memo(({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'blur'
}: OptimizedImageProps & { placeholder?: 'blur' | 'empty' }) => {
  const [ref, isIntersecting] = useIntersectionObserver();
  const [loaded, setLoaded] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!loaded && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      {/* Imagem principal */}
      {isIntersecting && (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          loading="lazy"
        />
      )}
    </div>
  );
});

LazyOptimizedImage.displayName = 'LazyOptimizedImage';

export default OptimizedImage;