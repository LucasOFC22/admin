import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthenticatedSupabaseClient } from '@/config/supabaseAuth';
import { notasWhatsappService } from '@/services/whatsapp/notasWhatsappService';
import { InternalNote, CreateNoteData, UpdateNoteData, NotesFilter } from '@/types/internalNotes';
import { useCustomNotifications } from './useCustomNotifications';
import { usePermissionGuard } from './usePermissionGuard';

export const useNotasWhatsapp = (
  chatId: number | null,
  currentUserId: string | null,
  isAdmin: boolean = false
) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NotesFilter>({
    showPrivate: true,
    showPublic: true,
    onlyImportant: false,
    onlyMyNotes: false,
    tipo: 'all',
  });
  const { notify } = useCustomNotifications();
  const notifyRef = useRef(notify);
  const { hasPermission } = usePermissionGuard();

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // Carregar notas
  const loadNotes = useCallback(async () => {
    if (!chatId) {
      setNotes([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await notasWhatsappService.getNotes(chatId);
      setNotes(data ?? []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No rows') && !errorMessage.includes('PGRST116')) {
        notifyRef.current.error('Erro', 'Não foi possível carregar as notas');
      }
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Carregar ao montar ou mudar chatId
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;

    const supabaseClient = getAuthenticatedSupabaseClient();
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel(`notas-whatsapp-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notas_whatsapp',
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [chatId, loadNotes]);

  // Aplicar filtros nas notas
  const filteredNotes = useCallback(() => {
    return notes.filter((note) => {
      // Filtro público/privado
      if (!filter.showPrivate && note.isPrivada) return false;
      if (!filter.showPublic && !note.isPrivada) return false;

      // Filtro apenas importantes
      if (filter.onlyImportant && !note.isImportante) return false;

      // Filtro apenas minhas notas
      if (filter.onlyMyNotes && note.autorId !== currentUserId) return false;

      // Filtro por tipo
      if (filter.tipo && filter.tipo !== 'all' && note.tipo !== filter.tipo) return false;

      return true;
    });
  }, [notes, filter, currentUserId]);

  // Criar nota
  const createNote = useCallback(
    async (data: Omit<CreateNoteData, 'chatId' | 'autorId'>) => {
      if (!chatId || !currentUserId) {
        notifyRef.current.error('Erro', 'Chat ou usuário não identificado');
        return null;
      }

      if (!data.conteudo?.trim()) {
        notifyRef.current.error('Erro', 'Conteúdo não pode estar vazio');
        return null;
      }

      try {
        const note = await notasWhatsappService.createNote({
          ...data,
          chatId,
          autorId: currentUserId,
        });
        notifyRef.current.success('Sucesso', data.notaPaiId ? 'Resposta adicionada' : 'Nota criada');
        return note;
      } catch (error) {
        console.error('Erro ao criar nota:', error);
        notifyRef.current.error('Erro', 'Não foi possível criar a nota');
        return null;
      }
    },
    [chatId, currentUserId]
  );

  // Atualizar nota
  const updateNote = useCallback(
    async (noteId: string, data: UpdateNoteData) => {
      try {
        const note = await notasWhatsappService.updateNote(noteId, data);
        notifyRef.current.success('Sucesso', 'Nota atualizada');
        return note;
      } catch (error) {
        console.error('Erro ao atualizar nota:', error);
        const message = error instanceof Error ? error.message : 'Não foi possível atualizar a nota';
        notifyRef.current.error('Erro', message);
        return null;
      }
    },
    []
  );

  // Deletar nota
  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        await notasWhatsappService.deleteNote(noteId);
        notifyRef.current.success('Sucesso', 'Nota excluída');
        return true;
      } catch (error) {
        console.error('Erro ao deletar nota:', error);
        const message = error instanceof Error ? error.message : 'Não foi possível excluir a nota';
        notifyRef.current.error('Erro', message);
        return false;
      }
    },
    []
  );

  // Toggle importante
  const toggleImportante = useCallback(
    async (noteId: string, isImportante: boolean) => {
      try {
        await notasWhatsappService.toggleImportante(noteId, isImportante);
        return true;
      } catch (error) {
        console.error('Erro ao marcar importante:', error);
        notifyRef.current.error('Erro', 'Não foi possível atualizar a nota');
        return false;
      }
    },
    []
  );

  // Adicionar reação
  const addReaction = useCallback(
    async (noteId: string, emoji: string, userName: string) => {
      if (!currentUserId) return false;
      try {
        await notasWhatsappService.addReaction(noteId, emoji, currentUserId, userName);
        return true;
      } catch (error) {
        console.error('Erro ao adicionar reação:', error);
        return false;
      }
    },
    [currentUserId]
  );

  // Buscar respostas de uma nota
  const loadReplies = useCallback(async (notaPaiId: string): Promise<InternalNote[]> => {
    try {
      return await notasWhatsappService.getReplies(notaPaiId);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      return [];
    }
  }, []);

  // Verificar se usuário pode editar uma nota
  const canEdit = useCallback(
    (note: InternalNote) => {
      if (!currentUserId) return false;
      // Próprio usuário sempre pode editar suas notas
      if (note.autorId === currentUserId) return true;
      // Para notas de outros, verificar permissão
      return hasPermission('admin.whatsapp.notas.editar');
    },
    [currentUserId, hasPermission]
  );

  // Verificar se usuário pode deletar uma nota
  const canDelete = useCallback(
    (note: InternalNote) => {
      if (!currentUserId) return false;
      // Próprio usuário sempre pode deletar suas notas
      if (note.autorId === currentUserId) return true;
      // Para notas de outros, verificar permissão
      return hasPermission('admin.whatsapp.notas.excluir');
    },
    [currentUserId, hasPermission]
  );

  return {
    notes: filteredNotes(),
    allNotes: notes,
    isLoading,
    filter,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
    toggleImportante,
    addReaction,
    loadReplies,
    canEdit,
    canDelete,
    refresh: loadNotes,
  };
};
