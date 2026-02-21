import React from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

interface LogsExportProps {
  data: Record<string, unknown>[];
  filename?: string;
  columns?: Array<{ key: string; label: string }>;
  disabled?: boolean;
}

export const LogsExport: React.FC<LogsExportProps> = ({
  data,
  filename = 'logs',
  columns,
  disabled = false
}) => {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    // Se não houver colunas definidas, usar as chaves do primeiro objeto
    const exportColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

    const formatValue = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return format(value, 'dd/MM/yyyy HH:mm:ss');
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    const csvContent = [
      exportColumns.map(col => col.label).join(';'),
      ...data.map(row => 
        exportColumns.map(col => {
          const value = row[col.key];
          const formatted = formatValue(value);
          // Escapar aspas duplas e envolver em aspas se contiver separador
          if (formatted.includes(';') || formatted.includes('"') || formatted.includes('\n')) {
            return `"${formatted.replace(/"/g, '""')}"`;
          }
          return formatted;
        }).join(';')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    
    toast.success('Arquivo exportado com sucesso!');
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      size="sm"
      disabled={disabled || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
};

export default LogsExport;
