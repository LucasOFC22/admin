import { requireAuthenticatedClient } from '@/config/supabaseAuth';

export interface Contact {
  contact_id: number;
  created_at?: string;
  department?: string;
  email?: string;
  message?: string;
  name?: string;
  phone?: string;
  status?: string;
  subject?: string;
  resposta?: string;
  lido?: string;
  respondido?: string;
  arquivado?: string;
}

export interface ContactResponse {
  contact_id: number;
  resposta: string;
  respondido: string;
}

class ContactsService {
  async getContacts(): Promise<Contact[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contatos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço getContacts:', error);
      throw error;
    }
  }

  async createContact(contact: Omit<Contact, 'contact_id' | 'created_at'>): Promise<Contact> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .insert([{
          ...contact,
          created_at: new Date().toISOString(),
          status: contact.status || 'novo'
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar contato:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço createContact:', error);
      throw error;
    }
  }

  async updateContact(contactId: number, updates: Partial<Contact>): Promise<Contact> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .update(updates)
        .eq('contact_id', contactId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar contato:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço updateContact:', error);
      throw error;
    }
  }

  async deleteContact(contactId: number): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('contact_id', contactId);

      if (error) {
        console.error('Erro ao excluir contato:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteContact:', error);
      throw error;
    }
  }

  async markAsRead(contactId: number): Promise<Contact> {
    return this.updateContact(contactId, {
      lido: new Date().toISOString()
    });
  }

  async markAsArchived(contactId: number): Promise<Contact> {
    return this.updateContact(contactId, {
      arquivado: new Date().toISOString(),
      status: 'fechado'
    });
  }

  async respondToContact(contactId: number, resposta: string): Promise<Contact> {
    return this.updateContact(contactId, {
      resposta,
      respondido: new Date().toISOString(),
      status: 'respondido'
    });
  }

  async getContactsByStatus(status: string): Promise<Contact[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contatos por status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço getContactsByStatus:', error);
      throw error;
    }
  }

  async getContactsByDepartment(department: string): Promise<Contact[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('department', department)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contatos por departamento:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço getContactsByDepartment:', error);
      throw error;
    }
  }

  async searchContacts(searchTerm: string): Promise<Contact[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contatos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço searchContacts:', error);
      throw error;
    }
  }
}

export const contactsService = new ContactsService();
