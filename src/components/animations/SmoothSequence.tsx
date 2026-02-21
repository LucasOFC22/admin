
import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface SmoothSequenceProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  animation?: 'fade-up' | 'fade-in' | 'scale-up';
  className?: string;
  itemClassName?: string;
}

const SmoothSequence: React.FC<SmoothSequenceProps> = ({
  children,
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
  animation = 'fade-up',
  className,
  itemClassName,
}) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const getItemClasses = (index: number) => {
    const baseClasses = 'transition-all ease-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'scale-up':
          return `${baseClasses} opacity-0 scale-90`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    return `${baseClasses} opacity-100 translate-y-0 scale-100`;
  };

  return (
    <div ref={elementRef as any} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(getItemClasses(index), itemClassName)}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${baseDelay + (index * staggerDelay)}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default SmoothSequence;
