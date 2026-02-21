
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined';
  headerActions?: React.ReactNode;
}

const PageCard = ({ 
  title, 
  description,
  children, 
  className = "", 
  variant = 'default',
  headerActions 
}: PageCardProps) => {
  return (
    <Card className={cn(
      "shadow-sm",
      variant === 'outlined' && "border-2",
      className
    )}>
      {(title || description || headerActions) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={title || description || headerActions ? "pt-0" : ""}>
        {children}
      </CardContent>
    </Card>
  );
};

export default PageCard;
