import { useState } from 'react';
import { backendService } from '@/services/api/backendService';
import { FormValues } from '@/config/contactFormConfig';

export interface SupabaseContact {
  contact_id?: number;
  created_at?: string;
  department: string;
  email: string;
  message: string;
  name: string;
  phone?: string;
  status: string;
  subject: string;
  resposta?: string;
  lido?: string;
  respondido?: string;
  arquivado?: string;
}

export const useSupabaseContacts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createContact = async (formData: FormValues): Promise<SupabaseContact> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendService.criarContato({
        eventType: "contato",
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        department: formData.department,
        subject: formData.subject,
        message: formData.message,
        status: 'novo'
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao salvar contato');
      }

      return response.data;

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido ao salvar contato';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createContact,
    isLoading,
    error
  };
};
