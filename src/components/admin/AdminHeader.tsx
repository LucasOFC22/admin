
import { User, Settings, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GlobalSearch from './GlobalSearch';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { signOut } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const AdminHeader = ({ sidebarOpen, setSidebarOpen, onNavigate }: AdminHeaderProps) => {
  const isMobile = useIsMobile();
  const { getDisplayName, getUserRole } = useUserProfile();
  const navigate = useNavigate();

  const handleSearchNavigate = (type: 'quotes' | 'contacts' | 'chat', id?: string) => {
    if (onNavigate) {
      onNavigate(type, id);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const displayName = getDisplayName();
  const userRole = getUserRole();
  const initials = displayName.split(' ').map(name => name.charAt(0)).join('').substring(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 w-full sticky top-0 z-[400]">
      <div className="h-full px-4 sm:px-8 flex items-center justify-between w-full relative z-[400]">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden relative z-[410]"
            >
              <Menu size={20} />
            </Button>
          )}
          
          {/* Global Search - Responsivo */}
          <div className="hidden sm:block">
            <GlobalSearch onNavigate={handleSearchNavigate} />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button - só aparece em mobile */}
          {isMobile && (
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 sm:hidden relative z-[410]">
              <Settings size={18} className="text-gray-600" />
            </Button>
          )}

          {/* Settings - hidden on mobile */}
          {!isMobile && (
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 relative z-[410]">
              <Settings size={20} className="text-gray-600" />
            </Button>
          )}

          {/* User Menu - Responsivo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 px-2 sm:px-3 relative z-[410]">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56 bg-white border shadow-lg z-[450]">
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-50">
                <User size={16} />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-50">
                <Settings size={16} />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <User size={16} />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
