/**
 * Mapeamento de empresas para suas respectivas permissões
 * Quando uma nova empresa for adicionada, deve-se:
 * 1. Adicionar a permissão no permissionRegistry
 * 2. Adicionar a permissão no script SQL
 * 3. Adicionar o mapeamento aqui
 */

export const EMPRESA_PERMISSIONS = {
  '1': 'admin.empresas.fp-transcargas-190',  // FP TRANSCARGAS LTDA - CNPJ 05805337000190
  '2': 'admin.empresas.fp-transcargas-270',  // FP TRANSCARGAS LTDA - CNPJ 05805337000270
} as const;

/**
 * Verifica se o usuário tem permissão para acessar uma empresa específica
 */
export const hasEmpresaPermission = (
  userPermissions: string[], 
  empresaId: string | number
): boolean => {
  const empresaIdStr = empresaId.toString();
  const requiredPermission = EMPRESA_PERMISSIONS[empresaIdStr as keyof typeof EMPRESA_PERMISSIONS];
  
  if (!requiredPermission) {
    return false;
  }
  
  return userPermissions.includes(requiredPermission);
};

/**
 * Filtra empresas baseado nas permissões do usuário
 */
export const filterEmpresasByPermissions = <T extends { id: number | string }>(
  empresas: T[],
  userPermissions: string[]
): T[] => {
  return empresas.filter(empresa => 
    hasEmpresaPermission(userPermissions, empresa.id)
  );
};

/**
 * Verifica se o usuário tem acesso a todas as empresas
 */
export const hasAllEmpresasPermissions = (userPermissions: string[]): boolean => {
  return Object.values(EMPRESA_PERMISSIONS).every(permission => 
    userPermissions.includes(permission)
  );
};
