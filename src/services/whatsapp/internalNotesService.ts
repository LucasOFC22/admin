import { requireAuthenticatedClient } from '@/config/supabaseAuth';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

export interface InternalNote {
  id: string;
  chatId: string;
  adminId: string;
  mensagem: string;
  tipo: string;
  criadoEm: Date;
  marcador?: 'importante' | 'urgente' | 'pendente' | null;
  anexos?: string[] | null;
  adminNome?: string;
}

class InternalNotesService {
  /**
   * Listar notas internas de um chat
   * Ordenadas por criado_em ascendente
   */
  async getInternalNotes(chatId: string): Promise<InternalNote[]> {
    try {
      // Buscar notas sem join
      const { data: notesData, error } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .select('*')
        .eq('chat_id', chatId)
        .order('criado_em', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos admins separadamente
      const adminIds = [...new Set((notesData || []).map(note => note.admin_id))];
      const { data: adminsData } = await getSupabase()
        .from('usuarios')
        .select('id, nome')
        .in('id', adminIds);

      // Criar mapa de admin_id -> nome
      const adminNamesMap = new Map(
        (adminsData || []).map(admin => [admin.id, admin.nome])
      );

      const notes: InternalNote[] = (notesData || []).map(note => ({
        id: note.id,
        chatId: note.chat_id,
        adminId: note.admin_id,
        mensagem: note.mensagem,
        tipo: note.tipo || 'mensagem',
        criadoEm: new Date(note.criado_em),
        marcador: note.marcador,
        anexos: note.anexos,
        adminNome: adminNamesMap.get(note.admin_id) || 'Admin'
      }));

      return notes;
    } catch (error) {
      console.error('Erro ao buscar notas internas:', error);
      throw error;
    }
  }

  /**
   * Criar nova nota interna
   * Vinculada ao chat_id e admin_id
   */
  async createInternalNote(data: {
    chatId: string;
    adminId: string;
    mensagem: string;
    tipo?: string;
    marcador?: 'importante' | 'urgente' | 'pendente' | null;
    anexos?: string[] | null;
  }): Promise<InternalNote> {
    try {
      if (!data.mensagem?.trim()) {
        throw new Error('Mensagem não pode estar vazia');
      }

      const { data: noteData, error } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .insert([{
          chat_id: data.chatId,
          admin_id: data.adminId,
          mensagem: data.mensagem.trim(),
          tipo: data.tipo || 'mensagem',
          marcador: data.marcador,
          anexos: data.anexos
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Buscar nome do admin
      const { data: adminData } = await getSupabase()
        .from('usuarios')
        .select('nome')
        .eq('id', data.adminId)
        .single();

      const newNote: InternalNote = {
        id: noteData.id,
        chatId: noteData.chat_id,
        adminId: noteData.admin_id,
        mensagem: noteData.mensagem,
        tipo: noteData.tipo,
        criadoEm: new Date(noteData.criado_em),
        marcador: noteData.marcador,
        anexos: noteData.anexos,
        adminNome: adminData?.nome || 'Admin'
      };

      return newNote;
    } catch (error) {
      console.error('Erro ao criar nota interna:', error);
      throw error;
    }
  }

  /**
   * Atualizar nota interna
   * Apenas se admin_id = operador E criado_em < 5 minutos
   */
  async updateInternalNote(
    noteId: string,
    adminId: string,
    mensagem: string
  ): Promise<InternalNote> {
    try {
      if (!mensagem?.trim()) {
        throw new Error('Mensagem não pode estar vazia');
      }

      // Verificar se a nota existe e pertence ao admin
      const { data: existingNote, error: fetchError } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .select('*')
        .eq('id', noteId)
        .eq('admin_id', adminId)
        .single();

      if (fetchError) throw fetchError;
      if (!existingNote) throw new Error('Nota não encontrada ou sem permissão');

      // Verificar se foi criada há menos de 5 minutos
      const criadoEm = new Date(existingNote.criado_em);
      const agora = new Date();
      const diferenca = (agora.getTime() - criadoEm.getTime()) / 1000 / 60; // em minutos

      if (diferenca >= 5) {
        throw new Error('Tempo de edição expirado (5 minutos)');
      }

      // Atualizar mensagem
      const { data: updatedData, error: updateError } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .update({ mensagem: mensagem.trim() })
        .eq('id', noteId)
        .eq('admin_id', adminId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Buscar nome do admin
      const { data: adminData } = await getSupabase()
        .from('usuarios')
        .select('nome')
        .eq('id', adminId)
        .single();

      const updatedNote: InternalNote = {
        id: updatedData.id,
        chatId: updatedData.chat_id,
        adminId: updatedData.admin_id,
        mensagem: updatedData.mensagem,
        tipo: updatedData.tipo,
        criadoEm: new Date(updatedData.criado_em),
        marcador: updatedData.marcador,
        anexos: updatedData.anexos,
        adminNome: adminData?.nome || 'Admin'
      };

      return updatedNote;
    } catch (error) {
      console.error('Erro ao atualizar nota interna:', error);
      throw error;
    }
  }

  /**
   * Deletar nota interna
   * Apenas se admin_id = operador E criado_em < 5 minutos
   */
  async deleteInternalNote(noteId: string, adminId: string): Promise<void> {
    try {
      // Verificar se a nota existe e pertence ao admin
      const { data: existingNote, error: fetchError } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .select('*')
        .eq('id', noteId)
        .eq('admin_id', adminId)
        .single();

      if (fetchError) throw fetchError;
      if (!existingNote) throw new Error('Nota não encontrada ou sem permissão');

      // Verificar se foi criada há menos de 5 minutos
      const criadoEm = new Date(existingNote.criado_em);
      const agora = new Date();
      const diferenca = (agora.getTime() - criadoEm.getTime()) / 1000 / 60; // em minutos

      if (diferenca >= 5) {
        throw new Error('Tempo de exclusão expirado (5 minutos)');
      }

      // Deletar nota
      const { error: deleteError } = await getSupabase()
        .from('conversas_internas_whatsapp')
        .delete()
        .eq('id', noteId)
        .eq('admin_id', adminId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Erro ao deletar nota interna:', error);
      throw error;
    }
  }

  /**
   * Verificar se uma nota pode ser editada
   * Regras: admin_id = operador E criado_em < 5 minutos
   */
  canEditNote(note: InternalNote, currentAdminId: string): boolean {
    if (note.adminId !== currentAdminId) return false;

    const criadoEm = new Date(note.criadoEm);
    const agora = new Date();
    const diferenca = (agora.getTime() - criadoEm.getTime()) / 1000 / 60; // em minutos

    return diferenca < 5;
  }

  /**
   * Calcular tempo restante para edição (em segundos)
   */
  getTimeLeftForEdit(note: InternalNote): number {
    const criadoEm = new Date(note.criadoEm);
    const agora = new Date();
    const diferencaSegundos = (agora.getTime() - criadoEm.getTime()) / 1000;
    const tempoRestante = 300 - diferencaSegundos; // 300 segundos = 5 minutos

    return Math.max(0, Math.floor(tempoRestante));
  }
}

export const internalNotesService = new InternalNotesService();
