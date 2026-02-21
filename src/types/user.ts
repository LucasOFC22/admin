export interface User {
  id: string;
  name: string;
  email: string;
  cargo?: string;
  department?: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  permissions?: string[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  cargo?: string;
  department?: string;
  active: boolean;
  phone?: string;
  permissions?: string[];
}

export interface UpdateUserRequest extends CreateUserRequest {
  id: string;
}

export interface UserFilters {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  cargoFilter: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  uniqueCargos: number;
}