
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500'
};

const StatsCard = ({ title, value, change, icon: Icon, color }: StatsCardProps) => {
  const isPositive = change.startsWith('+');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className={cn(
              "text-sm mt-1",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {change} vs mês anterior
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorClasses[color]
          )}>
            <Icon className="text-white" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
