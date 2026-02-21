
import { useState, useEffect } from 'react';
import { Contato } from '@/components/admin/contacts/types';
import { contactsService, Contact } from '@/services/contactsService';

export const useContatosData = () => {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContatos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabaseContacts = await contactsService.getContacts();
      
      // Converter para o formato Contato
      const formattedContatos: Contato[] = supabaseContacts.map((contact: Contact) => ({
        id: contact.contact_id.toString(),
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        department: contact.department || 'comercial',
        subject: contact.subject || '',
        message: contact.message || '',
        status: (contact.status === 'novo' || contact.status === 'em_andamento' || contact.status === 'respondido' || contact.status === 'fechado') 
          ? contact.status as 'novo' | 'em_andamento' | 'respondido' | 'fechado'
          : 'novo',
        source: 'supabase' as const,
        createdAt: contact.created_at || new Date().toISOString()
      } as Contato));
      
      setContatos(formattedContatos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contatos do Supabase';
      setError(errorMessage);
      console.error('Erro ao buscar contatos via Supabase:', err);
      setContatos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContatos();
    
    // Configurar atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      fetchContatos();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    contatos,
    isLoading,
    error,
    refetch: fetchContatos
  };
};
