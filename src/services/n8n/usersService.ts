
import { n8nApi, N8nResponse } from './apiService';

export interface N8nUserProfile {
  id: string;
  name: string;
  email: string;
  tipo: 'admin' | 'cliente';
  ativo: boolean;
  acessoAreaCliente?: boolean;
  telefone?: string;
  empresa?: string;
  documento?: string;
  endereco?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  roleId?: string;
  permissions?: string[];
  nivel_hierarquico?: number; // Nível hierárquico (1-10)
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  tipo: 'admin' | 'cliente';
  ativo?: boolean;
  acessoAreaCliente?: boolean;
  telefone?: string;
  empresa?: string;
  roleId?: string;
  nivel_hierarquico?: number; // Nível hierárquico (1-10)
}

class N8nUsersService {
  async getUsers(filters?: {
    tipo?: 'admin' | 'cliente';
    ativo?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<N8nUserProfile[]> {
    const response = await n8nApi.get<N8nUserProfile[]>('users', filters);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users');
    }

    const result = response.data || [];
    
    // Ensure we always return an array
    return Array.isArray(result) ? result : [];
  }

  async getUserById(id: string): Promise<N8nUserProfile | null> {
    const response = await n8nApi.get<N8nUserProfile>(`users/${id}`);
    
    if (!response.success) {
      console.error('Failed to fetch user:', response.error);
      return null;
    }

    return response.data || null;
  }

  async createUser(userData: CreateUserData): Promise<N8nUserProfile> {
    const response = await n8nApi.post<N8nUserProfile>('users', userData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create user');
    }

    return response.data;
  }

  async updateUser(id: string, updates: Partial<N8nUserProfile>): Promise<N8nUserProfile> {
    const response = await n8nApi.put<N8nUserProfile>(`users/${id}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update user');
    }

    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    const response = await n8nApi.delete(`users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
  }

  async toggleUserStatus(id: string, ativo: boolean): Promise<N8nUserProfile> {
    return this.updateUser(id, { ativo });
  }

  async toggleUserAccess(id: string, acessoAreaCliente: boolean): Promise<N8nUserProfile> {
    return this.updateUser(id, { acessoAreaCliente });
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    const response = await n8nApi.post(`users/${id}/reset-password`, { newPassword });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password');
    }
  }

  async updateUserPermissions(id: string, permissions: string[]): Promise<N8nUserProfile> {
    return this.updateUser(id, { permissions });
  }

  async getUsersByRole(roleId: string): Promise<N8nUserProfile[]> {
    const response = await n8nApi.get<N8nUserProfile[]>(`users/by-role/${roleId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users by role');
    }

    return response.data || [];
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    admins: number;
    clients: number;
    recentLogins: number;
  }> {
    const response = await n8nApi.get<any>('users/stats');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user stats');
    }

    return response.data || {
      total: 0,
      active: 0,
      admins: 0,
      clients: 0,
      recentLogins: 0
    };
  }
}

export const n8nUsersService = new N8nUsersService();
