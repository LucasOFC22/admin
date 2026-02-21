/**
 * Módulo centralizado de formatação
 * Organizado por categoria: moeda, documento, texto, data, telefone
 */

// Moeda
export {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyInput,
  parseCurrencyInput,
  formatValorInput,
  parseValorToNumber,
} from './currency';

// Documentos (CPF, CNPJ, CEP)
export {
  formatCPFCNPJ,
  formatCNPJ,
  formatCEP,
  validateEmail,
  validateCNPJ,
  validateCPF,
  fetchCEP,
} from './document';

// Texto
export {
  generateInitials,
  truncateText,
  capitalizeFirst,
  formatFileSize,
} from './text';

// Datas - re-export do módulo canônico
export {
  formatDate,
  formatDateTime,
  formatDateBR,
  formatDateTimeBR,
  formatDateOnly,
  formatDateRange,
  formatTimeOnly,
  formatTimeAgo,
  formatTimestamp,
  formatRelativeTime,
} from '@/utils/dateFormatters';

// Telefone - re-export do módulo canônico
export { formatPhone } from '@/utils/phone';
