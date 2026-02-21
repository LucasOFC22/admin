import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function cleanNumericString(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata CNPJ ou CPF com máscara visual
 * @param value - String com números (pode ter ou não formatação)
 * @returns String formatada (XX.XXX.XXX/XXXX-XX para CNPJ ou XXX.XXX.XXX-XX para CPF)
 */
export function formatCnpjCpf(value: string): string {
  const numbers = cleanNumericString(value);
  
  if (numbers.length <= 11) {
    // CPF: XXX.XXX.XXX-XX
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

/**
 * @deprecated Use formatCurrency de @/lib/formatters
 */
export { formatCurrency } from './formatters';
