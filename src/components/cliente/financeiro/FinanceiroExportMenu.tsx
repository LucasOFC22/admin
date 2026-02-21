import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  exportFinanceiroToCSV, 
  exportFinanceiroToExcel, 
  exportFinanceiroToPDF 
} from '@/utils/financeiroConsultarExport';
import { FinanceiroItem, FinanceiroSummary } from '@/components/pdf/FinanceiroConsultarPDF';

interface FinanceiroExportMenuProps {
  items: FinanceiroItem[];
  summary: FinanceiroSummary;
  periodo: string;
  documento?: string;
  disabled?: boolean;
}

export const FinanceiroExportMenu: React.FC<FinanceiroExportMenuProps> = ({
  items,
  summary,
  periodo,
  documento,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast({
        title: 'Nenhum Dado',
        description: 'Não há títulos para exportar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting('csv');
      exportFinanceiroToCSV(items, periodo);
      toast({
        title: 'Exportação Concluída',
        description: `${items.length} título(s) exportado(s) para CSV`
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar para CSV',
        variant: 'destructive'
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast({
        title: 'Nenhum Dado',
        description: 'Não há títulos para exportar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting('excel');
      exportFinanceiroToExcel(items, summary, periodo, documento);
      toast({
        title: 'Exportação Concluída',
        description: `${items.length} título(s) exportado(s) para Excel`
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar para Excel',
        variant: 'destructive'
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (items.length === 0) {
      toast({
        title: 'Nenhum Dado',
        description: 'Não há títulos para exportar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting('pdf');
      await exportFinanceiroToPDF(items, summary, periodo, documento);
      toast({
        title: 'Exportação Concluída',
        description: `${items.length} título(s) exportado(s) para PDF`
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível exportar para PDF',
        variant: 'destructive'
      });
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={disabled || isExporting || items.length === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleExportExcel}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span>Exportar Excel</span>
          {exporting === 'excel' && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-red-600" />
          <span>Exportar PDF</span>
          {exporting === 'pdf' && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportCSV}
          disabled={isExporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Exportar CSV</span>
          {exporting === 'csv' && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FinanceiroExportMenu;
