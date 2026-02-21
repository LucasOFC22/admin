import { motion } from 'framer-motion';
import NewAdminDashboard from '@/components/admin/dashboard/NewAdminDashboard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const AdminDashboardContent = () => {
  return (
    <PermissionGuard 
      permissions="admin.dashboard.visualizar"
      showMessage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <NewAdminDashboard />
      </motion.div>
    </PermissionGuard>
  );
};

export default AdminDashboardContent;
