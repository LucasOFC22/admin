
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  change,
  className = ''
}) => {
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className={`text-sm ${getChangeColor(change.type)}`}>
            {change.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
