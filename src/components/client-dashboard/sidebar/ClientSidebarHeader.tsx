import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoFpTrans from '@/assets/logo-fp-trans.png';

interface ClientSidebarHeaderProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ClientSidebarHeader = ({
  sidebarOpen,
  isMobile,
  setSidebarOpen
}: ClientSidebarHeaderProps) => {
  return (
    <div className={cn(
      "h-16 flex items-center border-b border-client-sidebar-border flex-shrink-0 bg-client-sidebar",
      sidebarOpen ? "justify-between px-4" : "justify-center px-2"
    )}>
      {sidebarOpen && (
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logoFpTrans} 
            alt="FP Trans Cargas" 
            className="h-10 w-auto object-contain"
          />
        </Link>
      )}
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        className={cn(
          "text-client-sidebar-foreground/70 hover:bg-client-sidebar-accent hover:text-client-sidebar-accent-foreground transition-colors",
          !sidebarOpen && "mx-auto"
        )}
      >
        {isMobile ? (
          sidebarOpen ? <X size={20} /> : <Menu size={20} />
        ) : (
          sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />
        )}
      </Button>
    </div>
  );
};

export default ClientSidebarHeader;
