import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSidebar from './sidebar/AdminSidebar';
import AdminTopHeader from './AdminTopHeader';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useSidebarSync } from '@/hooks/useSidebarSync';
import { AdminTab } from '@/config/adminSidebarConfig';


interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { isMobile } = useSidebarSync();
  

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
          <div className="flex items-center justify-between w-full px-3 py-4">
            {/* Logo sempre visível */}
            <div className={`flex items-center justify-center ${sidebarOpen ? 'flex-1' : 'w-full'}`}>
              <img 
                alt="FP Transcargas Logo" 
                className={`object-contain cursor-pointer transition-all duration-300 ${sidebarOpen ? 'h-8' : 'h-6 w-8'}`}
                src="https://fptranscargas.com.br/imags/logo.png"
                onClick={() => sidebarOpen ? navigate('/') : toggleSidebar()}
                title={sidebarOpen ? undefined : "Expandir sidebar"}
              />
            </div>
            
            {/* Botão de minimizar - só aparece quando expandido */}
            {sidebarOpen && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
                title="Minimizar sidebar"
              >
                <ChevronLeft size={14} />
              </Button>
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
