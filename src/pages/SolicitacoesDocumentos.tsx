import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import PageHeader from '@/components/admin/PageHeader';
import { FileCheck } from 'lucide-react';
import { useSolicitacoesDocumentos } from '@/hooks/useSolicitacoesDocumentos';
import { SolicitacoesStats } from '@/components/admin/solicitacoes-documentos/SolicitacoesStats';
import { SolicitacoesFilters } from '@/components/admin/solicitacoes-documentos/SolicitacoesFilters';
import { SolicitacoesTable } from '@/components/admin/solicitacoes-documentos/SolicitacoesTable';
import { SolicitacoesCards } from '@/components/admin/solicitacoes-documentos/SolicitacoesCards';
import { SolicitacaoDetailsDialog } from '@/components/admin/solicitacoes-documentos/SolicitacaoDetailsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { SolicitacaoDocumento } from '@/types/database';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const SolicitacoesDocumentos = () => {
  const { logActivity } = useActivityLogger();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoDocumento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { 
    solicitacoes, 
    isLoading, 
    stats,
    updateStatus,
    deleteSolicitacao,
    refetch 
  } = useSolicitacoesDocumentos({ 
    search, 
    status: statusFilter === 'todos' ? undefined : statusFilter,
    tipo: tipoFilter === 'todos' ? undefined : tipoFilter
  });

  useEffect(() => {
    logActivity({
      acao: 'solicitacoes_documentos_visualizadas',
      modulo: 'solicitacoes-documentos',
      detalhes: {}
    });
  }, []);

  const handleViewDetails = (solicitacao: SolicitacaoDocumento) => {
    setSelectedSolicitacao(solicitacao);
    setDetailsOpen(true);
  };

  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Solicitação Documentos' }
  ];

  return (
    <PermissionGuard
      permissions="admin.solicitacoes-documentos.visualizar"
      showMessage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Solicitação de Documentos"
          subtitle="Gerencie as solicitações de documentos integradas ao WhatsApp"
          icon={FileCheck}
          breadcrumbs={breadcrumbs}
        />

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <SolicitacoesStats stats={stats} />

          <SolicitacoesFilters
            search={search}
            statusFilter={statusFilter}
            tipoFilter={tipoFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
            onTipoChange={setTipoFilter}
            onRefresh={refetch}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {isLoading ? (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </>
              )}
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== 'todos' || tipoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Novas solicitações aparecerão aqui quando forem recebidas'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <SolicitacoesCards
              solicitacoes={solicitacoes}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <SolicitacoesTable
              solicitacoes={solicitacoes}
              onUpdateStatus={updateStatus}
              onDelete={deleteSolicitacao}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>

        <SolicitacaoDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          solicitacao={selectedSolicitacao}
        />
      </motion.div>
    </PermissionGuard>
  );
};

export default SolicitacoesDocumentos;
