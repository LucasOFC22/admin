import { create } from 'zustand';
import type { EmailMessage, EmailPasta } from '@/types/email';
import type { BackendEmailThread, ThreadPagination } from '@/types/emailThread';

interface EmailState {
  // Conta atual
  contaAtual: { id: string; email: string; nome: string } | null;
  setContaAtual: (conta: { id: string; email: string; nome: string } | null) => void;
  
  // Emails da pasta atual (para compatibilidade com componentes que ainda usam emails)
  emails: EmailMessage[];
  setEmails: (emails: EmailMessage[]) => void;
  updateEmail: (id: string, updates: Partial<EmailMessage>) => void;
  
  // Emails enviados (para threading completo inbox + sent)
  sentEmails: EmailMessage[];
  setSentEmails: (emails: EmailMessage[]) => void;
  
  // Função para obter todos os emails para threading (inbox + sent)
  getAllEmailsForThread: () => EmailMessage[];
  
  // Threads paginadas do backend
  threads: BackendEmailThread[];
  setThreads: (threads: BackendEmailThread[]) => void;
  updateThread: (threadId: string, updates: Partial<BackendEmailThread>) => void;
  
  // Paginação
  pagination: ThreadPagination;
  setPagination: (pagination: ThreadPagination) => void;
  
  // Pasta atual
  pastaAtual: EmailPasta;
  setPastaAtual: (pasta: EmailPasta) => void;
  
  // Seleção
  selectedIds: string[];
  selectEmail: (id: string) => void;
  deselectEmail: (id: string) => void;
  toggleEmail: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Email aberto
  emailAberto: EmailMessage | null;
  setEmailAberto: (email: EmailMessage | null) => void;
  
  // Navegação entre emails
  emailIndex: number;
  navegarParaProximo: () => void;
  navegarParaAnterior: () => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Composer
  composerAberto: boolean;
  composerModo: 'new' | 'reply' | 'replyAll' | 'forward';
  composerEmailOriginal: EmailMessage | null;
  abrirComposer: (modo: 'new' | 'reply' | 'replyAll' | 'forward', emailOriginal?: EmailMessage) => void;
  fecharComposer: () => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  // Conta
  contaAtual: null,
  setContaAtual: (conta) => set({ contaAtual: conta }),
  
  // Emails da pasta atual
  emails: [],
  setEmails: (emails) => set({ emails }),
  updateEmail: (id, updates) => set((state) => ({
    emails: state.emails.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),
  
  // Emails enviados (para threading completo)
  sentEmails: [],
  setSentEmails: (emails) => set({ sentEmails: emails }),
  
  // Função para obter todos os emails para threading (combina inbox + sent)
  getAllEmailsForThread: () => {
    const state = get();
    // Combinar emails da pasta atual + enviados, removendo duplicados por message_id
    const allEmails = [...state.emails, ...state.sentEmails];
    const uniqueMap = new Map<string, EmailMessage>();
    for (const email of allEmails) {
      const key = email.message_id || `${email.pasta}:${email.id}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, email);
      }
    }
    return Array.from(uniqueMap.values());
  },
  
  // Threads do backend
  threads: [],
  setThreads: (threads) => set({ threads }),
  updateThread: (threadId, updates) => set((state) => ({
    threads: state.threads.map((t) => t.thread_id === threadId ? { ...t, ...updates } : t)
  })),
  
  // Paginação
  pagination: {
    page: 1,
    total_threads: 0,
    total_pages: 0,
    threads_per_page: 20,
  },
  setPagination: (pagination) => set({ pagination }),
  
  // Pasta
  pastaAtual: 'inbox',
  setPastaAtual: (pasta) => set({ pastaAtual: pasta, selectedIds: [], emailAberto: null }),
  
  // Seleção
  selectedIds: [],
  selectEmail: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id]
  })),
  deselectEmail: (id) => set((state) => ({
    selectedIds: state.selectedIds.filter((i) => i !== id)
  })),
  toggleEmail: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((i) => i !== id)
      : [...state.selectedIds, id]
  })),
  selectAll: () => set((state) => ({
    selectedIds: state.emails.map((e) => e.id)
  })),
  clearSelection: () => set({ selectedIds: [] }),
  isSelected: (id) => get().selectedIds.includes(id),
  
  // Email aberto
  emailAberto: null,
  emailIndex: 0,
  setEmailAberto: (email) => {
    if (email) {
      const { emails } = get();
      const emailsOrdenados = [...emails].sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      const index = emailsOrdenados.findIndex(e => e.id === email.id);
      set({ emailAberto: email, emailIndex: index >= 0 ? index : 0 });
    } else {
      set({ emailAberto: null, emailIndex: 0 });
    }
  },
  
  // Navegação
  navegarParaProximo: () => {
    const { emails, emailIndex } = get();
    const emailsOrdenados = [...emails].sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    if (emailIndex < emailsOrdenados.length - 1) {
      const nextIndex = emailIndex + 1;
      set({ emailAberto: emailsOrdenados[nextIndex], emailIndex: nextIndex });
    }
  },
  navegarParaAnterior: () => {
    const { emails, emailIndex } = get();
    const emailsOrdenados = [...emails].sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    if (emailIndex > 0) {
      const prevIndex = emailIndex - 1;
      set({ emailAberto: emailsOrdenados[prevIndex], emailIndex: prevIndex });
    }
  },
  
  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Composer
  composerAberto: false,
  composerModo: 'new',
  composerEmailOriginal: null,
  abrirComposer: (modo, emailOriginal) => set({
    composerAberto: true,
    composerModo: modo,
    composerEmailOriginal: emailOriginal || null
  }),
  fecharComposer: () => set({
    composerAberto: false,
    composerEmailOriginal: null
  }),
}));
