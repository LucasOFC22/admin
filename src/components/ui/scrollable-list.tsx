
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ScrollableContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const ScrollableContainer = ({ 
  children, 
  maxHeight = "400px", 
  className 
}: ScrollableContainerProps) => {
  return (
    <ScrollArea 
      className={cn("w-full rounded-md", className)}
      style={{ maxHeight }}
    >
      <div className="pr-4">
        {children}
      </div>
    </ScrollArea>
  );
};
