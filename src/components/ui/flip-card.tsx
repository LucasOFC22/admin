import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface FlipCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
}

const FlipCard = ({ icon: Icon, title, description, className, style }: FlipCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn("flip-box relative h-[320px] sm:h-[340px] overflow-hidden rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300", className)}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Front */}
      <div className={cn(
        "flip-box-front absolute inset-0 bg-white p-6 flex flex-col items-center justify-center text-center transition-transform duration-500 ease-in-out",
        isHovered ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="inline-flex p-4 rounded-lg bg-corporate-50 text-corporate-600 mb-4">
          <Icon size={32} className="sm:w-10 sm:h-10" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">
          {title}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </div>

      {/* Back */}
      <div className={cn(
        "flip-box-back absolute inset-0 bg-gradient-to-br from-corporate-600 to-corporate-700 p-6 flex flex-col items-center justify-center text-center text-white transition-transform duration-500 ease-in-out",
        isHovered ? "translate-y-0" : "translate-y-full"
      )}>
        <h3 className="text-xl sm:text-2xl font-bold mb-4">
          {title}
        </h3>
        <p className="text-white/90 text-sm sm:text-base mb-6 leading-relaxed">
          {description}
        </p>
        <Button 
          variant="outline" 
          className="bg-white text-corporate-700 hover:bg-gray-100 border-white font-semibold"
        >
          SAIBA MAIS
        </Button>
      </div>
    </div>
  );
};

export default FlipCard;
