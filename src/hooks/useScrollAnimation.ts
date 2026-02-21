
import { useEffect, useRef, useState } from 'react';

export interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const useScrollAnimation = (options: ScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -100px 0px',
    triggerOnce = true,
    delay = 0
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Verificar se o usuário prefere movimento reduzido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              if (triggerOnce) {
                setHasAnimated(true);
              }
            }, delay);
          } else {
            setIsVisible(true);
            if (triggerOnce) {
              setHasAnimated(true);
            }
          }
        } else if (!triggerOnce && !hasAnimated) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay, hasAnimated]);

  return { elementRef, isVisible };
};

export const useScrollAnimationSequence = (itemCount: number, options: ScrollAnimationOptions = {}) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleItems(new Array(itemCount).fill(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animar itens em sequência
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[i] = true;
                return newState;
              });
            }, i * 150); // Delay de 150ms entre cada item
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [itemCount, options.threshold, options.rootMargin]);

  return { elementRef, visibleItems };
};
