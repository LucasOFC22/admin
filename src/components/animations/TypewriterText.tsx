
import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  triggerOnView?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 0,
  speed = 50,
  className,
  showCursor = true,
  triggerOnView = true,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [showBlinkingCursor, setShowBlinkingCursor] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    if ((triggerOnView && isVisible && !hasStarted) || (!triggerOnView && !hasStarted)) {
      setHasStarted(true);
      
      const startTimeout = setTimeout(() => {
        let index = 0;
        setShowBlinkingCursor(true);
        
        const typeInterval = setInterval(() => {
          if (index < text.length) {
            setDisplayText(text.slice(0, index + 1));
            index++;
          } else {
            clearInterval(typeInterval);
            if (showCursor) {
              setShowBlinkingCursor(true);
            } else {
              setShowBlinkingCursor(false);
            }
          }
        }, speed);

        return () => clearInterval(typeInterval);
      }, delay);

      return () => clearTimeout(startTimeout);
    }
  }, [isVisible, hasStarted, text, delay, speed, showCursor, triggerOnView]);

  return (
    <span ref={elementRef as any} className={cn("relative", className)}>
      {displayText}
      {showBlinkingCursor && (
        <span className="animate-blink">|</span>
      )}
    </span>
  );
};

export default TypewriterText;
