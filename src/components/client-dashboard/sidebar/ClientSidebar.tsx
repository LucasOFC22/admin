import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useSidebarSync } from '@/hooks/useSidebarSync';
import ClientSidebarHeader from './ClientSidebarHeader';
import ClientSidebarMenu from './ClientSidebarMenu';
import PanelSwitcher from '@/components/sidebar/PanelSwitcher';
const ClientSidebar = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    isMobile
  } = useSidebarStore();
  // OTIMIZAÇÃO: useSidebarSync só aqui (layout cliente não tem outro ponto centralizado)
  useSidebarSync();
  const mobileVisible = isMobile && sidebarOpen;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return null;
  }
  return <>
      {/* Overlay para mobile */}
      <AnimatePresence>
        {mobileVisible && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden" onClick={() => setSidebarOpen(false)} />}
      </AnimatePresence>

      {/* Sidebar - Light theme for client */}
      <aside className={cn("sidebar-container flex-shrink-0", "bg-client-sidebar border-r border-client-sidebar-border transition-all duration-300 ease-in-out flex flex-col", "shadow-lg overflow-hidden", isMobile ? "fixed left-0 top-0 h-screen z-[110]" : "sticky top-0 h-screen z-30", isMobile ? mobileVisible ? "translate-x-0 w-72" : "-translate-x-full w-72" : sidebarOpen ? "w-60" : "w-16")} style={{
      willChange: 'transform, width'
    }}>
        {/* Header da sidebar */}
        <ClientSidebarHeader sidebarOpen={sidebarOpen} isMobile={isMobile} setSidebarOpen={setSidebarOpen} />

        {/* Content da sidebar */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-full">
            <div className="py-2">
              <ClientSidebarMenu sidebarOpen={sidebarOpen} />
            </div>
          </ScrollArea>
        </div>

        {/* Panel Switcher - Antes do Footer */}
        <div className={cn("border-t border-client-sidebar-border flex-shrink-0", sidebarOpen ? "p-3" : "p-2")}>
          <PanelSwitcher collapsed={!sidebarOpen} variant="client" />
        </div>

        {/* Footer */}
        {sidebarOpen && <div className="p-4 border-t border-client-sidebar-border flex-shrink-0">
            <p className="text-[10px] text-client-sidebar-muted text-center">© 2026 FP Trans Cargas</p>
          </div>}
      </aside>
    </>;
};
export default ClientSidebar;