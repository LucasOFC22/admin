
import { n8nApi, N8nResponse } from './apiService';

export interface JobTitleN8n {
  id: string;
  name: string;
  description?: string;
  level?: number;
  permissions?: string[];
  departmentId?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class N8nJobTitleService {
  async getJobTitles(): Promise<JobTitleN8n[]> {
    try {
      const response = await n8nApi.makeN8nRequest<JobTitleN8n[]>({
        eventType: 'cargos',
        acao: 'Buscar'
      });
      
      if (!response.success) {
        console.error('Failed to fetch job titles:', response.error);
        return [];
      }

      // Ensure we always return an array
      const data = response.data;
      if (!Array.isArray(data)) {
        console.warn('Job titles response is not an array:', data);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching job titles:', error);
      return [];
    }
  }

  async getJobTitleById(id: string): Promise<JobTitleN8n | null> {
    const response = await n8nApi.makeN8nRequest<JobTitleN8n>({
      eventType: 'cargos',
      acao: 'Buscar',
      id
    });
    
    if (!response.success) {
      console.error('Failed to fetch job title:', response.error);
      return null;
    }

    return response.data || null;
  }

  async createJobTitle(jobTitleData: Omit<JobTitleN8n, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobTitleN8n> {
    const response = await n8nApi.makeN8nRequest<JobTitleN8n>({
      eventType: 'cargos',
      acao: 'Criar',
      data: jobTitleData
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create job title');
    }

    return response.data;
  }

  async updateJobTitle(id: string, updates: Partial<JobTitleN8n>): Promise<JobTitleN8n> {
    const response = await n8nApi.makeN8nRequest<JobTitleN8n>({
      eventType: 'cargos',
      acao: 'Editar',
      id,
      data: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update job title');
    }

    return response.data;
  }

  async deleteJobTitle(id: string): Promise<void> {
    const response = await n8nApi.makeN8nRequest({
      eventType: 'cargos',
      acao: 'Remover',
      id
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete job title');
    }
  }
}

export const n8nJobTitleService = new N8nJobTitleService();
export const getJobTitlesFromN8n = () => n8nJobTitleService.getJobTitles();
