import { useState, useCallback, useEffect, useRef } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { useEmailStore } from '@/stores/emailStore';
import type { EmailMessage, EmailPasta } from '@/types/email';
import type { EmailThread } from '@/utils/emailThreading';

const AUTO_SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutos

interface ThreadsResponse {
  success: boolean;
  threads: EmailThread[];
  pagination: {
    page: number;
    total_threads: number;
    total_pages: number;
    threads_per_page: number;
  };
  pasta: string;
  actualFolder?: string;
  error?: string;
}

interface UseEmailThreadsOptions {
  contaId?: string;
  pasta?: string;
  emailsPerPage?: number;
}

/**
 * Hook para gerenciar emails agrupados em conversas.
 * O agrupamento é feito no backend pela edge function email-sync.
 */
export function useEmailThreads(options: UseEmailThreadsOptions) {
  const { contaId, pasta = 'INBOX', emailsPerPage = 20 } = options;
  
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [allEmails, setAllEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalThreads, setTotalThreads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();
  
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastContaIdRef = useRef<string | undefined>();
  const lastPastaRef = useRef<string>(pasta);
  
  const { setEmails, setSentEmails, contaAtual } = useEmailStore();

  // Reset quando conta ou pasta mudar
  useEffect(() => {
    if (contaId !== lastContaIdRef.current || pasta !== lastPastaRef.current) {
      lastContaIdRef.current = contaId;
      lastPastaRef.current = pasta;
      hasLoadedRef.current = false;
      setThreads([]);
      setAllEmails([]);
      setCurrentPage(1);
      setTotalThreads(0);
      setTotalPages(0);
    }
  }, [contaId, pasta]);

  /**
   * Sincroniza emails do IMAP via edge function email-sync
   * O backend retorna threads já agrupadas e paginadas
   */
  const syncEmails = useCallback(async (
    showToast: boolean = false,
    silent: boolean = false,
    page: number = currentPage
  ) => {
    if (!contaId) return;

    try {
      if (!silent) {
        setSyncing(true);
        if (!hasLoadedRef.current) {
          setLoading(true);
        }
      }
      setError(null);

      console.log('[useEmailThreads] Sincronizando emails:', { contaId, pasta, page, emailsPerPage });

      const supabase = requireAuthenticatedClient();
      // Buscar emails do backend (já agrupados e paginados)
      const { data, error: syncError } = await supabase.functions.invoke('email-sync', {
        body: {
          conta_id: contaId,
          pasta,
          page,
          threads_per_page: emailsPerPage,
          include_sent_for_threading: pasta === 'INBOX' || pasta === 'inbox'
        }
      });

      if (syncError) throw syncError;

      const response = data as ThreadsResponse;

      if (response.success && response.threads) {
        console.log('[useEmailThreads] Recebidos', response.threads.length, 'conversas');
        
        // Usar emails agrupados do backend
        setThreads(response.threads);
        
        // Atualizar paginação do backend
        if (response.pagination) {
          setTotalThreads(response.pagination.total_threads);
          setTotalPages(response.pagination.total_pages);
          setCurrentPage(response.pagination.page);
        }
        
        // Extrair todos os emails das threads para o store
        const allEmailsFromThreads = response.threads.flatMap(t => t.emails);
        setAllEmails(allEmailsFromThreads);
        setEmails(allEmailsFromThreads.filter(e => e.pasta === 'inbox' || !e.pasta));
        setSentEmails(allEmailsFromThreads.filter(e => e.pasta === 'sent'));
        
        hasLoadedRef.current = true;

        if (showToast) {
          const totalConversas = response.pagination?.total_threads || response.threads.length;
          toast({
            title: 'Emails sincronizados',
            description: `${totalConversas} ${totalConversas === 1 ? 'conversa carregada' : 'conversas carregadas'} com sucesso`
          });
        }
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (err: any) {
      console.error('[useEmailThreads] Erro ao sincronizar:', err);
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
  }, [contaId, pasta, emailsPerPage, currentPage, toast, setEmails, setSentEmails]);

  // Auto-sync a cada 3 minutos
  useEffect(() => {
    if (!contaId) return;

    autoSyncRef.current = setInterval(() => {
      syncEmails(false, true);
    }, AUTO_SYNC_INTERVAL);

    return () => {
      if (autoSyncRef.current) {
        clearInterval(autoSyncRef.current);
        autoSyncRef.current = null;
      }
    };
  }, [contaId, syncEmails]);

  // Navegar para próxima página
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      syncEmails(false, false, newPage);
    }
  }, [currentPage, totalPages, syncEmails]);

  // Navegar para página anterior
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      syncEmails(false, false, newPage);
    }
  }, [currentPage, syncEmails]);

  // Ir para página específica
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      syncEmails(false, false, page);
    }
  }, [totalPages, syncEmails]);

  // Forçar sincronização com toast
  const forceRefresh = useCallback(() => {
    return syncEmails(true, false, 1);
  }, [syncEmails]);

  // Refresh silencioso (sem toast) - para usar após ações em lote
  const silentRefresh = useCallback(() => {
    return syncEmails(false, false, 1);
  }, [syncEmails]);

  // Contar não lidos
  const unreadCount = threads.filter(t => t.unread).length;

  return {
    threads,
    allThreads: threads,
    allEmails,
    pagination: {
      page: currentPage,
      total_threads: totalThreads,
      total_pages: totalPages,
      threads_per_page: emailsPerPage,
    },
    loading,
    syncing,
    error,
    unreadCount,
    syncEmails: () => syncEmails(false, false, currentPage),
    nextPage,
    prevPage,
    goToPage,
    refresh: () => syncEmails(true),
    forceRefresh,
    silentRefresh,
  };
}
