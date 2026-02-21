import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { exportToCSV, CsvColumn } from './csvExport';
import { formatCurrency } from '@/lib/formatters';
import { CalendarioFinanceiroPDF } from '@/components/pdf/CalendarioFinanceiroPDF';

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

// formatCurrency imported from @/lib/formatters

const formatDateForExport = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'liquidado': return 'Liquidado';
    case 'atrasado': return 'Atrasado';
    case 'aberto': return 'Aberto';
    default: return status;
  }
};

const getTipoLabel = (tipo: string): string => {
  return tipo === 'receita' ? 'Receita' : 'Despesa';
};

/**
 * Exporta dados do calendário financeiro para CSV
 */
export const exportCalendarioToCSV = (
  items: FinancialItem[],
  currentMonth: Date,
  viewMode: 'titulos' | 'pagamentos'
): void => {
  const columns: CsvColumn<FinancialItem>[] = [
    { key: 'id', header: 'ID' },
    { key: 'cliente', header: 'Cliente' },
    { key: 'cpfCnpj', header: 'CPF/CNPJ' },
    { key: 'documento', header: 'Documento' },
    { 
      key: 'valor', 
      header: 'Valor',
      format: (value) => formatCurrency(value as number)
    },
    { 
      key: 'tipo', 
      header: 'Tipo',
      format: (value) => getTipoLabel(value as string)
    },
    { 
      key: 'status', 
      header: 'Status',
      format: (value) => getStatusLabel(value as string)
    },
    { 
      key: 'dataVencimento', 
      header: 'Data Vencimento',
      format: (value) => formatDateForExport(value as string)
    },
    { 
      key: 'dataPagamento', 
      header: 'Data Pagamento',
      format: (value) => formatDateForExport(value as string)
    },
  ];

  const monthYear = format(currentMonth, 'MM-yyyy');
  const modeLabel = viewMode === 'titulos' ? 'titulos' : 'pagamentos';
  const filename = `calendario-financeiro-${modeLabel}-${monthYear}.csv`;

  exportToCSV(items, columns, filename);
};

/**
 * Exporta dados do calendário financeiro para PDF
 */
export const exportCalendarioToPDF = async (
  items: FinancialItem[],
  summary: FinancialSummary,
  currentMonth: Date,
  viewMode: 'titulos' | 'pagamentos'
): Promise<void> => {
  const monthYear = format(currentMonth, 'MM-yyyy');
  const modeLabel = viewMode === 'titulos' ? 'titulos' : 'pagamentos';
  const filename = `calendario-financeiro-${modeLabel}-${monthYear}.pdf`;

  // Gerar o PDF usando JSX
  const doc = <CalendarioFinanceiroPDF 
    items={items} 
    summary={summary} 
    currentMonth={currentMonth} 
    viewMode={viewMode} 
  />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();

  // Fazer download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
