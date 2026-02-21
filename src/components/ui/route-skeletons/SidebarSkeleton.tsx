import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarSkeletonProps {
  expanded?: boolean;
  isMobile?: boolean;
}

const SidebarSkeleton: React.FC<SidebarSkeletonProps> = ({ 
  expanded = true,
  isMobile = false 
}) => {
  return (
    <div 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col animate-pulse",
        isMobile ? "fixed left-0 top-0 h-screen z-[110] w-80" : "relative h-screen z-30",
        !isMobile && (expanded ? "w-56" : "w-16")
      )}
    >
      {/* Header skeleton */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        {expanded ? (
          <div className="h-8 bg-gray-200 rounded w-32" />
        ) : (
          <div className="h-8 w-8 bg-gray-200 rounded mx-auto" />
        )}
      </div>
      
      {/* Menu items skeleton */}
      <div className="flex-1 p-2 space-y-1">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "rounded-lg",
              expanded ? "h-10 px-3 flex items-center gap-3" : "h-10 w-10 mx-auto"
            )}
          >
            <div className="h-5 w-5 bg-gray-200 rounded" />
            {expanded && <div className="h-4 bg-gray-200 rounded flex-1" />}
          </div>
        ))}
      </div>
      
      {/* Footer skeleton */}
      <div className="border-t border-gray-200 p-3">
        <div className={cn(
          "bg-gray-200 rounded",
          expanded ? "h-10 w-full" : "h-10 w-10 mx-auto"
        )} />
      </div>
    </div>
  );
};

export default SidebarSkeleton;
