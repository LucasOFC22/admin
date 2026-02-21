
import { n8nApi, N8nResponse } from './apiService';
import { Contact } from '@/types/contact';

class N8nContactService {
  async createContact(contactData: any): Promise<{ id: string }> {
    const response = await n8nApi.post<{ id: string }>('contact/create', contactData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create contact');
    }
    
    return response.data;
  }

  async getContacts(): Promise<Contact[]> {
    const response = await n8nApi.get<Contact[]>('contact/list');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get contacts');
    }
    
    return response.data;
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.getContacts();
  }

  async sendContactResponse(contactId: string, email: string, name: string, response: string): Promise<void> {
    const responseData = await n8nApi.post('contact/respond', {
      contactId,
      email,
      name,
      response
    });
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to send response');
    }
  }

  async updateContactStatus(contactId: string, status: string): Promise<void> {
    const response = await n8nApi.put('contact/status', {
      contactId,
      status
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update contact status');
    }
  }

  async submitContactForm(contactData: any): Promise<{ id: string }> {
    return this.createContact(contactData);
  }
}

export const n8nContactService = new N8nContactService();
export const ContactService = n8nContactService;
