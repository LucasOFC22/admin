import { useEffect } from 'react';

import PageHeader from '@/components/admin/PageHeader';
import UnifiedUsersManagement from '@/components/users/unified/UnifiedUsersManagement';
import { Users } from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const UnifiedUsersPage = () => {
  const { logActivity } = useActivityLogger();

  useEffect(() => {
    logActivity({
      acao: 'usuarios_pagina_visualizada',
      modulo: 'usuarios',
      detalhes: {}
    });
  }, []);

  return (
    <PermissionGuard
      permissions="admin.usuarios.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Gerenciar Usuários"
          subtitle="Gerencie clientes e administradores em um só lugar"
          icon={Users}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Gerenciar Usuários' }
          ]}
        />

        <main className="flex-1 overflow-auto">
          <UnifiedUsersManagement />
        </main>
      </div>
    </PermissionGuard>
  );
};

export default UnifiedUsersPage;
