import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogsHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  data?: unknown[];
  filename?: string;
}

export const LogsHeader: React.FC<LogsHeaderProps> = ({
  title,
  description,
  icon,
  onRefresh,
  isRefreshing = false,
  data,
  filename = 'logs',
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {data && data.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        )}
      </div>
    </div>
  );
};

export default LogsHeader;
