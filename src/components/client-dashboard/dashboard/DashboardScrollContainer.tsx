
import { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DashboardScrollContainerProps {
  children: ReactNode;
  className?: string;
}

const DashboardScrollContainer = ({ children, className }: DashboardScrollContainerProps) => {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-8 pb-6">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DashboardScrollContainer;
