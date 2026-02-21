import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import PageHeader from '@/components/admin/PageHeader';
import { FileCheck, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSolicitacoesDocumentos } from '@/hooks/useSolicitacoesDocumentos';
import { useSolicitacoesPendentes } from '@/hooks/useSolicitacoesPendentes';
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

  const { data: pendentes = [] } = useSolicitacoesPendentes();

  const prioridadeStats = {
    urgente: pendentes.filter(s => s.prioridade === 'urgente').length,
    medio: pendentes.filter(s => s.prioridade === 'medio').length,
    suave: pendentes.filter(s => s.prioridade === 'suave').length,
  };

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

          {/* Cards de Prioridade Pendentes */}
          {pendentes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-4 border-l-4 border-l-red-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Urgente (&gt;48h)</p>
                    <p className="text-2xl font-bold text-red-600">{prioridadeStats.urgente}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Médio (24-48h)</p>
                    <p className="text-2xl font-bold text-yellow-600">{prioridadeStats.medio}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-green-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Suave (&lt;24h)</p>
                    <p className="text-2xl font-bold text-green-600">{prioridadeStats.suave}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

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
