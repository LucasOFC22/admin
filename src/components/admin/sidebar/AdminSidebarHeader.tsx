
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, Menu } from 'lucide-react';
import logoFpTranscargas from '@/assets/logo-fptranscargas.png';

interface AdminSidebarHeaderProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminSidebarHeader = ({ sidebarOpen, isMobile, setSidebarOpen }: AdminSidebarHeaderProps) => {
  const handleToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogoClick = () => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
      {sidebarOpen ? (
        <div className="flex items-center justify-between w-full">
          <img 
            alt="FP Transcargas Logo" 
            className="w-48 h-16 object-contain cursor-pointer" 
            src="https://fptranscargas.com.br/imags/logo.png"
            onClick={handleLogoClick}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
            title={isMobile ? "Fechar sidebar" : "Minimizar sidebar"}
          >
            {isMobile ? <X size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            title="Expandir sidebar"
          >
            <Menu size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSidebarHeader;
