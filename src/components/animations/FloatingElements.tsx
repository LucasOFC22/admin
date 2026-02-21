
import React from 'react';

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

const FloatingElements: React.FC<FloatingElementsProps> = ({ 
  count = 3, 
  className = "" 
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`absolute w-2 h-2 bg-corporate-300/20 rounded-full animate-float`}
          style={{
            left: `${20 + (index * 25)}%`,
            top: `${30 + (index * 15)}%`,
            animationDelay: `${index * 2}s`,
            animationDuration: `${6 + index}s`,
          }}
        />
      ))}
      
      {/* Elementos geométricos flutuantes */}
      <div 
        className="absolute w-16 h-16 border border-corporate-200/30 rounded-full animate-spin-slow"
        style={{
          right: '10%',
          top: '20%',
          animationDuration: '20s',
        }}
      />
      <div 
        className="absolute w-8 h-8 bg-corporate-100/40 rotate-45 animate-pulse"
        style={{
          left: '15%',
          bottom: '25%',
          animationDuration: '4s',
        }}
      />
    </div>
  );
};

export default FloatingElements;
