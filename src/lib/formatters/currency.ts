/**
 * Formatação de valores monetários (BRL)
 */

/**
 * Formata valor como moeda brasileira
 * Aceita number, string, null ou undefined
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

/**
 * Formata valor como moeda compacta (e.g. "R$ 1,5k" para valores >= 1000)
 */
export const formatCurrencyCompact = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  if (Math.abs(numericValue) >= 1000) {
    return `R$ ${(numericValue / 1000).toFixed(1)}k`;
  }
  return formatCurrency(numericValue);
};

/**
 * Formata input de moeda enquanto usuário digita
 */
export const formatCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return '';
  
  const number = parseInt(numericValue) / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(number);
};

/**
 * Parse string de moeda para número
 */
export const parseCurrencyInput = (value: string): number => {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return 0;
  return parseInt(numericValue) / 100;
};

/**
 * Formata valor para exibição com separador de milhar (ex: 1.000,00)
 */
export const formatValorInput = (value: string): string => {
  let cleaned = value.replace(/[^\d,]/g, '');
  const parts = cleaned.split(',');
  let integerPart = parts[0] || '';
  let decimalPart = parts[1] !== undefined ? parts[1].slice(0, 2) : '';
  
  if (integerPart.length > 3) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  if (parts.length > 1) {
    return `${integerPart},${decimalPart}`;
  }
  return integerPart;
};

/**
 * Converte valor formatado BR (ex: "1.000,50") para número float
 */
export const parseValorToNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};
