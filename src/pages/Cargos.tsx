
import CargosManagement from '@/components/admin/cargos/CargosManagement';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const Cargos = () => {
  return (
    <>
      <PermissionGuard 
        permissions="admin.cargos.visualizar"
        showMessage={true}
      >
        <CargosManagement />
      </PermissionGuard>
    </>
  );
};

export default Cargos;
