import { motion } from 'framer-motion';

import PageHeader from '@/components/admin/PageHeader';
import ErrosEnvioContent from '@/components/admin/erros-envio/ErrosEnvioContent';
import { AlertTriangle } from 'lucide-react';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const ErrosEnvio = () => {
  return (
    <>
      <PermissionGuard 
        permissions="admin.erros.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Erros de Envio"
            subtitle="Monitore e gerencie erros de envio de formulários"
            icon={AlertTriangle}
            breadcrumbs={[
              { label: "Dashboard", href: "/" },
              { label: "Erros de Envio" }
            ]}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-auto"
          >
            <ErrosEnvioContent />
          </motion.div>
        </div>
      </PermissionGuard>
    </>
  );
};

export default ErrosEnvio;
