export interface Permission {
  id: string;
  name: string;
  description: string;
  action: string; // create, read, update, delete, manage
  resource: string; // cotacoes, usuarios, configuracoes, etc.
  category: string; // Dashboard, Cotações, Usuários, etc.
  enabled?: boolean;
  // Compatibilidade com código existente
  active?: boolean;
  critical?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PermissionArea = 'admin' | 'cliente';

export interface PermissionGroup {
  category: string;
  icon: string;
  description: string;
  permissions: Permission[];
  area?: PermissionArea; // 'admin' ou 'cliente'
  // Compatibilidade com código existente
  label?: string;
}

export interface PermissionAreaConfig {
  id: PermissionArea;
  label: string;
  icon: string;
  description: string;
}

export interface UserPermissions {
  userId: string;
  permissions: string[]; // array of permission IDs
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'import' | 'configure' | 'view' | 'edit' | 'approve';

export type PermissionResource = 
  | 'dashboard'
  | 'cotacoes' 
  | 'coletas'
  | 'contatos'
  | 'usuarios'
  | 'cargos'
  | 'whatsapp'
  | 'mensagens-rapidas'
  | 'configuracoes'
  | 'relatorios'
  | 'logs'
  | 'n8n'
  | 'clientes'
  | 'ranking'
  | 'nfe'
  | 'manifestos'
  | 'contas-receber'
  | 'cliente-dashboard'
  | 'cliente-cotacoes'
  | 'cliente-coletas'
  | 'cliente-financeiro'
  | 'email'
  | 'email-contas'
  | 'baixa-rapida-cte'
  | 'logs-coleta'
  | 'tabelas-frete'
  | 'avarias';

// Compatibilidade com código existente
export type PermissionCategory = string;
export type CargoPermission = Permission;