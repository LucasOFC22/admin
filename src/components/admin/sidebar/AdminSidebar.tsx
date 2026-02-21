import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAdminSidebarNavigation } from '@/hooks/useAdminSidebarNavigation';
import { useSidebarPreferencias } from '@/hooks/useSidebarPreferencias';
import { AdminTab } from '@/config/adminSidebarConfig';
import AdminSidebarHeader from './AdminSidebarHeader';
import AdminSidebarMenu from './AdminSidebarMenu';
import AdminSidebarCollapsed from './AdminSidebarCollapsed';
import PanelSwitcher from '@/components/sidebar/PanelSwitcher';
import SidebarSkeleton from '@/components/ui/route-skeletons/SidebarSkeleton';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  headerContent?: React.ReactNode;
}

const AdminSidebar = ({ activeTab, setActiveTab, headerContent }: AdminSidebarProps) => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    isMobile, 
    isInitialized,
    categoriasExpandidas,
    toggleCategoria,
    initFromSupabase
  } = useSidebarStore();
  
  // REMOVIDO: useSidebarSync() duplicado - já é chamado no AdminPersistentLayout
  
  const { 
    preferencias, 
    loading: loadingPreferencias,
    toggleSidebar: toggleSidebarSupabase,
    atualizarCategorias
  } = useSidebarPreferencias();
  
  const { handleItemClick: handleNavigation } = useAdminSidebarNavigation();
  const mobileVisible = isMobile && sidebarOpen;
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => setMounted(true), []);
  
  // Inicializar com dados do Supabase
  useEffect(() => {
    if (preferencias && !loadingPreferencias) {
      initFromSupabase({
        sidebarExpandido: preferencias.sidebar_expandido,
        categoriasExpandidas: preferencias.categorias_expandidas
      });
    }
  }, [preferencias, loadingPreferencias, initFromSupabase]);
  
  const handleToggleCategory = (categoryId: string) => {
    toggleCategoria(categoryId);
    // Atualizar no Supabase
    const novasCategorias = categoriasExpandidas.includes(categoryId)
      ? categoriasExpandidas.filter(c => c !== categoryId)
      : [...categoriasExpandidas, categoryId];
    atualizarCategorias(novasCategorias);
  };
  
  const handleItemClick = (itemId: string) => {
    handleNavigation(itemId, setActiveTab, isMobile, setSidebarOpen);
  };

  const handleCollapsedItemClick = (itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleItemClick(itemId);
  };
  
  // Sincronizar toggle do sidebar com Supabase (apenas desktop)
  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    if (!isMobile) {
      toggleSidebarSupabase(open);
    }
  };

  // OTIMIZAÇÃO: Mostrar skeleton ao invés de null para evitar flash
  if (!mounted || !isInitialized) {
    return <SidebarSkeleton expanded={sidebarOpen} isMobile={isMobile} />;
  }

  return (
    <>
      {/* Overlay para mobile */}
      <AnimatePresence>
        {mobileVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar unificada com CSS responsivo */}
      <div
        className={cn(
          "sidebar-container",
          "bg-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          // Mobile: comportamento overlay (fixed)
          isMobile ? (
            "fixed left-0 top-0 h-screen z-[110]"
          ) : (
            "relative h-screen z-30"
          ),
          // Estados baseados em breakpoint e sidebarOpen - largura ajustada
          isMobile ? (
            mobileVisible ? "translate-x-0 w-80" : "-translate-x-full w-80"
          ) : (
            sidebarOpen ? "w-56" : "w-16"
          )
        )}
        style={{ willChange: 'transform, width' }}
      >
        {/* Header da sidebar */}
        {headerContent ? (
          <div className="h-16 flex items-center border-b border-gray-200 flex-shrink-0 bg-white/95 backdrop-blur-sm">
            {headerContent}
          </div>
        ) : (
          <AdminSidebarHeader 
            sidebarOpen={sidebarOpen} 
            isMobile={isMobile} 
            setSidebarOpen={handleToggleSidebar} 
          />
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/60"
          >
            <div className="px-1 py-2">
              {sidebarOpen ? (
                <AdminSidebarMenu
                  activeTab={activeTab}
                  expandedCategories={categoriasExpandidas}
                  toggleCategory={handleToggleCategory}
                  handleItemClick={handleItemClick}
                />
              ) : (
                <AdminSidebarCollapsed
                  activeTab={activeTab}
                  handleCollapsedItemClick={handleCollapsedItemClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Panel Switcher */}
        <div className={cn(
          "border-t border-gray-200 flex-shrink-0",
          sidebarOpen ? "p-3" : "p-2"
        )}>
          <PanelSwitcher collapsed={!sidebarOpen} variant="admin" />
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
