import { useState, useCallback, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { 
  EmailContato, 
  EmailContatoFormData, 
  EmailContatoGrupo, 
  EmailContatoGrupoFormData 
} from '@/types/emailContacts';

interface UseEmailContatosReturn {
  contacts: EmailContato[];
  groups: EmailContatoGrupo[];
  isLoading: boolean;
  error: string | null;
  
  // Contatos CRUD
  fetchContacts: (contaId: string) => Promise<EmailContato[]>;
  createContact: (contaId: string, data: EmailContatoFormData) => Promise<EmailContato | null>;
  updateContact: (id: string, data: EmailContatoFormData) => Promise<EmailContato | null>;
  deleteContact: (id: string) => Promise<boolean>;
  
  // Grupos CRUD
  fetchGroups: (contaId: string) => Promise<EmailContatoGrupo[]>;
  createGroup: (contaId: string, data: EmailContatoGrupoFormData) => Promise<EmailContatoGrupo | null>;
  updateGroup: (id: string, data: EmailContatoGrupoFormData) => Promise<EmailContatoGrupo | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  
  // Busca
  searchContacts: (contaId: string, query: string) => Promise<EmailContato[]>;
  
  // Import/Export
  importContactsFromCSV: (contaId: string, csvData: string) => Promise<{ imported: number; errors: string[] }>;
  exportContactsToCSV: (contaId: string) => Promise<string>;
  
  // Cache
  clearCache: () => void;
}

// Cache global
const contactsCache = new Map<string, { contacts: EmailContato[]; timestamp: number }>();
const groupsCache = new Map<string, { groups: EmailContatoGrupo[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useEmailContatos(): UseEmailContatosReturn {
  const [contacts, setContacts] = useState<EmailContato[]>([]);
  const [groups, setGroups] = useState<EmailContatoGrupo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper para obter cliente autenticado
  const getSupabase = () => requireAuthenticatedClient();

  // ============ CONTATOS ============

  const fetchContacts = useCallback(async (contaId: string): Promise<EmailContato[]> => {
    const cached = contactsCache.get(contaId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setContacts(cached.contacts);
      return cached.contacts;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error: fetchError } = await supabase
        .from('email_contatos')
        .select(`
          *,
          grupos:email_contato_grupo_membros(
            grupo:email_contato_grupos(*)
          )
        `)
        .eq('email_conta_id', contaId)
        .order('nome');

      if (fetchError) throw fetchError;

      // Formatar os grupos
      const formattedContacts = (data || []).map(contact => ({
        ...contact,
        grupos: contact.grupos?.map((g: any) => g.grupo).filter(Boolean) || []
      }));

      contactsCache.set(contaId, { contacts: formattedContacts, timestamp: Date.now() });
      setContacts(formattedContacts);
      
      return formattedContacts;
    } catch (err: any) {
      const message = err.message || 'Erro ao buscar contatos';
      setError(message);
      console.error('[useEmailContatos] fetchContacts error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContact = useCallback(async (contaId: string, data: EmailContatoFormData): Promise<EmailContato | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = requireAuthenticatedClient();
      const { data: newContact, error: insertError } = await supabase
        .from('email_contatos')
        .insert({
          email_conta_id: contaId,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Adicionar aos grupos se especificados
      if (data.grupos && data.grupos.length > 0) {
        const memberships = data.grupos.map(grupoId => ({
          contato_id: newContact.id,
          grupo_id: grupoId
        }));

        await getSupabase()
          .from('email_contato_grupo_membros')
          .insert(memberships);
      }

      // Invalidar cache e atualizar lista
      contactsCache.delete(contaId);
      setContacts(prev => [...prev, newContact]);

      return newContact;
    } catch (err: any) {
      const message = err.message || 'Erro ao criar contato';
      setError(message);
      console.error('[useEmailContatos] createContact error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContact = useCallback(async (id: string, data: EmailContatoFormData): Promise<EmailContato | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedContact, error: updateError } = await getSupabase()
        .from('email_contatos')
        .update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar grupos
      if (data.grupos !== undefined) {
        // Remover todos os grupos atuais
        await getSupabase()
          .from('email_contato_grupo_membros')
          .delete()
          .eq('contato_id', id);

        // Adicionar novos grupos
        if (data.grupos.length > 0) {
          const memberships = data.grupos.map(grupoId => ({
            contato_id: id,
            grupo_id: grupoId
          }));

          await getSupabase()
            .from('email_contato_grupo_membros')
            .insert(memberships);
        }
      }

      // Invalidar cache
      contactsCache.clear();
      
      // Atualizar lista local
      setContacts(prev => prev.map(c => c.id === id ? updatedContact : c));

      return updatedContact;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar contato';
      setError(message);
      console.error('[useEmailContatos] updateContact error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await getSupabase()
        .from('email_contatos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Invalidar cache
      contactsCache.clear();
      
      // Atualizar lista local
      setContacts(prev => prev.filter(c => c.id !== id));

      return true;
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar contato';
      setError(message);
      console.error('[useEmailContatos] deleteContact error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ GRUPOS ============

  const fetchGroups = useCallback(async (contaId: string): Promise<EmailContatoGrupo[]> => {
    const cached = groupsCache.get(contaId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setGroups(cached.groups);
      return cached.groups;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('email_contato_grupos')
        .select('*')
        .eq('email_conta_id', contaId)
        .order('nome');

      if (fetchError) throw fetchError;

      groupsCache.set(contaId, { groups: data || [], timestamp: Date.now() });
      setGroups(data || []);
      
      return data || [];
    } catch (err: any) {
      const message = err.message || 'Erro ao buscar grupos';
      setError(message);
      console.error('[useEmailContatos] fetchGroups error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (contaId: string, data: EmailContatoGrupoFormData): Promise<EmailContatoGrupo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: newGroup, error: insertError } = await getSupabase()
        .from('email_contato_grupos')
        .insert({
          email_conta_id: contaId,
          nome: data.nome,
          cor: data.cor || '#6366f1'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      groupsCache.delete(contaId);
      setGroups(prev => [...prev, newGroup]);

      return newGroup;
    } catch (err: any) {
      const message = err.message || 'Erro ao criar grupo';
      setError(message);
      console.error('[useEmailContatos] createGroup error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateGroup = useCallback(async (id: string, data: EmailContatoGrupoFormData): Promise<EmailContatoGrupo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedGroup, error: updateError } = await getSupabase()
        .from('email_contato_grupos')
        .update({
          nome: data.nome,
          cor: data.cor,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      groupsCache.clear();
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));

      return updatedGroup;
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar grupo';
      setError(message);
      console.error('[useEmailContatos] updateGroup error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await getSupabase()
        .from('email_contato_grupos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      groupsCache.clear();
      setGroups(prev => prev.filter(g => g.id !== id));

      return true;
    } catch (err: any) {
      const message = err.message || 'Erro ao deletar grupo';
      setError(message);
      console.error('[useEmailContatos] deleteGroup error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ BUSCA ============

  const searchContacts = useCallback(async (contaId: string, query: string): Promise<EmailContato[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Primeiro tentar do cache
      const cached = contactsCache.get(contaId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const queryLower = query.toLowerCase();
        return cached.contacts.filter(contact =>
          contact.nome?.toLowerCase().includes(queryLower) ||
          contact.email?.toLowerCase().includes(queryLower) ||
          contact.telefone?.includes(query)
        );
      }

      // Buscar do banco
      const { data, error: searchError } = await getSupabase()
        .from('email_contatos')
        .select('*')
        .eq('email_conta_id', contaId)
        .or(`nome.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (searchError) throw searchError;

      return data || [];
    } catch (err: any) {
      console.error('[useEmailContatos] searchContacts error:', err);
      return [];
    }
  }, []);

  // ============ IMPORT/EXPORT CSV ============

  const importContactsFromCSV = useCallback(async (
    contaId: string, 
    csvData: string
  ): Promise<{ imported: number; errors: string[] }> => {
    const errors: string[] = [];
    let imported = 0;

    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return { imported: 0, errors: ['Arquivo CSV vazio'] };
      }

      // Detectar separador (vírgula ou ponto-e-vírgula)
      const separator = lines[0].includes(';') ? ';' : ',';
      
      // Primeira linha é o header
      const headers = lines[0].toLowerCase().split(separator).map(h => h.trim().replace(/"/g, ''));
      
      // Mapear colunas
      const nameIndex = headers.findIndex(h => h === 'nome' || h === 'name');
      const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail');
      const phoneIndex = headers.findIndex(h => h === 'telefone' || h === 'phone' || h === 'celular');
      const groupIndex = headers.findIndex(h => h === 'grupo' || h === 'group' || h === 'categoria');

      if (emailIndex === -1) {
        return { imported: 0, errors: ['Coluna "email" não encontrada no CSV'] };
      }

      // Buscar grupos existentes
      const { data: existingGroups } = await getSupabase()
        .from('email_contato_grupos')
        .select('id, nome')
        .eq('email_conta_id', contaId);

      const groupMap = new Map(existingGroups?.map(g => [g.nome.toLowerCase(), g.id]) || []);

      // Processar cada linha
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        
        const email = values[emailIndex];
        if (!email || !email.includes('@')) {
          errors.push(`Linha ${i + 1}: Email inválido`);
          continue;
        }

        const nome = nameIndex >= 0 ? values[nameIndex] : email.split('@')[0];
        const telefone = phoneIndex >= 0 ? values[phoneIndex] : undefined;
        const grupoNome = groupIndex >= 0 ? values[groupIndex] : undefined;

        try {
          // Criar contato
          const { data: newContact, error: insertError } = await getSupabase()
            .from('email_contatos')
            .insert({
              email_conta_id: contaId,
              nome: nome || email.split('@')[0],
              email,
              telefone: telefone || null
            })
            .select()
            .single();

          if (insertError) {
            errors.push(`Linha ${i + 1}: ${insertError.message}`);
            continue;
          }

          // Adicionar ao grupo se especificado
          if (grupoNome && newContact) {
            let grupoId = groupMap.get(grupoNome.toLowerCase());
            
            // Criar grupo se não existir
            if (!grupoId) {
              const { data: newGroup } = await getSupabase()
                .from('email_contato_grupos')
                .insert({
                  email_conta_id: contaId,
                  nome: grupoNome
                })
                .select()
                .single();

              if (newGroup) {
                grupoId = newGroup.id;
                groupMap.set(grupoNome.toLowerCase(), grupoId);
              }
            }

            if (grupoId) {
              await getSupabase()
                .from('email_contato_grupo_membros')
                .insert({
                  contato_id: newContact.id,
                  grupo_id: grupoId
                });
            }
          }

          imported++;
        } catch (err: any) {
          errors.push(`Linha ${i + 1}: ${err.message}`);
        }
      }

      // Invalidar cache
      contactsCache.delete(contaId);
      groupsCache.delete(contaId);

      return { imported, errors };
    } catch (err: any) {
      return { imported: 0, errors: [err.message] };
    }
  }, []);

  const exportContactsToCSV = useCallback(async (contaId: string): Promise<string> => {
    try {
      const { data, error: fetchError } = await getSupabase()
        .from('email_contatos')
        .select(`
          *,
          grupos:email_contato_grupo_membros(
            grupo:email_contato_grupos(nome)
          )
        `)
        .eq('email_conta_id', contaId)
        .order('nome');

      if (fetchError) throw fetchError;

      // Criar CSV
      const headers = ['Nome', 'Email', 'Telefone', 'Grupo'];
      const rows = (data || []).map(contact => {
        const grupos = contact.grupos?.map((g: any) => g.grupo?.nome).filter(Boolean).join(', ') || '';
        return [
          `"${contact.nome || ''}"`,
          `"${contact.email || ''}"`,
          `"${contact.telefone || ''}"`,
          `"${grupos}"`
        ].join(',');
      });

      return [headers.join(','), ...rows].join('\n');
    } catch (err: any) {
      console.error('[useEmailContatos] exportContactsToCSV error:', err);
      return '';
    }
  }, []);

  // ============ CACHE ============

  const clearCache = useCallback(() => {
    contactsCache.clear();
    groupsCache.clear();
    setContacts([]);
    setGroups([]);
  }, []);

  return {
    contacts,
    groups,
    isLoading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    searchContacts,
    importContactsFromCSV,
    exportContactsToCSV,
    clearCache
  };
}
