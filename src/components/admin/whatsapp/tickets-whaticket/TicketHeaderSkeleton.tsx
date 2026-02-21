import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const TicketHeaderSkeleton: React.FC = () => {
  return (
    <div 
      className="flex items-center gap-4 px-4 border-b"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        height: '65px',
      }}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
};
