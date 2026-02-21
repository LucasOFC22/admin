import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { 
  InternalNote, 
  CreateNoteData, 
  UpdateNoteData,
  RawNoteData,
  mapRawToNote 
} from '@/types/internalNotes';

class NotasWhatsappService {
  /**
   * Buscar notas de um chat (respeitando RLS)
   */
  async getNotes(chatId: number): Promise<InternalNote[]> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // Buscar notas principais (sem nota_pai_id)
      const { data: notesData, error } = await supabase
        .from('notas_whatsapp')
        .select('*')
        .eq('chat_id', chatId)
        .is('nota_pai_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos autores
      const autorIds = [...new Set((notesData || []).map(n => n.autor_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', autorIds);

      const nomeMap = new Map((usuarios || []).map(u => [u.id, u.nome]));

      // Buscar contagem de respostas para cada nota
      const noteIds = (notesData || []).map(n => n.id);
      const { data: respostasCount } = await supabase
        .from('notas_whatsapp')
        .select('nota_pai_id')
        .in('nota_pai_id', noteIds);

      const countMap = new Map<string, number>();
      (respostasCount || []).forEach(r => {
        const count = countMap.get(r.nota_pai_id) || 0;
        countMap.set(r.nota_pai_id, count + 1);
      });

      const notes: InternalNote[] = (notesData || []).map((raw: RawNoteData) => ({
        ...mapRawToNote({
          ...raw,
          autor_nome: nomeMap.get(raw.autor_id) || 'Usuário'
        }),
        respostasCount: countMap.get(raw.id) || 0
      }));

      return notes;
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      throw error;
    }
  }

  /**
   * Buscar notas de todos os chats de um contato
   */
  async getNotesForContact(contactId: string): Promise<{ notes: InternalNote[]; chatIds: number[] }> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // 1. Buscar todos os chat_ids do contato
      const { data: chats, error: chatsError } = await supabase
        .from('chats_whatsapp')
        .select('id')
        .eq('usuarioid', contactId);

      if (chatsError) throw chatsError;

      const chatIds = (chats || []).map(c => c.id);
      
      if (chatIds.length === 0) {
        return { notes: [], chatIds: [] };
      }

      // 2. Buscar notas de todos esses chats
      const { data: notesData, error: notesError } = await supabase
        .from('notas_whatsapp')
        .select('*')
        .in('chat_id', chatIds)
        .is('nota_pai_id', null)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Buscar nomes dos autores
      const autorIds = [...new Set((notesData || []).map(n => n.autor_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', autorIds);

      const nomeMap = new Map((usuarios || []).map(u => [u.id, u.nome]));

      // Buscar contagem de respostas
      const noteIds = (notesData || []).map(n => n.id);
      const { data: respostasCount } = await supabase
        .from('notas_whatsapp')
        .select('nota_pai_id')
        .in('nota_pai_id', noteIds);

      const countMap = new Map<string, number>();
      (respostasCount || []).forEach(r => {
        const count = countMap.get(r.nota_pai_id) || 0;
        countMap.set(r.nota_pai_id, count + 1);
      });

      const notes: InternalNote[] = (notesData || []).map((raw: RawNoteData) => ({
        ...mapRawToNote({
          ...raw,
          autor_nome: nomeMap.get(raw.autor_id) || 'Usuário'
        }),
        respostasCount: countMap.get(raw.id) || 0
      }));

      return { notes, chatIds };
    } catch (error) {
      console.error('Erro ao buscar notas do contato:', error);
      throw error;
    }
  }

  /**
   * Buscar respostas de uma nota
   */
  async getReplies(notaPaiId: string): Promise<InternalNote[]> {
    try {
      const supabase = requireAuthenticatedClient();
      
      const { data, error } = await supabase
        .from('notas_whatsapp')
        .select('*')
        .eq('nota_pai_id', notaPaiId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos autores
      const autorIds = [...new Set((data || []).map(n => n.autor_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', autorIds);

      const nomeMap = new Map((usuarios || []).map(u => [u.id, u.nome]));

      return (data || []).map((raw: RawNoteData) => 
        mapRawToNote({
          ...raw,
          autor_nome: nomeMap.get(raw.autor_id) || 'Usuário'
        })
      );
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
      throw error;
    }
  }

  /**
   * Criar nova nota
   */
  async createNote(data: CreateNoteData): Promise<InternalNote> {
    try {
      const supabase = requireAuthenticatedClient();
      
      if (!data.conteudo?.trim()) {
        throw new Error('Conteúdo não pode estar vazio');
      }

      const { data: noteData, error } = await supabase
        .from('notas_whatsapp')
        .insert([{
          chat_id: data.chatId,
          autor_id: data.autorId,
          conteudo: data.conteudo.trim(),
          is_privada: data.isPrivada ?? false,
          is_importante: data.isImportante ?? false,
          nota_pai_id: data.notaPaiId ?? null,
          mencoes: data.mencoes ?? [],
          anexos: data.anexos ?? [],
          tipo: data.tipo ?? 'mensagem',
          status_tarefa: data.statusTarefa ?? null,
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Buscar nome do autor
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', data.autorId)
        .single();

      return mapRawToNote({
        ...noteData,
        autor_nome: usuario?.nome || 'Usuário'
      });
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      throw error;
    }
  }

  /**
   * Atualizar nota existente
   */
  async updateNote(noteId: string, data: UpdateNoteData): Promise<InternalNote> {
    try {
      const supabase = requireAuthenticatedClient();
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        editado: true,
      };

      if (data.conteudo !== undefined) {
        updateData.conteudo = data.conteudo.trim();
      }
      if (data.isPrivada !== undefined) {
        updateData.is_privada = data.isPrivada;
      }
      if (data.isImportante !== undefined) {
        updateData.is_importante = data.isImportante;
      }
      if (data.mencoes !== undefined) {
        updateData.mencoes = data.mencoes;
      }
      if (data.reacoes !== undefined) {
        updateData.reacoes = data.reacoes;
      }
      if (data.anexos !== undefined) {
        updateData.anexos = data.anexos;
      }
      if (data.statusTarefa !== undefined) {
        updateData.status_tarefa = data.statusTarefa;
      }

      const { data: noteData, error } = await supabase
        .from('notas_whatsapp')
        .update(updateData)
        .eq('id', noteId)
        .select('*')
        .single();

      if (error) throw error;

      // Buscar nome do autor
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', noteData.autor_id)
        .single();

      return mapRawToNote({
        ...noteData,
        autor_nome: usuario?.nome || 'Usuário'
      });
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      throw error;
    }
  }

  /**
   * Deletar nota
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // Primeiro deletar respostas (se houver)
      await supabase
        .from('notas_whatsapp')
        .delete()
        .eq('nota_pai_id', noteId);

      // Depois deletar a nota principal
      const { error } = await supabase
        .from('notas_whatsapp')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      throw error;
    }
  }

  /**
   * Toggle importante
   */
  async toggleImportante(noteId: string, isImportante: boolean): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      
      const { error } = await supabase
        .from('notas_whatsapp')
        .update({ is_importante: isImportante, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar importante:', error);
      throw error;
    }
  }

  /**
   * Adicionar reação
   */
  async addReaction(noteId: string, emoji: string, userId: string, userName: string): Promise<void> {
    try {
      const supabase = requireAuthenticatedClient();
      
      // Buscar reações atuais
      const { data: note, error: fetchError } = await supabase
        .from('notas_whatsapp')
        .select('reacoes')
        .eq('id', noteId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const reacoes = note?.reacoes || [];
      
      // Verificar se já reagiu com esse emoji
      const existingIndex = reacoes.findIndex(
        (r: { emoji: string; userId: string }) => r.emoji === emoji && r.userId === userId
      );

      if (existingIndex >= 0) {
        // Remover reação existente
        reacoes.splice(existingIndex, 1);
      } else {
        // Adicionar nova reação
        reacoes.push({ emoji, userId, userName });
      }

      const { error } = await supabase
        .from('notas_whatsapp')
        .update({ reacoes, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar reação:', error);
      throw error;
    }
  }
}

export const notasWhatsappService = new NotasWhatsappService();
