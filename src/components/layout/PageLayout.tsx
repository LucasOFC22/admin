
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const PageLayout = ({ title, subtitle, icon: Icon, children, className = "" }: PageLayoutProps) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-gray-600" />}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
