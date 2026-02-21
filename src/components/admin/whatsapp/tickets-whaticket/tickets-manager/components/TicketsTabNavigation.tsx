import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';

interface TicketsTabNavigationProps {
  currentTab: 'open' | 'pending';
  openCount: number;
  pendingCount: number;
  onTabChange: (tab: 'open' | 'pending') => void;
}

export const TicketsTabNavigation: React.FC<TicketsTabNavigationProps> = ({
  currentTab,
  openCount,
  pendingCount,
  onTabChange
}) => {
  return (
    <div className="relative">
      <div className="flex relative">
        <button
          onClick={() => onTabChange('open')}
          className="flex-1 py-2 sm:py-3 px-2 border-none bg-transparent cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <div className="relative">
              <MessageSquare 
                className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-colors ${
                  currentTab === 'open' ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>
            <p className={`m-0 text-[9px] sm:text-[10px] font-semibold transition-colors ${
              currentTab === 'open' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              Atendendo
            </p>
          </div>
        </button>
        <button
          onClick={() => onTabChange('pending')}
          className="flex-1 py-2 sm:py-3 px-2 border-none bg-transparent cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <div className="relative">
              <Clock 
                className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-colors ${
                  currentTab === 'pending' ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>
            <p className={`m-0 text-[9px] sm:text-[10px] font-semibold transition-colors ${
              currentTab === 'pending' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              Aguardando
            </p>
          </div>
        </button>
        {/* Animated indicator */}
        <div
          className="absolute bottom-0 h-0.5 w-1/2 bg-primary transition-transform duration-300"
          style={{
            transform: currentTab === 'open' ? 'translateX(0%)' : 'translateX(100%)'
          }}
        />
      </div>
    </div>
  );
};
