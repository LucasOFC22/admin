
import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface RevealOnScrollProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: string;
  className?: string;
  threshold?: number;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = '0.6s',
  className,
  threshold = 0.1
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    delay,
    threshold,
    triggerOnce: true
  });

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return 'translate-y-8 opacity-0';
      case 'down': return '-translate-y-8 opacity-0';
      case 'left': return 'translate-x-8 opacity-0';
      case 'right': return '-translate-x-8 opacity-0';
      default: return 'translate-y-8 opacity-0';
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        !isVisible ? getInitialTransform() : 'translate-x-0 translate-y-0 opacity-100',
        className
      )}
      style={{ transitionDuration: duration }}
    >
      {children}
    </div>
  );
};

export default RevealOnScroll;
