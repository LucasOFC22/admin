import { useState, useMemo, useCallback } from 'react';
import { CargoComDepartamento } from '@/types/database';

/**
 * ✅ NOVO: Hook reutilizável para filtros de cargos
 * Segue princípio DRY e melhora manutenibilidade
 */

export interface CargosFilters {
  searchTerm: string;
  departmentFilter: string;
  statusFilter: string;
}

export const useCargosFilters = (cargos: CargoComDepartamento[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ PERFORMANCE: Memoizar cargos filtrados
  const filteredCargos = useMemo(() => {
    return cargos.filter(cargo => {
      const matchesSearch = cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cargo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || departmentFilter === 'all' || 
                               (cargo.departamento_info?.nome === departmentFilter);
      
      const matchesStatus = !statusFilter || statusFilter === 'all' || 
                           (statusFilter === 'ativo' && cargo.ativo !== false) ||
                           (statusFilter === 'inativo' && cargo.ativo === false);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [cargos, searchTerm, departmentFilter, statusFilter]);

  // ✅ PERFORMANCE: Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => 
    Boolean(searchTerm || (departmentFilter && departmentFilter !== 'all') || (statusFilter && statusFilter !== 'all')),
    [searchTerm, departmentFilter, statusFilter]
  );

  // ✅ PERFORMANCE: useCallback para handlers estáveis
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setStatusFilter('all');
  }, []);

  const updateFilter = useCallback((filter: Partial<CargosFilters>) => {
    if (filter.searchTerm !== undefined) setSearchTerm(filter.searchTerm);
    if (filter.departmentFilter !== undefined) setDepartmentFilter(filter.departmentFilter);
    if (filter.statusFilter !== undefined) setStatusFilter(filter.statusFilter);
  }, []);

  return {
    filters: {
      searchTerm,
      departmentFilter,
      statusFilter
    },
    filteredCargos,
    hasActiveFilters,
    setSearchTerm,
    setDepartmentFilter,
    setStatusFilter,
    clearFilters,
    updateFilter
  };
};
