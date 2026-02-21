import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { getBackendUrl } from '@/config/backend.config';

export interface ContatoWhatsApp {
  id: string;
  nome: string;
  telefone: string;
  perfil?: string;
  criadoem: string;
  ultimoChat?: {
    id: string;
    data: string;
  };
}

class ContatosService {
  async listar(): Promise<ContatoWhatsApp[]> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('*')
        .order('criadoem', { ascending: false });

      if (error) throw error;

      // Buscar último chat de cada contato
      const contatosComUltimoChat = await Promise.all(
        (data || []).map(async (contato) => {
          const { data: ultimoChat } = await supabase
            .from('chats_whatsapp')
            .select('id, criadoem')
            .eq('telefone', contato.telefone)
            .order('criadoem', { ascending: false })
            .limit(1)
            .single();

          return {
            ...contato,
            ultimoChat: ultimoChat ? {
              id: ultimoChat.id,
              data: ultimoChat.criadoem
            } : undefined
          };
        })
      );

      return contatosComUltimoChat;
    } catch (error) {
      console.error('Erro ao listar contatos:', error);
      throw error;
    }
  }

  async criar(contato: { nome: string; telefone: string }): Promise<ContatoWhatsApp> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .insert([contato])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw error;
    }
  }

  async atualizar(id: string, contato: { nome: string; telefone: string }): Promise<ContatoWhatsApp> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .update(contato)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      throw error;
    }
  }

  async deletar(id: string): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('contatos_whatsapp')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar contato:', error);
      throw error;
    }
  }

  async buscarPorTelefone(telefone: string): Promise<ContatoWhatsApp | null> {
    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('contatos_whatsapp')
        .select('*')
        .eq('telefone', telefone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar contato por telefone:', error);
      return null;
    }
  }

  async importarContatos(contatos: Array<{ nome: string; telefone: string }>): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      const { error } = await supabase
        .from('contatos_whatsapp')
        .insert(contatos);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      throw error;
    }
  }

  async atualizarFotoPerfil(contatoId: string, telefone: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(getBackendUrl('/whatsapp/perfil'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefone,
          contatos_id: contatoId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      throw error;
    }
  }
}

export const contatosService = new ContatosService();
