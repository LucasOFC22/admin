import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, User, ArrowRightLeft } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useSidebarStore } from '@/stores/sidebarStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PanelSwitcherProps {
  collapsed?: boolean;
  variant?: 'client' | 'admin';
}

const PanelSwitcher = ({ collapsed = false, variant = 'client' }: PanelSwitcherProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasAdminAccess, hasClientAccess, signOut } = useUnifiedAuth();
  const { setSidebarOpen } = useSidebarStore();
  const [open, setOpen] = useState(false);

  const hasBothAccess = hasAdminAccess && hasClientAccess;
  
  // Detecta o painel atual pelo domínio
  const currentHostname = window.location.hostname;
  const isInAdminArea = currentHostname.includes('admin.fptranscargas.com.br');
  const isInClientArea = currentHostname.includes('clientes.fptranscargas.com.br');

  const handleSwitchPanel = (panel: 'admin' | 'client') => {
    setOpen(false);
    setSidebarOpen(false);
    if (panel === 'admin') {
      window.location.href = 'https://admin.fptranscargas.com.br';
    } else {
      window.location.href = 'https://clientes.fptranscargas.com.br';
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.nome) return user?.email?.charAt(0).toUpperCase() || 'U';
    return user.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentPanel = isInAdminArea ? 'admin' : 'client';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative flex items-center gap-2 h-auto py-2 px-2 transition-all",
            collapsed ? "w-10 justify-center" : "w-full justify-start",
            variant === 'admin' 
              ? "hover:bg-gray-100 text-gray-700" 
              : "hover:bg-client-sidebar-accent text-client-sidebar-foreground"
          )}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className={cn(
              "text-xs font-semibold",
              variant === 'admin' 
                ? "bg-primary/10 text-primary" 
                : "bg-green-100 text-green-700"
            )}>
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium truncate max-w-full">
                {user?.nome || user?.email?.split('@')[0] || 'Usuário'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isInAdminArea ? 'Painel Admin' : 'Área Cliente'}
              </span>
            </div>
          )}
          
          {hasBothAccess && !collapsed && (
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={collapsed ? "center" : "end"} 
        side={collapsed ? "right" : "top"}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.nome || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {hasBothAccess && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
              Trocar Painel
            </DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => handleSwitchPanel('admin')}
              className={cn(
                "cursor-pointer",
                currentPanel === 'admin' && "bg-primary/10 text-primary"
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Painel Administrativo</span>
              {currentPanel === 'admin' && (
                <span className="ml-auto text-xs text-muted-foreground">atual</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleSwitchPanel('client')}
              className={cn(
                "cursor-pointer",
                currentPanel === 'client' && "bg-green-50 text-green-700"
              )}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Área do Cliente</span>
              {currentPanel === 'client' && (
                <span className="ml-auto text-xs text-muted-foreground">atual</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PanelSwitcher;
