import { useState, useMemo, useCallback } from 'react';

/**
 * Configuração de um filtro individual
 */
interface FilterConfig<T> {
  /** Valor inicial do filtro (padrão: '') */
  initial?: string;
  /** Função que testa se o item passa no filtro. Recebe o item e o valor atual do filtro */
  match: (item: T, value: string) => boolean;
}

/**
 * Configuração de ordenação
 */
interface SortConfig<T> {
  /** Opções de ordenação disponíveis (chave → comparador) */
  options: Record<string, (a: T, b: T) => number>;
  /** Chave de ordenação padrão */
  defaultKey: string;
}

/**
 * Opções do hook useSearchAndFilter
 */
interface UseSearchAndFilterOptions<T, F extends string = string> {
  /** Array de dados a ser filtrado */
  data: T[];
  /** Configuração dos filtros (nome → config) */
  filters: Record<F, FilterConfig<T>>;
  /** Configuração de ordenação (opcional) */
  sort?: SortConfig<T>;
  /** Itens por página (0 = sem paginação) */
  itemsPerPage?: number;
}

/**
 * Hook genérico para busca, filtro, ordenação e paginação de listas.
 *
 * @example
 * const { filtered, paged, filterValues, setFilter, page, setPage, totalPages } = useSearchAndFilter({
 *   data: manifestos,
 *   filters: {
 *     search: { match: (m, v) => m.nome.toLowerCase().includes(v.toLowerCase()) },
 *     status: { initial: 'all', match: (m, v) => v === 'all' || m.status === v },
 *   },
 *   sort: {
 *     options: {
 *       nome: (a, b) => a.nome.localeCompare(b.nome),
 *       data: (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
 *     },
 *     defaultKey: 'data',
 *   },
 *   itemsPerPage: 20,
 * });
 */
export function useSearchAndFilter<T, F extends string = string>({
  data,
  filters,
  sort,
  itemsPerPage = 0,
}: UseSearchAndFilterOptions<T, F>) {
  // Inicializar valores dos filtros
  const initialValues = useMemo(() => {
    const values = {} as Record<F, string>;
    for (const key of Object.keys(filters) as F[]) {
      values[key] = filters[key].initial ?? '';
    }
    return values;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filterValues, setFilterValues] = useState<Record<F, string>>(initialValues);
  const [sortKey, setSortKey] = useState(sort?.defaultKey ?? '');
  const [currentPage, setCurrentPage] = useState(1);

  const setFilter = useCallback((key: F, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterValues(initialValues);
    setCurrentPage(1);
  }, [initialValues]);

  // Filtrar
  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter(item => {
      for (const key of Object.keys(filters) as F[]) {
        const value = filterValues[key];
        if (!filters[key].match(item, value)) return false;
      }
      return true;
    });
  }, [data, filterValues, filters]);

  // Ordenar
  const sorted = useMemo(() => {
    if (!sort || !sortKey || !sort.options[sortKey]) return filtered;
    return [...filtered].sort(sort.options[sortKey]);
  }, [filtered, sort, sortKey]);

  // Paginar
  const totalPages = itemsPerPage > 0 ? Math.max(1, Math.ceil(sorted.length / itemsPerPage)) : 1;
  
  const safePage = Math.min(currentPage, totalPages);

  const paged = useMemo(() => {
    if (itemsPerPage <= 0) return sorted;
    const start = (safePage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, safePage, itemsPerPage]);

  return {
    /** Dados filtrados e ordenados (sem paginação) */
    filtered: sorted,
    /** Dados filtrados, ordenados e paginados */
    paged,
    /** Valores atuais de cada filtro */
    filterValues,
    /** Atualizar um filtro específico */
    setFilter,
    /** Resetar todos os filtros */
    resetFilters,
    /** Chave de ordenação atual */
    sortKey,
    /** Alterar ordenação */
    setSortKey,
    /** Página atual */
    page: safePage,
    /** Ir para página */
    setPage: setCurrentPage,
    /** Total de páginas */
    totalPages,
    /** Total de itens filtrados */
    totalFiltered: sorted.length,
  };
}
