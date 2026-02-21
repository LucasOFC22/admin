import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { exportCalendarioToCSV, exportCalendarioToPDF } from '@/utils/calendarioFinanceiroExport';

interface FinancialItem {
  id: string;
  cliente: string;
  cpfCnpj: string;
  documento: string;
  valor: number;
  status: 'aberto' | 'atrasado' | 'liquidado';
  tipo: 'receita' | 'despesa';
  dataVencimento?: string;
  dataPagamento?: string;
}

interface FinancialSummary {
  totalReceitas: number;
  receitasRecebidas: number;
  receitasAReceber: number;
  totalDespesas: number;
  despesasPagas: number;
  despesasAPagar: number;
  qtdReceitas?: number;
  qtdDespesas?: number;
}

interface CalendarioFinanceiroExportMenuProps {
  items: FinancialItem[];
  summary: FinancialSummary;
  currentMonth: Date;
  viewMode: 'titulos' | 'pagamentos';
  disabled?: boolean;
}

export const CalendarioFinanceiroExportMenu: React.FC<CalendarioFinanceiroExportMenuProps> = ({
  items,
  summary,
  currentMonth,
  viewMode,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.warning('Não há dados para exportar. Faça uma busca primeiro.');
      return;
    }

    try {
      setIsExporting('csv');
      exportCalendarioToCSV(items, currentMonth, viewMode);
      toast.success('Arquivo CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar arquivo CSV');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (items.length === 0) {
      toast.warning('Não há dados para exportar. Faça uma busca primeiro.');
      return;
    }

    try {
      setIsExporting('pdf');
      await exportCalendarioToPDF(items, summary, currentMonth, viewMode);
      toast.success('Arquivo PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar arquivo PDF');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto"
          disabled={disabled || isExporting !== null}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {isExporting === 'csv' ? 'Exportando CSV...' : 
           isExporting === 'pdf' ? 'Gerando PDF...' : 
           'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleExportCSV}
          disabled={isExporting !== null}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPDF}
          disabled={isExporting !== null}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CalendarioFinanceiroExportMenu;
