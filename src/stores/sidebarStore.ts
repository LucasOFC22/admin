import { create } from 'zustand';

interface SidebarStore {
  sidebarOpen: boolean;
  isMobile: boolean;
  categoriasExpandidas: string[];
  isInitialized: boolean;
  
  // Setters
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsMobile: (isMobile: boolean) => void;
  setCategoriasExpandidas: (categorias: string[]) => void;
  toggleCategoria: (categoriaId: string) => void;
  
  // Inicialização com dados do Supabase
  initFromSupabase: (data: {
    sidebarExpandido: boolean;
    categoriasExpandidas: string[];
  }) => void;
  
  // Reset para mobile
  resetForMobile: () => void;
}

const DEFAULT_CATEGORIAS = [
  'principal',
  'operacional',
  'comunicacao',
  'clientes',
  'financeiro',
  'gestao',
  'automacao',
  'monitoramento',
  'logs-modulos'
];

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  sidebarOpen: true,
  isMobile: false,
  categoriasExpandidas: DEFAULT_CATEGORIAS,
  isInitialized: true, // Iniciar como true para evitar bloqueio de renderização

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),

  setIsMobile: (isMobile: boolean) => {
    set({ isMobile, isInitialized: true });
  },

  setCategoriasExpandidas: (categorias: string[]) => {
    set({ categoriasExpandidas: categorias });
  },

  toggleCategoria: (categoriaId: string) => {
    const state = get();
    const novasCategorias = state.categoriasExpandidas.includes(categoriaId)
      ? state.categoriasExpandidas.filter(c => c !== categoriaId)
      : [...state.categoriasExpandidas, categoriaId];
    set({ categoriasExpandidas: novasCategorias });
  },

  initFromSupabase: (data) => {
    const state = get();
    // No mobile: preservar o estado atual do sidebarOpen (não sobrescrever)
    // No desktop: aplicar preferência salva
    // Sempre sincronizar categorias expandidas
    set({
      sidebarOpen: state.isMobile ? state.sidebarOpen : data.sidebarExpandido,
      categoriasExpandidas: data.categoriasExpandidas,
      isInitialized: true
    });
  },

  resetForMobile: () => {
    set({ sidebarOpen: false });
  }
}));
