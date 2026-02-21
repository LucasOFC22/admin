import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TicketHeaderSkeleton } from './TicketHeaderSkeleton';

interface TicketHeaderProps {
  children: ReactNode;
  onBack?: () => void;
  loading?: boolean;
  tags?: string[];
}

// Search bar height to match left panel
const SEARCH_BAR_HEIGHT = 53;

export const TicketHeader: React.FC<TicketHeaderProps> = ({ children, onBack, loading, tags }) => {
  if (loading) {
    return <TicketHeaderSkeleton />;
  }

  return (
    <div 
      className="flex items-center justify-between w-full" 
      style={{
        background: 'var(--background)',
        height: `${SEARCH_BAR_HEIGHT}px`,
        minHeight: `${SEARCH_BAR_HEIGHT}px`,
        maxHeight: `${SEARCH_BAR_HEIGHT}px`,
        padding: '0 4px'
      }}
    >
      <div className="flex items-center flex-1 min-w-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden flex-shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};
