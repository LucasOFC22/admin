
import { n8nApi, N8nResponse } from './apiService';

export interface N8nContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  subject: string;
  message: string;
  location?: string;
  status: 'novo' | 'em_andamento' | 'respondido' | 'fechado';
  referenceId?: string;
  source: 'n8n' | 'website' | 'admin';
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string;
  respondedBy?: string;
}

class N8nContactsService {
  async getContacts(filters?: {
    status?: string;
    department?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<N8nContact[]> {
    const response = await n8nApi.get<N8nContact[]>('contacts', filters);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch contacts');
    }

    return response.data || [];
  }

  async getContactById(id: string): Promise<N8nContact | null> {
    const response = await n8nApi.get<N8nContact>(`contacts/${id}`);
    
    if (!response.success) {
      console.error('Failed to fetch contact:', response.error);
      return null;
    }

    return response.data || null;
  }

  async createContact(contactData: Omit<N8nContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<N8nContact> {
    const response = await n8nApi.post<N8nContact>('contacts', contactData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create contact');
    }

    return response.data;
  }

  async updateContact(id: string, updates: Partial<N8nContact>): Promise<N8nContact> {
    const response = await n8nApi.put<N8nContact>(`contacts/${id}`, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update contact');
    }

    return response.data;
  }

  async deleteContact(id: string): Promise<void> {
    const response = await n8nApi.delete(`contacts/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete contact');
    }
  }

  async updateContactStatus(id: string, status: N8nContact['status'], respondedBy?: string): Promise<N8nContact> {
    const updates: Partial<N8nContact> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'respondido' && respondedBy) {
      updates.respondedAt = new Date().toISOString();
      updates.respondedBy = respondedBy;
    }

    return this.updateContact(id, updates);
  }

  async archiveContact(id: string): Promise<N8nContact> {
    return this.updateContactStatus(id, 'fechado');
  }

  async respondToContact(id: string, responseData: {
    respondedBy: string;
    responseMessage?: string;
  }): Promise<N8nContact> {
    const response = await n8nApi.post<N8nContact>(`contacts/${id}/respond`, {
      ...responseData,
      respondedAt: new Date().toISOString()
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to respond to contact');
    }

    return response.data;
  }

  async bulkUpdateContacts(ids: string[], updates: Partial<N8nContact>): Promise<N8nContact[]> {
    const response = await n8nApi.put<N8nContact[]>('contacts/bulk', {
      ids,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to bulk update contacts');
    }

    return response.data;
  }

  async getContactStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    recent: number;
  }> {
    const response = await n8nApi.get<any>('contacts/stats');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch contact stats');
    }

    return response.data || {
      total: 0,
      byStatus: {},
      byDepartment: {},
      recent: 0
    };
  }
}

export const n8nContactsService = new N8nContactsService();
