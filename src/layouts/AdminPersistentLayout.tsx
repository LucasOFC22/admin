import React, { Suspense } from 'react';
import logoFpTranscargas from '@/assets/logo-fptranscargas.png';
import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/admin/sidebar/AdminSidebar';
import AdminTopHeader from '@/components/admin/AdminTopHeader';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useSidebarSync } from '@/hooks/useSidebarSync';
import { useActiveAdminTab } from '@/hooks/useActiveAdminTab';
import { useGlobalChatNotifications } from '@/hooks/useGlobalChatNotifications';
import { useGlobalWhatsAppNotifications } from '@/hooks/useGlobalWhatsAppNotifications';
import AdminContentSkeleton from '@/components/ui/route-skeletons/AdminContentSkeleton';

const AdminPersistentLayout: React.FC = () => {
  // Escutar notificações globalmente
  useGlobalChatNotifications();
  useGlobalWhatsAppNotifications();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { isMobile } = useSidebarSync();
  const { activeTab, setActiveTab } = useActiveAdminTab();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-layout min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar - hidden when printing */}
      <div className="print:hidden">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          headerContent={
            <div className="flex items-center justify-between w-full px-3 py-4 overflow-hidden">
              {sidebarOpen ? (
                <>
                  {/* Logo - só visível quando expandido */}
                  <img 
                    alt="FP Transcargas Logo" 
                    className="h-8 object-contain cursor-pointer transition-all duration-300 ease-out"
                    src={logoFpTranscargas}
                    onClick={() => navigate('/')}
                  />
                  
                  {/* Botão minimizar - só visível quando expandido */}
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-300 ease-out flex-shrink-0"
                      title="Minimizar sidebar"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                  )}
                </>
              ) : (
                /* Estado minimizado: apenas botão expandir centralizado */
                <div className="w-full flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-300 ease-out"
                    title="Expandir sidebar"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>

      {/* Main Content Area - Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen print:h-auto">
        {/* Top Header - hidden when printing */}
        <div className="print:hidden">
          <AdminTopHeader />
        </div>
        
        {/* Page Content - scrollable with top margin for fixed header */}
        <main className="flex-1 bg-gray-50 overflow-auto pt-16 pb-safe print:pt-0 print:overflow-visible print:bg-white">
          <Suspense fallback={<AdminContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminPersistentLayout;
