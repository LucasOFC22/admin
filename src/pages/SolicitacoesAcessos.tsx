import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import PageHeader from '@/components/admin/PageHeader';
import { UserCheck } from 'lucide-react';
import { useSolicitacoesAcessos } from '@/hooks/useSolicitacoesAcessos';
import { SolicitacoesAcessosStats } from '@/components/admin/solicitacoes-acessos/SolicitacoesAcessosStats';
import { SolicitacoesAcessosFilters } from '@/components/admin/solicitacoes-acessos/SolicitacoesAcessosFilters';
import { SolicitacoesAcessosTable } from '@/components/admin/solicitacoes-acessos/SolicitacoesAcessosTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const SolicitacoesAcessos = () => {
  const { logActivity } = useActivityLogger();
  const [search, setSearch] = useState('');
  
  const { 
    solicitacoes, 
    isLoading, 
    stats,
    deleteSolicitacao,
    refetch 
  } = useSolicitacoesAcessos({ search });

  useEffect(() => {
    logActivity({
      acao: 'solicitacoes_acessos_visualizadas',
      modulo: 'solicitacoes-acessos',
      detalhes: {}
    });
  }, []);

  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Solicitações de Acesso' }
  ];

  return (
    <PermissionGuard
      permissions="admin.solicitacoes-acessos.visualizar"
      showMessage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Solicitações de Acesso"
          subtitle="Gerencie as solicitações de acesso ao sistema"
          icon={UserCheck}
          breadcrumbs={breadcrumbs}
        />

        <div className="p-6 space-y-6">
          <SolicitacoesAcessosStats stats={stats} />

          <SolicitacoesAcessosFilters
            search={search}
            onSearchChange={setSearch}
            onRefresh={refetch}
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-muted-foreground">
                {search
                  ? 'Tente ajustar os filtros de busca'
                  : 'Novas solicitações aparecerão aqui quando forem recebidas'}
              </p>
            </div>
          ) : (
            <SolicitacoesAcessosTable
              solicitacoes={solicitacoes}
              onDelete={deleteSolicitacao}
            />
          )}
        </div>
      </motion.div>
    </PermissionGuard>
  );
};

export default SolicitacoesAcessos;
