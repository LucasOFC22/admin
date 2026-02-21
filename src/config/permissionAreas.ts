import { PermissionAreaConfig } from '@/types/permissions';

export const PERMISSION_AREAS: Record<string, PermissionAreaConfig> = {
  admin: {
    id: 'admin',
    label: 'Área Admin',
    icon: 'Shield',
    description: 'Permissões do painel administrativo'
  },
  cliente: {
    id: 'cliente',
    label: 'Área Cliente',
    icon: 'Users',
    description: 'Permissões do painel de clientes'
  }
};

// Helper para determinar a área de uma permissão
export const getPermissionArea = (permissionId: string): 'admin' | 'cliente' => {
  if (permissionId.startsWith('clientes.')) {
    return 'cliente';
  }
  return 'admin';
};

// Helper para determinar a área de um grupo
export const getGroupArea = (groupCategory: string, permissions: { id: string }[]): 'admin' | 'cliente' => {
  // Se a categoria começa com "Cliente:" ou é "Área do Cliente"
  if (groupCategory.startsWith('Cliente:') || groupCategory === 'Área do Cliente') {
    return 'cliente';
  }
  
  // Verifica as permissões do grupo
  const hasClientePermission = permissions.some(p => p.id.startsWith('clientes.'));
  const hasAdminPermission = permissions.some(p => p.id.startsWith('admin.'));
  
  // Se só tem permissões de cliente, é área cliente
  if (hasClientePermission && !hasAdminPermission) {
    return 'cliente';
  }
  
  return 'admin';
};
