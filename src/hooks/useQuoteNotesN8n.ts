
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { n8nApi } from '@/services/n8n/apiService';

interface QuoteNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export const useQuoteNotesN8n = (quoteId: string) => {
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = async () => {
    if (!quoteId) return;
    
    setIsLoading(true);
    try {
      const requestBody = {
        eventType: 'cotacao',
        acao: 'notas',
        tipo: 'buscar',
        dados: {
          cotacaoId: quoteId
        },
        timestamp: new Date().toISOString(),
        origem: 'fp_transportes_admin_system'
      };

      const response = await n8nApi.makeN8nRequest(requestBody, false);

      if (response.success) {
        const data = response.data as any;
        
        // Processar as notas com base no formato retornado
        let notasProcessadas: QuoteNote[] = [];
        
        if (Array.isArray(data)) {
          // Processar array de objetos com estrutura {json: {...}, pairedItem: {...}}
          notasProcessadas = data.map((item: any) => {
            // Extrair dados do objeto json
            const nota = item.json || item;
            return {
              id: nota.id?.toString() || '',
              content: nota.content || '',
              author: nota.author || 'Admin',
              createdAt: nota.created_at || nota.createdAt || new Date().toISOString(),
              updatedAt: nota.updated_at || nota.updatedAt
            };
          });
        } else if (data && data.notas && Array.isArray(data.notas)) {
          // Se as notas estão em data.notas
          notasProcessadas = data.notas.map((nota: any) => ({
            id: nota.id?.toString() || '',
            content: nota.content || '',
            author: nota.author || 'Admin',
            createdAt: nota.created_at || nota.createdAt || new Date().toISOString(),
            updatedAt: nota.updated_at || nota.updatedAt
          }));
        }
        
        setNotes(notasProcessadas);
      } else {
        setNotes([]);
      }
    } catch (error) {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar notas quando o quoteId mudar
  useEffect(() => {
    fetchNotes();
  }, [quoteId]);

  const sendNoteToN8n = async (noteData: any, action: 'criacao' | 'edicao' | 'excluir') => {
    try {
      const requestBody = {
        eventType: 'cotacao',
        acao: 'notas',
        tipo: action,
        dados: {
          cotacaoId: quoteId,
          nota: noteData,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        origem: 'fp_transportes_admin_system'
      };

      const response = await n8nApi.makeN8nRequest(requestBody, false);

      if (response.success) {
        // Recarregar notas após operação
        await fetchNotes();
      }
    } catch (error) {
      // Erro ao enviar nota
    }
  };

  const addNote = async (content: string) => {
    if (!content.trim() || !quoteId) return;

    setIsSaving(true);
    try {
      const newNote = {
        id: Date.now().toString(),
        content: content.trim(),
        author: 'Admin',
        createdAt: new Date().toISOString()
      };
      
      await sendNoteToN8n(newNote, 'criacao');
      
      toast({
        title: "Nota adicionada",
        description: "A nota foi salva e enviada para integração.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar nota",
        description: "Não foi possível salvar a nota.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    if (!content.trim() || !quoteId) return;

    try {
      const updatedNote = {
        id: noteId,
        content: content.trim(),
        author: 'Admin',
        updatedAt: new Date().toISOString()
      };
      
      await sendNoteToN8n(updatedNote, 'edicao');
      
      toast({
        title: "Nota atualizada",
        description: "A nota foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar nota",
        description: "Não foi possível atualizar a nota.",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!quoteId) return;

    try {
      await sendNoteToN8n({
        id: noteId,
        deletedAt: new Date().toISOString()
      }, 'excluir');
      
      toast({
        title: "Nota removida",
        description: "A nota foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover nota",
        description: "Não foi possível remover a nota.",
        variant: "destructive",
      });
    }
  };

  const refreshNotes = () => {
    fetchNotes();
  };

  return {
    notes,
    isLoading,
    isSaving,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes
  };
};
