/**
 * Date formatting utilities - CANONICAL SOURCE
 * All date formatting functions consolidated here.
 * Other modules (dateUtils, lib/formatters) re-export from here.
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Core date parser ───────────────────────────────────────────────

/**
 * Ensures a value is converted to a Date object or returns null.
 * Handles Date, string, number, Firestore Timestamp, and {seconds} objects.
 */
export const ensureDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  if (typeof dateValue === 'string') {
    // Try parseISO first for better accuracy
    const parsed = parseISO(dateValue);
    if (isValid(parsed)) return parsed;
    // Fallback to native Date
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  // Firestore Timestamp support
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Object with seconds (Firestore format)
  if (typeof dateValue === 'object' && dateValue !== null && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }

  return null;
};

// ─── Simple formatters ──────────────────────────────────────────────

/**
 * Format date as DD/MM/YYYY (timezone-safe for ISO strings)
 */
export const formatDateOnly = (date: string | Date | number | null | undefined): string => {
  if (!date) return '-';

  // For ISO strings, extract date components directly to avoid timezone shifts
  if (typeof date === 'string') {
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [_, year, month, day] = dateMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Format date as DD/MM/YYYY (alias for formatDateOnly)
 */
export const formatDate = (date: string | Date | number | any): string => {
  return formatDateOnly(date);
};

/**
 * Format date as DD/MM/YYYY HH:mm
 */
export const formatDateTime = (date: string | Date | number | any): string => {
  if (!date) return '-';
  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

// ─── Detailed formatters ────────────────────────────────────────────

/**
 * Format as "DD/MM/YYYY às HH:mm"
 */
export const formatTimestamp = (timestamp: string | Date | number | null | undefined): string => {
  if (!timestamp) return '-';
  const dateObj = ensureDate(timestamp);
  if (!dateObj) return '-';
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

/**
 * Format as "DD/MM/YYYY às HH:mm:ss"
 */
export const formatTimestampFull = (timestamp: string | Date | number | null | undefined): string => {
  if (!timestamp) return '-';
  const dateObj = ensureDate(timestamp);
  if (!dateObj) return '-';
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
};

/**
 * Format as "DD de MMMM de YYYY às HH:mm" (e.g. "15 de Janeiro de 2024 às 14:30")
 */
export const formatDateLong = (date: string | Date | number | null | undefined): string => {
  if (!date) return '-';
  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
};

/**
 * Format as long date without time (e.g. "15 de Janeiro de 2024")
 */
export const formatDateLongOnly = (date: string | Date | number | null | undefined): string => {
  if (!date) return '-';
  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

// ─── Relative time ──────────────────────────────────────────────────

/**
 * Format as relative time using date-fns (e.g. "há 2 horas")
 */
export const formatRelativeTime = (date: string | Date | number | null | undefined): string => {
  if (!date) return '-';
  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
};

/**
 * Format as compact relative time (e.g. "5min atrás", "2h atrás")
 */
export const formatTimeAgo = (timestamp: Date | string | null | undefined): string => {
  if (!timestamp) return '-';
  const dateObj = ensureDate(timestamp);
  if (!dateObj) return '-';

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}sem atrás`;

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mês${diffInMonths > 1 ? 'es' : ''} atrás`;
};

/**
 * Smart date formatting for chat-like UIs:
 * - Today: "HH:mm"
 * - Yesterday: "Ontem"
 * - This week: weekday abbreviation
 * - Older: "DD/MM"
 */
export const formatSmartDate = (dateStr: string | Date | number | null | undefined): string => {
  if (!dateStr) return '';
  const date = ensureDate(dateStr);
  if (!date) return '';

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return format(date, 'HH:mm', { locale: ptBR });
  } else if (diffDays === 1) {
    return 'Ontem';
  } else if (diffDays < 7) {
    return format(date, 'EEE', { locale: ptBR });
  }
  return format(date, 'dd/MM', { locale: ptBR });
};

// ─── Range & utility ────────────────────────────────────────────────

/**
 * Format a date range as "DD/MM/YYYY - DD/MM/YYYY"
 */
export const formatDateRange = (from: Date | undefined, to: Date | undefined): string => {
  if (!from && !to) return 'Período não definido';
  if (!from) return `Até ${formatDateOnly(to)}`;
  if (!to) return `A partir de ${formatDateOnly(from)}`;
  return `${formatDateOnly(from)} - ${formatDateOnly(to)}`;
};

/**
 * Format time only (passthrough)
 */
export const formatTimeOnly = (time: string | null | undefined): string => {
  if (!time) return 'Não informado';
  return time;
};

/**
 * Format date with custom format string
 */
export const formatCustomDate = (
  date: string | Date | number | null | undefined,
  formatString: string
): string => {
  if (!date) return '-';
  const dateObj = ensureDate(date);
  if (!dateObj) return '-';
  return format(dateObj, formatString, { locale: ptBR });
};

/**
 * Create a Firestore-like timestamp object from a Date
 */
export const createTimestamp = (date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0
});

// ─── Aliases for backward compatibility ─────────────────────────────

/** @deprecated Use formatDate */
export const formatDateValue = formatDate;

/** @deprecated Use formatDate */
export const formatDateBR = formatDate;

/** @deprecated Use formatDateTime */
export const formatDateTimeBR = formatDateTime;
