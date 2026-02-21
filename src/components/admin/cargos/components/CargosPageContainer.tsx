import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Building2, Loader2 } from 'lucide-react';
import PageHeader from '../../PageHeader';
import CargosStatsGrid from './CargosStatsGrid';
import CargosFiltersPanel from './CargosFiltersPanel';
import CargosGridView from './CargosGridView';
import CargosModalManager from './CargosModalManager';
import { useCargosData } from '../hooks/useCargosData';
import { useCargosFilters } from '../hooks/useCargosFilters';
import { CargoComDepartamento } from '@/types/database';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import ViewCargoDetailsModal from '../modals/ViewCargoDetailsModal';

/**
 * ✅ REFATORAÇÃO: Container principal otimizado
 * - Extração de lógica de filtros para hook customizado
 * - Memoização adequada para performance
 * - Separação clara de responsabilidades
 */
const CargosPageContainer = () => {
  const { logActivity } = useActivityLogger();
  
  // ✅ NOVO: Estado para modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // ✅ REFATORAÇÃO: Hook customizado para gerenciar dados
  const {
    cargos,
    isLoading,
    stats,
    uniqueDepartments,
    selectedCargo,
    setSelectedCargo,
    handleSave,
    handleDelete,
    refetch
  } = useCargosData();

  useEffect(() => {
    logActivity({
      acao: 'cargos_pagina_visualizada',
      modulo: 'cargos',
      detalhes: {}
    });
  }, []);

  // ✅ REFATORAÇÃO: Hook customizado para filtros (DRY + Performance)
  const {
    filters,
    filteredCargos,
    hasActiveFilters,
    setSearchTerm,
    setDepartmentFilter,
    setStatusFilter,
    clearFilters
  } = useCargosFilters(cargos);

  // ✅ PERFORMANCE: Handlers memoizados para evitar re-renders
  const handleEdit = useCallback((cargo: CargoComDepartamento) => {
    setSelectedCargo(cargo);
    setEditModalOpen(true);
  }, [setSelectedCargo]);

  const handleDeleteCargo = useCallback((cargo: CargoComDepartamento) => {
    setSelectedCargo(cargo);
    setDeleteModalOpen(true);
  }, [setSelectedCargo]);

  const handleView = useCallback((cargo: CargoComDepartamento) => {
    setSelectedCargo(cargo);
    setViewModalOpen(true);
  }, [setSelectedCargo]);

  // Breadcrumbs e ações do header
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Cargos e Permissões' }
  ];

  const actions = (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => refetch()}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="flex items-center gap-2 hover:bg-accent"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
      <PermissionGuard 
        permissions="admin.cargos.criar"
        showMessage={false}
        fallback={null}
      >
        <Button
          onClick={() => setCreateModalOpen(true)}
          size="sm"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Novo Cargo
        </Button>
      </PermissionGuard>
    </div>
  );

  return (
    <PermissionGuard permissions="admin.cargos.visualizar">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        <PageHeader
          title="Gestão de Cargos"
          subtitle="Administre cargos, hierarquias e permissões do sistema"
          icon={Building2}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Estatísticas */}
          <CargosStatsGrid 
            stats={stats} 
            uniqueDepartmentsCount={uniqueDepartments.length} 
          />

          {/* Filtros */}
          <CargosFiltersPanel
            searchTerm={filters.searchTerm}
            setSearchTerm={setSearchTerm}
            departmentFilter={filters.departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            statusFilter={filters.statusFilter}
            setStatusFilter={setStatusFilter}
            uniqueDepartments={uniqueDepartments}
            resultsCount={filteredCargos.length}
          />

          {/* Grid de Cargos */}
          <CargosGridView
            cargos={filteredCargos}
            isLoading={isLoading}
            hasFilters={hasActiveFilters}
            onEdit={handleEdit}
            onDelete={handleDeleteCargo}
            onView={handleView}
            onCreateNew={() => setCreateModalOpen(true)}
            onClearFilters={clearFilters}
          />

          {/* Modais */}
          <CargosModalManager
            createModalOpen={createModalOpen}
            setCreateModalOpen={setCreateModalOpen}
            editModalOpen={editModalOpen}
            setEditModalOpen={setEditModalOpen}
            deleteModalOpen={deleteModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            selectedCargo={selectedCargo}
            onSave={handleSave}
            onConfirm={handleDelete}
          />

          <ViewCargoDetailsModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            cargo={selectedCargo}
          />
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CargosPageContainer;