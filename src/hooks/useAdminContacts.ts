import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';

export interface AdminContact {
  contact_id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  created_at: string;
  department?: string;
  resposta?: string;
  lido?: string;
  respondido?: string;
  arquivado?: string;
}

interface ContactFilters {
  status?: string;
  search?: string;
}

export const useAdminContacts = (filters?: ContactFilters) => {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useCustomNotifications();

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const client = requireAuthenticatedClient();
      let query = client
        .from('contatos')
        .select('contact_id, name, email, phone, subject, message, status, created_at, department, resposta, lido, respondido, arquivado')
        .order('created_at', { ascending: false });

      // Aplicar filtro de status
      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      // Aplicar filtro de busca
      if (filters?.search && filters.search.trim()) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,message.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Erro ao buscar contatos:', fetchError);
        throw fetchError;
      }

      setContacts(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contatos');
      notify.error('Erro', 'Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactStatus = async (contact_id: number, newStatus: string) => {
    try {
      const client = requireAuthenticatedClient();
      const { error: updateError } = await client
        .from('contatos')
        .update({ 
          status: newStatus
        })
        .eq('contact_id', contact_id);

      if (updateError) throw updateError;

      notify.success('Sucesso', 'Status atualizado com sucesso');
      fetchContacts();
    } catch (err: any) {
      notify.error('Erro', 'Erro ao atualizar status');
      console.error('Erro ao atualizar status:', err);
    }
  };

  const deleteContact = async (contact_id: number) => {
    try {
      const client = requireAuthenticatedClient();
      const { error: deleteError } = await client
        .from('contatos')
        .delete()
        .eq('contact_id', contact_id);

      if (deleteError) throw deleteError;

      notify.success('Sucesso', 'Contato excluído com sucesso');
      fetchContacts();
    } catch (err: any) {
      notify.error('Erro', 'Erro ao excluir contato');
      console.error('Erro ao excluir contato:', err);
    }
  };

  useEffect(() => {
    fetchContacts();

    // Configurar real-time updates
    const channel = supabase
      .channel('contatos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contatos'
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters?.status, filters?.search]);

  const stats = {
    total: contacts.length,
    novos: contacts.filter(c => c.status === 'novo' || !c.status).length,
    em_andamento: contacts.filter(c => c.status === 'em_andamento').length,
    respondidos: contacts.filter(c => c.status === 'respondido').length,
    fechados: contacts.filter(c => c.status === 'fechado').length
  };

  return {
    contacts,
    isLoading,
    error,
    stats,
    updateContactStatus,
    deleteContact,
    refetch: fetchContacts
  };
};
