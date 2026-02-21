import React, { useState, useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { User, Search, Settings, LogOut, Menu, Volume2, VolumeX } from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from '@/lib/toast';
import { useSoundNotification } from '@/contexts/SoundNotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AdminTopHeader = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthState();
  const { sidebarOpen, setSidebarOpen, isMobile, isInitialized } = useSidebarStore();
  // REMOVIDO: useSidebarSync() duplicado - já é chamado no AdminPersistentLayout
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, toggleSound, isLoading: isSoundLoading } = useSoundNotification();

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Ocorreu um erro ao fazer logout');
    }
  };

  const handleToggleSound = async () => {
    await toggleSound();
    toast.info(soundEnabled ? 'Som desativado' : 'Som ativado');
  };


  const headerLeftPosition = isMobile ? 
    'left-0' : 
    (sidebarOpen ? 'left-56' : 'left-16');
  const allowTransitions = mounted && isInitialized;

  return (
    <header className={`bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0 fixed top-0 right-0 z-40 ${allowTransitions ? 'transition-all duration-300' : ''} ${headerLeftPosition}`}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Search Bar */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleToggleSound}
                disabled={isSoundLoading}
                className="relative"
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-gray-600" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{soundEnabled ? 'Desativar som' : 'Ativar som'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>


        {/* Notifications */}
        <NotificationBell />
        
        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => navigate('/configuracoes')}>
          <Settings className="h-5 w-5 text-gray-600" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-50">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.nome || 'Admin'}
                </div>
                <div className="text-xs text-gray-500">Administrador</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminTopHeader;
