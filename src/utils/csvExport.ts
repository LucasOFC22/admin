/**
 * Utilitário para exportação de dados em CSV
 */

export interface CsvColumn<T = unknown> {
  key: string;
  header: string;
  format?: (value: unknown) => string;
}

export const exportToCSV = <T extends object>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string = 'export.csv'
) => {
  // Criar cabeçalhos
  const headers = columns.map(col => col.header).join(',');
  
  // Criar linhas de dados
  const rows = data.map(item => {
    return columns.map(col => {
      const value = (item as Record<string, unknown>)[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      
      // Escapar valores que contenham vírgulas ou aspas
      if (formattedValue === null || formattedValue === undefined) {
        return '""';
      }
      
      const stringValue = String(formattedValue);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combinar cabeçalhos e dados
  const csv = [headers, ...rows].join('\n');
  
  // Criar blob e fazer download
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Re-export from canonical source
export { formatDateTime as formatDate } from './dateFormatters';

export const formatBoolean = (value: boolean): string => {
  return value ? 'Sim' : 'Não';
};
