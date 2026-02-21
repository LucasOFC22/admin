import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { normalizeCnpjCpfData, CnpjCpfData } from '@/types/cnpjcpf';

interface ClientDocumentStore {
  selectedDocument: string | null;
  availableDocuments: string[];
  userId: string | null;
  setSelectedDocument: (doc: string) => void;
  setAvailableDocuments: (docs: string[]) => void;
  initializeFromUser: (cnpjcpfData: unknown, userId?: string) => void;
  persistSelection: (doc: string) => Promise<void>;
  reset: () => void;
}

export const useClientDocumentStore = create<ClientDocumentStore>()(
  persist(
    (set, get) => ({
      selectedDocument: null,
      availableDocuments: [],
      userId: null,
      
      setSelectedDocument: (doc) => {
        set({ selectedDocument: doc });
        // Persistir seleção no banco de dados
        get().persistSelection(doc);
      },
      
      setAvailableDocuments: (docs) => set({ availableDocuments: docs }),
      
      initializeFromUser: (cnpjcpfData, userId) => {
        const normalized = normalizeCnpjCpfData(cnpjcpfData);
        
        if (!normalized) {
          set({ availableDocuments: [], selectedDocument: null, userId: userId || null });
          return;
        }
        
        const documents = normalized.cnpjcpf;
        const savedSelection = normalized.cnpjcpf_atual;
        const current = get().selectedDocument;
        
        // Prioridade: 1) Seleção salva no banco, 2) Seleção atual válida, 3) Primeiro documento
        let selectedDoc = savedSelection;
        if (!documents.includes(savedSelection)) {
          selectedDoc = current && documents.includes(current) ? current : documents[0] || null;
        }
        
        set({ 
          availableDocuments: documents,
          selectedDocument: selectedDoc,
          userId: userId || null
        });
      },
      
      persistSelection: async (doc) => {
        const { userId, availableDocuments } = get();
        if (!userId || !doc) return;
        
        try {
          const supabase = requireAuthenticatedClient();
          const newCnpjcpfData: CnpjCpfData = {
            cnpjcpf: availableDocuments,
            cnpjcpf_atual: doc
          };
          
          await supabase
            .from('usuarios')
            .update({ cnpjcpf: newCnpjcpfData })
            .eq('id', userId);
        } catch (error) {
          console.error('Erro ao persistir seleção de documento:', error);
        }
      },
      
      reset: () => set({ selectedDocument: null, availableDocuments: [], userId: null })
    }),
    {
      name: 'client-document-store',
      partialize: (state) => ({ selectedDocument: state.selectedDocument })
    }
  )
);
