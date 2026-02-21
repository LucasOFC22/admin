
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ProposalCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description?: string;
  className?: string;
}

const ProposalCard = ({ icon: Icon, title, value, description, className = "" }: ProposalCardProps) => {
  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-corporate-100 rounded-lg">
          <Icon className="h-6 w-6 text-corporate-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
