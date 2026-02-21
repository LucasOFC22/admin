
import React from 'react';
import { useScrollAnimation, ScrollAnimationOptions } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export type AnimationType = 
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'zoom-in'
  | 'fade-in-delayed'
  | 'bounce-in'
  | 'rotate-in'
  | 'flip-in'
  | 'slide-in-blur';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  className?: string;
  delay?: number;
  duration?: string;
  options?: ScrollAnimationOptions;
  as?: keyof JSX.IntrinsicElements;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fade-in',
  className,
  delay = 0,
  duration = '0.4s',
  options = {},
  as: Component = 'div',
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    delay,
    ...options,
  });

  const getInitialState = () => {
    switch (animation) {
      case 'slide-up':
        return 'opacity-0 translate-y-4';
      case 'slide-down':
        return 'opacity-0 -translate-y-4';
      case 'slide-left':
        return 'opacity-0 translate-x-4';
      case 'slide-right':
        return 'opacity-0 -translate-x-4';
      case 'scale-in':
      case 'zoom-in':
        return 'opacity-0 scale-98';
      case 'bounce-in':
        return 'opacity-0 scale-95 translate-y-2';
      case 'rotate-in':
        return 'opacity-0 rotate-2 scale-98';
      case 'flip-in':
        return 'opacity-0 rotate-y-12 scale-98';
      case 'slide-in-blur':
        return 'opacity-0 translate-x-4 blur-[1px]';
      default:
        return 'opacity-0';
    }
  };

  const getAnimatedState = () => {
    switch (animation) {
      case 'slide-up':
      case 'slide-down':
        return 'opacity-100 translate-y-0';
      case 'slide-left':
      case 'slide-right':
        return 'opacity-100 translate-x-0';
      case 'scale-in':
      case 'zoom-in':
        return 'opacity-100 scale-100';
      case 'bounce-in':
        return 'opacity-100 scale-100 translate-y-0';
      case 'rotate-in':
        return 'opacity-100 rotate-0 scale-100';
      case 'flip-in':
        return 'opacity-100 rotate-y-0 scale-100';
      case 'slide-in-blur':
        return 'opacity-100 translate-x-0 blur-0';
      default:
        return 'opacity-100';
    }
  };

  const getTransitionClass = () => {
    switch (animation) {
      case 'bounce-in':
        return 'transition-all duration-500 ease-out';
      case 'rotate-in':
        return 'transition-all duration-400 ease-out';
      case 'flip-in':
        return 'transition-all duration-500 ease-out';
      case 'slide-in-blur':
        return 'transition-all duration-500 ease-out';
      default:
        return 'transition-all';
    }
  };

  return React.createElement(
    Component,
    {
      ref: elementRef,
      className: cn(
        getTransitionClass(),
        !isVisible ? getInitialState() : getAnimatedState(),
        className
      ),
      style: {
        transitionDuration: duration,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
    children
  );
};

export default AnimatedSection;
