import React, { memo, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'fade-in' | 'scale-up';

interface SmoothRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
}

const getAnimationClasses = (animation: AnimationType, isVisible: boolean): string => {
  const baseClasses = 'transition-all ease-out';
  
  if (!isVisible) {
    switch (animation) {
      case 'fade-up':
        return `${baseClasses} opacity-0 translate-y-12`;
      case 'fade-down':
        return `${baseClasses} opacity-0 -translate-y-12`;
      case 'fade-left':
        return `${baseClasses} opacity-0 translate-x-12`;
      case 'fade-right':
        return `${baseClasses} opacity-0 -translate-x-12`;
      case 'scale-up':
        return `${baseClasses} opacity-0 scale-90`;
      default:
        return `${baseClasses} opacity-0`;
    }
  }

  return `${baseClasses} opacity-100 translate-x-0 translate-y-0 scale-100`;
};

const SmoothReveal = memo<SmoothRevealProps>(({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  className,
  threshold = 0.1,
  as: Component = 'div',
}) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold,
    triggerOnce: true,
  });

  const animationClasses = useMemo(
    () => getAnimationClasses(animation, isVisible),
    [animation, isVisible]
  );

  const style = useMemo(
    () => ({
      transitionDuration: `${duration}ms`,
      transitionDelay: `${delay}ms`,
    }),
    [duration, delay]
  );

  return React.createElement(
    Component,
    {
      ref: elementRef,
      className: cn(animationClasses, className),
      style,
    },
    children
  );
});

SmoothReveal.displayName = "SmoothReveal";

export default SmoothReveal;
