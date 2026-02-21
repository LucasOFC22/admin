import { useState, useCallback, useEffect, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { EmailMessage, EmailPasta } from '@/types/email';
import { useToast } from '@/hooks/use-toast';
import { useEmailStore } from '@/stores/emailStore';

const AUTO_SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutos

/**
 * Hook para gerenciar ações de emails (mark, move, star, send, etc.)
 * 
 * Este hook é usado para:
 * - Pastas virtuais (starred, snoozed) que usam lógica específica
 * - Ações de manipulação (mark, move, star, send, archive, etc.)
 * - Sincronização de emails via IMAP (email-sync)
 */
export function useEmailMessages(contaId?: string) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPasta, setCurrentPasta] = useState<string>('INBOX');
  const { toast } = useToast();
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastContaIdRef = useRef<string | undefined>();
  const { setEmails } = useEmailStore();

  // Reset quando conta mudar
  useEffect(() => {
    if (contaId !== lastContaIdRef.current) {
      lastContaIdRef.current = contaId;
      hasLoadedRef.current = false;
      setMessages([]);
    }
  }, [contaId]);

  /**
   * Sincronizar emails de uma pasta usando email-sync
   */
  const syncMessages = useCallback(async (pasta: string = 'INBOX', showToast: boolean = true, silent: boolean = false) => {
    if (!contaId) return;

    try {
      if (!silent) {
        setSyncing(true);
        if (!hasLoadedRef.current) {
          setLoading(true);
        }
      }
      setError(null);
      setCurrentPasta(pasta);
      
      const supabase = requireAuthenticatedClient();
      const { data, error: syncError } = await supabase.functions.invoke('email-sync', {
        body: {
          conta_id: contaId,
          pasta,
          limite: 50
        }
      });

      if (syncError) throw syncError;

      if (data.success && data.emails) {
        const mappedMessages: EmailMessage[] = data.emails.map((m: any) => ({
          id: m.id,
          uid: m.uid,
          email_conta_id: contaId,
          message_id: m.message_id,
          de: m.de,
          de_nome: m.de_nome,
          para: m.para || [],
          cc: m.cc,
          assunto: m.assunto || '(Sem assunto)',
          preview: m.preview || '',
          corpo: m.corpo,
          data: m.data,
          lido: m.lido,
          starred: m.starred || false,
          anexos: m.anexos,
          pasta: m.pasta,
          headers: m.headers,
          references: m.references || [],
          in_reply_to: m.in_reply_to || ''
        }));
        
        setMessages(mappedMessages);
        setEmails(mappedMessages);
        hasLoadedRef.current = true;
        
        if (showToast && !autoSyncRef.current) {
          toast({
            title: 'Sincronização concluída',
            description: `${data.synced} emails carregados`
          });
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err);
      setError(err.message);
      if (showToast) {
        toast({
          title: 'Erro na sincronização',
          description: err.message,
          variant: 'destructive'
        });
      }
    } finally {
      if (!silent) {
        setSyncing(false);
        setLoading(false);
      }
    }
  }, [contaId, toast, setEmails]);

  // Auto-sync a cada 3 minutos
  useEffect(() => {
    if (!contaId) return;

    autoSyncRef.current = setInterval(() => {
      syncMessages(currentPasta, false);
    }, AUTO_SYNC_INTERVAL);

    return () => {
      if (autoSyncRef.current) {
        clearInterval(autoSyncRef.current);
        autoSyncRef.current = null;
      }
    };
  }, [contaId, currentPasta, syncMessages]);

  const sendEmail = useCallback(async (
    para: string[],
    assunto: string,
    corpo: string,
    cc?: string[],
    cco?: string[],
    html?: boolean
  ) => {
    if (!contaId) return false;

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error: sendError } = await supabase.functions.invoke('email-send', {
        body: {
          conta_id: contaId,
          para,
          cc,
          cco,
          assunto,
          corpo,
          html: html ?? true
        }
      });

      if (sendError) throw sendError;

      if (data.success) {
        // Disparar evento para atualizar logs
        const { dispatchEmailSent } = await import('@/lib/emailEvents');
        dispatchEmailSent();
        
        toast({
          title: 'Email enviado',
          description: 'Sua mensagem foi enviada com sucesso'
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao enviar email');
      }
    } catch (err: any) {
      console.error('Erro ao enviar:', err);
      toast({
        title: 'Erro ao enviar email',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, toast]);

  const markAsRead = useCallback(async (messageId: string, uid?: number, read: boolean = true) => {
    // Atualização otimista na UI
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, lido: read } : m
    ));

    if (uid && contaId) {
      try {
        console.log(`[useEmailMessages] Marcando email ${uid} como ${read ? 'lido' : 'não lido'}`);
        
        const supabase = requireAuthenticatedClient();
        // 1. Atualizar no IMAP via Edge Function
        const { data, error } = await supabase.functions.invoke('email-mark-flags', {
          body: {
            conta_id: contaId,
            uids: [String(uid)],
            pasta: currentPasta,
            flags: ['\\Seen'],
            action: read ? 'add' : 'remove'
          }
        });

        if (error) {
          console.error('[useEmailMessages] Erro ao marcar no IMAP:', error);
          // Reverter UI
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, lido: !read } : m
          ));
          toast({
            title: 'Erro',
            description: 'Não foi possível marcar o email no servidor',
            variant: 'destructive'
          });
          return false;
        }


        // 3. Atualizar contagem de não lidos na thread (background)
        const email = messages.find(m => m.id === messageId);
        if (email) {
          supabase.rpc('update_thread_unread_count', {
            p_email_conta_id: contaId,
            p_thread_id: (email as any).thread_id || messageId
          }).then(({ error: threadError }) => {
            if (threadError) {
              console.warn('[useEmailMessages] Erro ao atualizar thread:', threadError);
            }
          });
        }

        console.log('[useEmailMessages] Email marcado com sucesso');
        return true;
      } catch (err) {
        console.error('[useEmailMessages] Erro ao marcar:', err);
        return false;
      }
    }
    return true;
  }, [contaId, currentPasta, messages, toast]);

  const toggleStar = useCallback(async (messageId: string, uid?: number, pastaOrigem?: string) => {
    const email = messages.find(m => m.id === messageId);
    if (!email) return false;
    
    const newStarred = !email.starred;
    
    // Atualização otimista na UI
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, starred: newStarred } : m
    ));

    if (uid && contaId) {
      try {
        const pastaParaIMAP = pastaOrigem || email.pasta || currentPasta || 'INBOX';
        
        console.log(`[useEmailMessages] ${newStarred ? 'Adicionando' : 'Removendo'} estrela: uid=${uid}, pasta=${pastaParaIMAP}`);
        
        const supabase = requireAuthenticatedClient();
        // 1. Atualizar no IMAP via Edge Function
        const { data, error } = await supabase.functions.invoke('email-mark-flags', {
          body: {
            conta_id: contaId,
            uids: [String(uid)],
            pasta: pastaParaIMAP,
            flags: ['\\Flagged'],
            action: newStarred ? 'add' : 'remove'
          }
        });

        if (error) {
          console.error('[useEmailMessages] Erro ao marcar estrela no IMAP:', error);
          // Reverter UI
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, starred: !newStarred } : m
          ));
          toast({
            title: 'Erro',
            description: 'Não foi possível atualizar estrela no servidor',
            variant: 'destructive'
          });
          return false;
        }


        // 3. Atualizar flag tem_starred na thread (background)
        const threadId = (email as any).thread_id || messageId;
        supabase
          .from('email_threads')
          .update({ tem_starred: newStarred })
          .eq('email_conta_id', contaId)
          .eq('thread_id', threadId)
          .then(({ error: threadError }) => {
            if (threadError) {
              console.warn('[useEmailMessages] Erro ao atualizar thread:', threadError);
            }
          });

        console.log('[useEmailMessages] Estrela atualizada com sucesso');
        return true;
      } catch (err) {
        console.error('[useEmailMessages] Erro ao marcar estrela:', err);
        return false;
      }
    }
    return true;
  }, [contaId, currentPasta, messages, toast]);

  const moveToFolder = useCallback(async (messageId: string, targetFolder: EmailPasta, uid?: number) => {
    if (!contaId) return false;

    const email = messages.find(m => m.id === messageId);
    const emailUid = uid || email?.uid;

    try {
      console.log(`[useEmailMessages] Movendo email uid=${emailUid} para ${targetFolder}`);
      
      const supabase = requireAuthenticatedClient();
      // 1. Mover no IMAP via Edge Function
      const { data, error: moveError } = await supabase.functions.invoke('email-move', {
        body: {
          conta_id: contaId,
          message_uid: String(emailUid || messageId),
          pasta_origem: currentPasta,
          pasta_destino: targetFolder
        }
      });

      if (moveError) throw moveError;

      if (data.success) {
        // Atualizar UI
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        
        toast({
          title: 'Email movido',
          description: `Email movido para ${targetFolder}`
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao mover email');
      }
    } catch (err: any) {
      console.error('Erro ao mover email:', err);
      toast({
        title: 'Erro ao mover email',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, currentPasta, messages, toast]);

  const moveMultipleToFolder = useCallback(async (messageIds: string[], targetFolder: EmailPasta, emailsFromThread?: EmailMessage[]) => {
    if (!contaId || messageIds.length === 0) return false;

    // Usar emails passados diretamente ou buscar do estado local
    const sourceMessages = emailsFromThread && emailsFromThread.length > 0 ? emailsFromThread : messages;
    
    console.log('[moveMultipleToFolder] messageIds:', messageIds);
    console.log('[moveMultipleToFolder] sourceMessages count:', sourceMessages.length);
    console.log('[moveMultipleToFolder] sourceMessages sample:', sourceMessages.slice(0, 3).map(m => ({ id: m.id, uid: m.uid })));

    // Buscar UIDs: primeiro como mensagem direta, depois por thread_id
    const uids = messageIds
      .flatMap(id => {
        // Tentar encontrar como mensagem direta
        const directMessage = sourceMessages.find(m => m.id === id);
        if (directMessage?.uid) {
          return [directMessage.uid];
        }
        
        // Se não encontrar, buscar como thread (todas as mensagens do thread)
        const threadMessages = sourceMessages.filter(m => m.thread_id === id);
        if (threadMessages.length > 0) {
          return threadMessages.map(m => m.uid).filter((uid): uid is number => uid !== undefined);
        }
        
        return [];
      })
      .filter((uid): uid is number => uid !== undefined)
      .map(String);

    console.log('[moveMultipleToFolder] resolved uids:', uids);

    if (uids.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum email válido selecionado',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error: moveError } = await supabase.functions.invoke('email-move', {
        body: {
          conta_id: contaId,
          uids,
          pasta_origem: currentPasta,
          pasta_destino: targetFolder
        }
      });

      if (moveError) throw moveError;

      if (data.success) {
        setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
        
        toast({
          title: 'Emails movidos',
          description: `${data.moved || uids.length} email(s) movido(s) para ${targetFolder}`
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao mover emails');
      }
    } catch (err: any) {
      console.error('Erro ao mover emails:', err);
      toast({
        title: 'Erro ao mover emails',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, currentPasta, messages, toast]);

  const deletePermanently = useCallback(async (messageIds: string[], emailsFromThread?: EmailMessage[]) => {
    if (!contaId || messageIds.length === 0) return false;

    // Usar emails passados diretamente ou buscar do estado local
    const sourceMessages = emailsFromThread && emailsFromThread.length > 0 ? emailsFromThread : messages;

    console.log('[deletePermanently] messageIds:', messageIds);
    console.log('[deletePermanently] sourceMessages count:', sourceMessages.length);

    // Buscar emails: primeiro como mensagem direta, depois por thread_id
    const emailsToDelete = messageIds.flatMap(id => {
      const directMessage = sourceMessages.find(m => m.id === id);
      if (directMessage) {
        return [directMessage];
      }
      
      // Se não encontrar, buscar como thread
      const threadMessages = sourceMessages.filter(m => m.thread_id === id);
      return threadMessages;
    }).filter((m): m is EmailMessage => m !== undefined);
    
    const uids = emailsToDelete
      .map(m => m.uid)
      .filter((uid): uid is number => uid !== undefined)
      .map(String);

    console.log('[deletePermanently] resolved uids:', uids);

    if (uids.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum email válido selecionado',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log(`[useEmailMessages] Excluindo ${uids.length} emails permanentemente`);
      
      const supabase = requireAuthenticatedClient();
      // 1. Excluir no IMAP via Edge Function
      const { data, error: deleteError } = await supabase.functions.invoke('email-delete', {
        body: {
          conta_id: contaId,
          uids,
          pasta: currentPasta,
          permanente: true
        }
      });

      if (deleteError) throw deleteError;

      if (data.success) {
        // Atualizar UI
        setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
        
        
        toast({
          title: 'Emails excluídos',
          description: `${data.deleted || uids.length} email(s) excluído(s) permanentemente`
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao excluir emails');
      }
    } catch (err: any) {
      console.error('Erro ao excluir emails:', err);
      toast({
        title: 'Erro ao excluir emails',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, currentPasta, messages, toast]);

  const archiveEmail = useCallback(async (messageId: string, uid?: number) => {
    if (!contaId) return false;

    const emailUid = uid || messages.find(m => m.id === messageId)?.uid;
    if (!emailUid) {
      toast({
        title: 'Erro',
        description: 'UID do email não encontrado',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const supabase = requireAuthenticatedClient();
      const { data, error } = await supabase.functions.invoke('email-archive', {
        body: {
          conta_id: contaId,
          uids: [String(emailUid)],
          pasta_origem: currentPasta
        }
      });

      if (error) throw error;

      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        toast({
          title: 'Email arquivado',
          description: 'Email movido para arquivo'
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao arquivar email');
      }
    } catch (err: any) {
      console.error('Erro ao arquivar email:', err);
      toast({
        title: 'Erro ao arquivar',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, currentPasta, messages, toast]);

  const unreadCount = messages.filter(m => !m.lido).length;

  // Sincronizar emails com estrela
  const syncStarredMessages = useCallback(async (showToast: boolean = true) => {
    console.log('[useEmailMessages] syncStarredMessages chamado, contaId:', contaId);
    if (!contaId) return;

    try {
      setSyncing(true);
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      setCurrentPasta('starred');
      
      console.log('[useEmailMessages] Invocando edge function email-starred...');
      const supabase = requireAuthenticatedClient();
      const { data, error: syncError } = await supabase.functions.invoke('email-starred', {
        body: {
          conta_id: contaId,
          limite: 50
        }
      });

      if (syncError) throw syncError;

      if (data.success && data.emails) {
        const mappedMessages: EmailMessage[] = data.emails.map((m: any) => ({
          id: m.id,
          uid: m.uid,
          email_conta_id: contaId,
          message_id: m.message_id,
          de: m.de,
          de_nome: m.de_nome,
          para: m.para || [],
          cc: m.cc,
          assunto: m.assunto || '(Sem assunto)',
          preview: m.preview || '',
          corpo: m.corpo,
          data: m.data,
          lido: m.lido,
          starred: m.starred || true,
          anexos: m.anexos,
          pasta: m.pasta,
          headers: m.headers
        }));
        
        setMessages(mappedMessages);
        hasLoadedRef.current = true;
        
        if (showToast) {
          toast({
            title: 'Sincronização concluída',
            description: `${data.synced || mappedMessages.length} emails com estrela`
          });
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar starred:', err);
      setError(err.message);
      if (showToast) {
        toast({
          title: 'Erro na sincronização',
          description: err.message,
          variant: 'destructive'
        });
      }
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [contaId, toast]);

  // Sincronizar emails adiados (snoozed)
  const syncSnoozedMessages = useCallback(async (showToast: boolean = true) => {
    console.log('[useEmailMessages] syncSnoozedMessages chamado, contaId:', contaId);
    if (!contaId) return;

    try {
      setSyncing(true);
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      setCurrentPasta('snoozed');
      
      console.log('[useEmailMessages] Invocando edge function email-snoozed...');
      const supabase = requireAuthenticatedClient();
      const { data, error: syncError } = await supabase.functions.invoke('email-snoozed', {
        body: {
          action: 'list',
          conta_id: contaId
        }
      });

      if (syncError) throw syncError;

      if (data.success && data.emails) {
        const mappedMessages: EmailMessage[] = data.emails.map((m: any) => ({
          id: m.id,
          uid: parseInt(m.message_uid) || 0,
          email_conta_id: contaId,
          message_id: m.message_id,
          de: m.de || '',
          de_nome: m.de_nome,
          para: [],
          assunto: m.assunto || '(Sem assunto)',
          preview: `Adiado até ${new Date(m.snoozed_until).toLocaleDateString('pt-BR')}`,
          data: m.data_original || m.created_at,
          lido: true,
          starred: false,
          pasta: 'snoozed' as EmailPasta,
          headers: {
            snoozed_until: m.snoozed_until,
            pasta_origem: m.pasta_origem,
            snooze_id: m.id
          }
        }));
        
        setMessages(mappedMessages);
        hasLoadedRef.current = true;
        
        if (showToast) {
          toast({
            title: 'Sincronização concluída',
            description: `${data.count || mappedMessages.length} emails adiados`
          });
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar snoozed:', err);
      setError(err.message);
      if (showToast) {
        toast({
          title: 'Erro na sincronização',
          description: err.message,
          variant: 'destructive'
        });
      }
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [contaId, toast]);

  // Adiar email (snooze)
  const snoozeEmail = useCallback(async (
    messageId: string,
    uid: number,
    snoozedUntil: Date,
    emailData?: { assunto?: string; de?: string; de_nome?: string; data?: string; pasta?: string }
  ) => {
    if (!contaId) return false;

    try {
      console.log(`[useEmailMessages] Adiando email UID: ${uid} até ${snoozedUntil.toISOString()}`);
      
      const supabase = requireAuthenticatedClient();
      const { data, error: snoozeError } = await supabase.functions.invoke('email-snoozed', {
        body: {
          action: 'snooze',
          conta_id: contaId,
          message_uid: String(uid),
          message_id: messageId,
          pasta_origem: emailData?.pasta || currentPasta || 'INBOX',
          snoozed_until: snoozedUntil.toISOString(),
          assunto: emailData?.assunto,
          de: emailData?.de,
          de_nome: emailData?.de_nome,
          data_original: emailData?.data
        }
      });

      if (snoozeError) throw snoozeError;

      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        toast({
          title: 'Email adiado',
          description: `Lembrete em ${snoozedUntil.toLocaleDateString('pt-BR')} às ${snoozedUntil.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao adiar email');
      }
    } catch (err: any) {
      console.error('Erro ao adiar email:', err);
      toast({
        title: 'Erro ao adiar',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, currentPasta, toast]);

  // Remover adiamento (unsnooze)
  const unsnoozeEmail = useCallback(async (messageId: string, snoozeId?: string) => {
    if (!contaId) return false;

    try {
      console.log(`[useEmailMessages] Removendo adiamento: ${messageId}`);
      
      const supabase = requireAuthenticatedClient();
      const { data, error: unsnoozeError } = await supabase.functions.invoke('email-snoozed', {
        body: {
          action: 'unsnooze',
          conta_id: contaId,
          message_uid: messageId,
          snooze_id: snoozeId
        }
      });

      if (unsnoozeError) throw unsnoozeError;

      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId && m.headers?.snooze_id !== snoozeId));
        
        toast({
          title: 'Adiamento removido',
          description: 'Email movido de volta para a caixa de entrada'
        });
        return true;
      } else {
        throw new Error(data.error || 'Erro ao remover adiamento');
      }
    } catch (err: any) {
      console.error('Erro ao remover adiamento:', err);
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [contaId, toast]);

  return {
    messages,
    loading,
    syncing,
    error,
    unreadCount,
    syncMessages,
    syncStarredMessages,
    syncSnoozedMessages,
    sendEmail,
    markAsRead,
    toggleStar,
    moveToFolder,
    moveMultipleToFolder,
    deletePermanently,
    archiveEmail,
    snoozeEmail,
    unsnoozeEmail
  };
}
