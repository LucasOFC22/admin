
import { useState, useCallback } from 'react';

export interface QuotesFilters {
  remetenteCNPJ: string;
  destinatarioCNPJ: string;
  cotacaoId: string;
  status: string;
  cityFilter: string;
  freightTypeFilter: string;
  valueRangeMin: string;
  valueRangeMax: string;
  priorityFilter: string;
  dateRange: { from?: Date; to?: Date };
}

const initialFilters: QuotesFilters = {
  remetenteCNPJ: '',
  destinatarioCNPJ: '',
  cotacaoId: '',
  status: '',
  cityFilter: '',
  freightTypeFilter: '',
  valueRangeMin: '',
  valueRangeMax: '',
  priorityFilter: '',
  dateRange: {}
};

export const useQuotesFilters = () => {
  const [filters, setFilters] = useState<QuotesFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof QuotesFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'dateRange') {
        return value.from || value.to;
      }
      return value !== '' && value !== undefined && value !== null;
    });
  }, [filters]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'dateRange') {
        return value.from || value.to;
      }
      return value !== '' && value !== undefined && value !== null;
    }).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFiltersCount: getActiveFiltersCount()
  };
};
