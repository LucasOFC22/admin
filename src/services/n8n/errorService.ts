
import { n8nApi, N8nResponse } from './apiService';

export interface ErroEnvio {
  id: string;
  timestamp: string | Date;
  endpoint?: string;
  erro?: string;
  formType?: string;
  payload?: any;
  status: 'pendente' | 'processando' | 'resolvido' | 'erro';
  createdAt?: string;
  updatedAt?: string;
}

class N8nErrorService {
  async getErros(): Promise<ErroEnvio[]> {
    try {
      const response = await n8nApi.get<ErroEnvio[]>('errors');
      
      if (!response.success) {
        console.error('Failed to fetch errors:', response.error);
        return [];
      }

      // Garantir que sempre retorne um array
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Dados retornados não são um array:', data);
        return [];
      }
    } catch (error) {
      console.error('Erro ao carregar erros:', error);
      return [];
    }
  }

  async createErro(errorData: Omit<ErroEnvio, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErroEnvio> {
    const response = await n8nApi.post<ErroEnvio>('errors', errorData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create error');
    }

    return response.data;
  }

  async updateErroStatus(id: string, status: ErroEnvio['status']): Promise<ErroEnvio> {
    const response = await n8nApi.put<ErroEnvio>(`errors/${id}`, { status });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update error status');
    }

    return response.data;
  }

  async deleteErro(id: string): Promise<void> {
    const response = await n8nApi.delete(`errors/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete error');
    }
  }
}

export const n8nErrorService = new N8nErrorService();
export const getErros = () => n8nErrorService.getErros();
export const updateErroStatus = (id: string, status: ErroEnvio['status']) => n8nErrorService.updateErroStatus(id, status);
export const deleteErro = (id: string) => n8nErrorService.deleteErro(id);
