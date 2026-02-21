import { useState } from 'react';

import PageHeader from '@/components/admin/PageHeader';
import { AlertTriangle } from 'lucide-react';
import { useOcorrencias } from '@/hooks/useOcorrencias';
import { Ocorrencia } from '@/types/ocorrencias';
import {
  OcorrenciasStats,
  OcorrenciasFilters,
  OcorrenciasGrid,
  OcorrenciaDetailModal
} from '@/components/admin/ocorrencias';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const Ocorrencias = () => {
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    tipo: 'all',
    status: 'all'
  });

  const queryFilters = {
    tipo: filters.tipo !== 'all' ? filters.tipo : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    search: filters.search || undefined
  };

  const { 
    ocorrencias, 
    isLoading, 
    stats, 
    updateStatus, 
    addObservacao,
    editOcorrencia,
    isUpdating 
  } = useOcorrencias(queryFilters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <PermissionGuard 
        permissions="admin.ocorrencias.visualizar"
        showMessage={true}
      >
        <PageHeader
          icon={AlertTriangle}
          title="Ocorrências"
          subtitle="Gerenciamento de ocorrências e problemas reportados"
        />

        <div className="p-6 space-y-6">
          <OcorrenciasStats stats={stats} />

          <OcorrenciasFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <OcorrenciasGrid
              ocorrencias={ocorrencias}
              onViewDetails={setSelectedOcorrencia}
            />
          )}

          <OcorrenciaDetailModal
            ocorrencia={selectedOcorrencia}
            open={!!selectedOcorrencia}
            onClose={() => setSelectedOcorrencia(null)}
            onStatusChange={(id, newStatus, oldStatus) => updateStatus({ id, status: newStatus, oldStatus })}
            onAddObservacao={(id, observacao) => addObservacao({ id, observacao })}
            onEditOcorrencia={(id, dados, dadosAnteriores) => editOcorrencia({ id, dados, dadosAnteriores })}
            isUpdating={isUpdating}
          />
        </div>
      </PermissionGuard>
    </>
  );
};

export default Ocorrencias;
