
import React, { useState, useEffect, useRef } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  triggerOnView?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  className,
  triggerOnView = true,
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if ((triggerOnView && isVisible && !hasStarted) || (!triggerOnView && !hasStarted)) {
      setHasStarted(true);
      
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (end - startValue) * easeOut);
        
        setCount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isVisible, hasStarted, end, duration, triggerOnView]);

  return (
    <span
      ref={elementRef as any}
      className={cn(
        "font-bold tabular-nums",
        className
      )}
    >
      {prefix}{count}{suffix}
    </span>
  );
};

export default AnimatedCounter;
