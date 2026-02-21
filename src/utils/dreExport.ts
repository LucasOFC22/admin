import React from 'react';
import { format } from 'date-fns';
import { exportToCSV, CsvColumn } from './csvExport';
import { DRELancamento, DRESummary } from '@/types/financeiro.types';
import { formatCurrency } from '@/lib/formatters';

// PDF carregado on-demand para reduzir bundle inicial
const getPDFRenderer = async () => {
  const [{ pdf }, { DREPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/DREPDF')
  ]);
  return { pdf, DREPDF };
};

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

const getTipoLabel = (tipo: string): string => {
  return tipo === 'RECEITA' ? 'Receita' : 'Despesa';
};

/**
 * Exporta dados do DRE para CSV
 */
export const exportDREToCSV = (
  lancamentos: DRELancamento[],
  dataInicial: string,
  dataFinal: string
): void => {
  const columns: CsvColumn<DRELancamento>[] = [
    { 
      key: 'data', 
      header: 'Data',
      format: (value) => formatDateForExport(value as string)
    },
    { 
      key: 'tipo', 
      header: 'Tipo',
      format: (value) => getTipoLabel(value as string)
    },
    { key: 'conta', header: 'Conta' },
    { key: 'nome', header: 'Nome/Fornecedor' },
    { key: 'cpfCnpj', header: 'CPF/CNPJ' },
    { key: 'documento', header: 'Documento' },
    { key: 'banco', header: 'Banco' },
    { 
      key: 'valor', 
      header: 'Valor',
      format: (value) => formatCurrency(value as number)
    },
    { key: 'classe', header: 'Classe' },
  ];

  const startDate = format(new Date(dataInicial), 'dd-MM-yyyy');
  const endDate = format(new Date(dataFinal), 'dd-MM-yyyy');
  const filename = `dre-${startDate}-a-${endDate}.csv`;

  exportToCSV(lancamentos, columns, filename);
};

/**
 * Exporta dados do DRE para PDF
 */
export const exportDREToPDF = async (
  lancamentos: DRELancamento[],
  resumo: DRESummary,
  dataInicial: string,
  dataFinal: string
): Promise<void> => {
  const startDate = format(new Date(dataInicial), 'dd-MM-yyyy');
  const endDate = format(new Date(dataFinal), 'dd-MM-yyyy');
  const filename = `dre-${startDate}-a-${endDate}.pdf`;

  // Carrega PDF renderer on-demand
  const { pdf, DREPDF } = await getPDFRenderer();

  // Gerar o PDF usando JSX
  const doc = React.createElement(DREPDF, {
    lancamentos,
    resumo,
    dataInicial,
    dataFinal
  });
  
  const asPdf = pdf(doc as React.ReactElement);
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
