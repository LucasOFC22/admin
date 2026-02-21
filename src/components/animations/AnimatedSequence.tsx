
import React from 'react';
import { useScrollAnimationSequence, ScrollAnimationOptions } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedSequenceProps {
  children: React.ReactNode[];
  animation?: string;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  options?: ScrollAnimationOptions;
}

const AnimatedSequence: React.FC<AnimatedSequenceProps> = ({
  children,
  animation = 'slide-up',
  className,
  itemClassName,
  staggerDelay = 100,
  options = {},
}) => {
  const { elementRef, visibleItems } = useScrollAnimationSequence(children.length, options);

  return (
    <div ref={elementRef as any} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-600',
            !visibleItems[index] && 'opacity-0 translate-y-8',
            visibleItems[index] && `animate-${animation}`,
            itemClassName
          )}
          style={{
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default AnimatedSequence;
