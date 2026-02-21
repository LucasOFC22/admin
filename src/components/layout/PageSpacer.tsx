import React from 'react';

interface PageSpacerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PageSpacer = ({ className = '', size = 'md' }: PageSpacerProps) => {
  const sizes = {
    sm: 'pt-16 md:pt-20',
    md: 'pt-20 md:pt-24 lg:pt-28',
    lg: 'pt-24 md:pt-28 lg:pt-32'
  };

  return <div className={`${sizes[size]} ${className}`} />;
};

export default PageSpacer;