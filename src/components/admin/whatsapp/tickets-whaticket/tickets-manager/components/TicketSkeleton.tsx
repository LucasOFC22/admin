import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketSkeletonProps {
  count?: number;
}

const TicketSkeletonItem: React.FC = () => (
  <div className="flex items-center gap-3 p-3 border-b border-border/50">
    {/* Avatar */}
    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
    
    {/* Content */}
    <div className="flex-1 min-w-0 space-y-2">
      {/* Name and time */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      
      {/* Message preview */}
      <Skeleton className="h-3 w-full max-w-[200px]" />
      
      {/* Queue badge */}
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

export const TicketSkeleton: React.FC<TicketSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="w-full h-full overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <TicketSkeletonItem key={index} />
      ))}
    </div>
  );
};

TicketSkeleton.displayName = 'TicketSkeleton';
