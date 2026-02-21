import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { formatDateOnly } from '@/utils/dateFormatters';
import { exportToCSV, CsvColumn } from './csvExport';
import { 
  FinanceiroConsultarPDF, 
  FinanceiroItem, 
  FinanceiroSummary 
} from '@/components/pdf/FinanceiroConsultarPDF';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/formatters';

const formatDateForExport = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const result = formatDateOnly(dateStr);
  return result === '-' ? '' : result;
};

const getStatusLabel = (status?: string): string => {
  const statusMap: Record<string, string> = {
    Liquidado: 'Liquidado',
    Pago: 'Pago',
    Pendente: 'Pendente',
    Aberto: 'Em Aberto',
    'Em Aberto': 'Em Aberto',
    Atrasado: 'Atrasado',
    Vencido: 'Vencido'
  };
  return statusMap[status || 'Pendente'] || status || 'Pendente';
};

/**
 * Exporta dados financeiros para CSV
 */
export const exportFinanceiroToCSV = (
  items: FinanceiroItem[],
  periodo: string
): void => {
  const columns: CsvColumn<FinanceiroItem>[] = [
    { key: 'doc', header: 'Documento' },
    { key: 'cliente', header: 'Cliente' },
    { key: 'docCliente', header: 'Doc. Cliente' },
    { key: 'ctes', header: 'CTe(s)' },
    { 
      key: 'emissao', 
      header: 'Emissão',
      format: (value) => formatDateForExport(value as string)
    },
    { 
      key: 'vencimento', 
      header: 'Vencimento',
      format: (value) => formatDateForExport(value as string)
    },
    { 
      key: 'dataPagamento', 
      header: 'Data Pagamento',
      format: (value) => formatDateForExport(value as string)
    },
    { 
      key: 'valorTitulo', 
      header: 'Valor Título',
      format: (value) => formatCurrency(value as number)
    },
    { 
      key: 'valorPago', 
      header: 'Valor Pago',
      format: (value) => formatCurrency(value as number)
    },
    { 
      key: 'juros', 
      header: 'Juros',
      format: (value) => formatCurrency(value as number)
    },
    { 
      key: 'saldo', 
      header: 'Saldo',
      format: (value) => formatCurrency(value as number)
    },
    { 
      key: 'status', 
      header: 'Status',
      format: (value) => getStatusLabel(value as string)
    },
  ];

  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `titulos-financeiros-${timestamp}.csv`;

  exportToCSV(items, columns, filename);
};

/**
 * Exporta dados financeiros para Excel (XLSX)
 */
export const exportFinanceiroToExcel = (
  items: FinanceiroItem[],
  summary: FinanceiroSummary,
  periodo: string,
  documento?: string
): void => {
  // Preparar dados para Excel
  const excelData = items.map(item => ({
    'Documento': item.doc || '',
    'Cliente': item.cliente || '',
    'Doc. Cliente': item.docCliente || '',
    'CTe(s)': item.ctes || '',
    'Emissão': formatDateForExport(item.emissao),
    'Vencimento': formatDateForExport(item.vencimento),
    'Data Pagamento': formatDateForExport(item.dataPagamento),
    'Valor Título': item.valorTitulo || 0,
    'Valor Pago': item.valorPago || 0,
    'Juros': item.juros || 0,
    'Saldo': item.saldo || 0,
    'Status': getStatusLabel(item.status),
  }));

  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet principal com dados
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 12 },  // Documento
    { wch: 35 },  // Cliente
    { wch: 15 },  // Doc. Cliente
    { wch: 25 },  // CTe(s)
    { wch: 12 },  // Emissão
    { wch: 12 },  // Vencimento
    { wch: 14 },  // Data Pagamento
    { wch: 14 },  // Valor Título
    { wch: 14 },  // Valor Pago
    { wch: 12 },  // Juros
    { wch: 14 },  // Saldo
    { wch: 12 },  // Status
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Títulos');

  // Criar worksheet de resumo
  const summaryData = [
    { 'Descrição': 'Período', 'Valor': periodo },
    { 'Descrição': 'Documento', 'Valor': documento || 'Todos' },
    { 'Descrição': 'Quantidade de Títulos', 'Valor': summary.qtdTitulos },
    { 'Descrição': 'Total em Títulos', 'Valor': formatCurrency(summary.totalTitulos) },
    { 'Descrição': 'Valor Pago', 'Valor': formatCurrency(summary.valorPago) },
    { 'Descrição': 'Saldo Pendente', 'Valor': formatCurrency(summary.valorPendente) },
  ];
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // Fazer download
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `titulos-financeiros-${timestamp}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Exporta dados financeiros para PDF
 */
export const exportFinanceiroToPDF = async (
  items: FinanceiroItem[],
  summary: FinanceiroSummary,
  periodo: string,
  documento?: string
): Promise<void> => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `titulos-financeiros-${timestamp}.pdf`;

  // Gerar o PDF usando JSX
  const doc = (
    <FinanceiroConsultarPDF 
      items={items} 
      summary={summary} 
      periodo={periodo}
      documento={documento}
    />
  );
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
