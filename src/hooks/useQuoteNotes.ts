import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface QuoteNote {
  id: number;
  mensagem: string;
  criado_em: string;
  atualizado_em: string;
  cotacao_id: string;
  usuario_id: number;
  usuario_nome?: string;
}

export const useQuoteNotes = (cotacaoId: string) => {
  const { user } = useUnifiedAuth();
  const [notes, setNotes] = useState<QuoteNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchNotes = async () => {
    if (!cotacaoId) return;
    
    try {
      setIsLoading(true);
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('cotacao_notas')
        .select(`*, usuarios!cotacao_notas_usuario_id_fkey (nome)`)
        .eq('cotacao_id', cotacaoId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      
      const notesWithUserNames = (data || []).map(note => ({
        ...note,
        usuario_nome: note.usuarios?.nome || 'Usuário Desconhecido'
      }));
      
      setNotes(notesWithUserNames);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      toast.error('Erro ao carregar notas');
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async (mensagem: string) => {
    if (!mensagem.trim() || !cotacaoId) return;

    try {
      if (!user?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      setIsAdding(true);
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase
        .from('cotacao_notas')
        .insert([{ mensagem: mensagem.trim(), cotacao_id: cotacaoId, usuario_id: parseInt(user.id) }])
        .select(`*, usuarios!cotacao_notas_usuario_id_fkey (nome)`)
        .single();

      if (error) throw error;

      const noteWithUserName = { ...data, usuario_nome: data.usuarios?.nome || 'Usuário Desconhecido' };
      setNotes(prev => [noteWithUserName, ...prev]);
      toast.success('Nota adicionada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota');
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [cotacaoId]);

  return { notes, isLoading, isAdding, addNote, refetch: fetchNotes };
};
