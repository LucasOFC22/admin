
import { n8nApi, N8nResponse } from './apiService';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  ativo: boolean;
  tipo: 'admin' | 'cliente';
  acessoAreaCliente?: boolean;
  dataCriacao?: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

class N8nClientService {
  async getClientes(): Promise<Cliente[]> {
    const response = await n8nApi.get<Cliente[]>('clients');
    
    if (!response.success) {
      console.error('Failed to fetch clients:', response.error);
      return [];
    }

    return response.data || [];
  }

  async getClienteById(id: string): Promise<Cliente | null> {
    const response = await n8nApi.get<Cliente>(`clients/${id}`);
    
    if (!response.success) {
      console.error('Failed to fetch client:', response.error);
      return null;
    }

    return response.data || null;
  }

  async createCliente(clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const response = await n8nApi.post<Cliente>('clients', clienteData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create client');
    }

    return response.data;
  }

  async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    const response = await n8nApi.put<Cliente>(`clients/${id}`, updates);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update client');
    }

    return response.data;
  }

  async deleteCliente(id: string): Promise<void> {
    const response = await n8nApi.delete(`clients/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete client');
    }
  }
}

export const n8nClientService = new N8nClientService();
export const getClientes = () => n8nClientService.getClientes();
