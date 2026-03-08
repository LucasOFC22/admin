import { useState, useMemo, useEffect } from 'react';
import logoFpTranscargas from '@/assets/logo-fptranscargas.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, FileText, Truck, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from '@/hooks/use-toast';
import { formatCnpjCpf } from '@/lib/utils';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';
import { useClientDocumentStore } from '@/stores/clientDocumentStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ClientHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useUnifiedAuth();
  const { canView } = usePermissionGuard();
  const { logActivity } = useClientActivityLogger();
  const { selectedDocument } = useClientDocumentStore();

  const handleLogout = async () => {
    try {
      await logActivity({
        acao: 'cliente_logout',
        modulo: 'cliente-auth',
        detalhes: { usuario_id: user?.id }
      });
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o logout.",
        variant: "destructive",
      });
    }
  };

  const allNavigationItems = [
    { to: '/area-cliente/dashboard', label: 'Dashboard', icon: Package, permission: 'clientes.dashboard.visualizar' },
    { to: '/area-cliente/minhas-cotacoes', label: 'Minhas Cotações', icon: FileText, permission: 'clientes.cotacoes.visualizar' },
    { to: '/area-cliente/minhas-coletas', label: 'Minhas Coletas', icon: Truck, permission: 'clientes.coletas.visualizar' },
  ];

  // Filtrar itens de navegação baseado nas permissões
  const navigationItems = useMemo(() => 
    allNavigationItems.filter(item => canView(item.permission)),
    [canView]
  );

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity duration-200"
            onClick={() => navigate('/')}
          >
            <img 
              src="https://fptranscargas.com.br/imags/logo.png" 
              alt="FP Trans Cargas" 
              className="h-10 w-auto min-w-[140px]"
              style={{ flexShrink: 0 }}
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs text-muted-foreground">Portal</span>
              <span className="text-sm font-bold text-primary">Área do Cliente</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.to);
              
              return (
                <Button
                  key={item.to}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`gap-2 transition-all duration-200 ${
                    isActive 
                      ? 'shadow-sm' 
                      : 'hover:bg-primary/10'
                  }`}
                  onClick={() => {
                    logActivity({
                      acao: 'cliente_menu_item_click',
                      modulo: 'cliente-navegacao',
                      detalhes: { item: item.label, rota: item.to }
                    });
                    navigate(item.to);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 hover:bg-primary/10 transition-colors duration-200 border-gray-300"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {(user?.nome?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user?.nome || user?.email?.split('@')[0] || 'Usuário'}
                    </span>
                    {selectedDocument && (
                      <span className="text-xs text-muted-foreground">
                        {formatCnpjCpf(selectedDocument)}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-semibold">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground break-all">{user?.email}</p>
                  </div>
                  {selectedDocument && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">CNPJ/CPF:</span>
                      <p className="font-medium text-foreground">{formatCnpjCpf(selectedDocument)}</p>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="text-destructive cursor-pointer hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                logActivity({
                  acao: 'cliente_menu_abrir',
                  modulo: 'cliente-navegacao',
                  detalhes: { tipo: 'mobile' }
                });
              }
            }}
            className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200 text-primary"
            aria-label="Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white animate-fade-in">
            <nav className="flex flex-col gap-2 px-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.to);
                
                return (
                  <Button
                    key={item.to}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`justify-start gap-3 w-full h-12 ${
                      isActive ? 'shadow-sm' : 'hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      navigate(item.to);
                      setIsOpen(false);
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 px-2">
              <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold">
                  {(user?.nome?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">
                    {user?.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                  {selectedDocument && (
                    <p className="text-xs text-muted-foreground truncate">
                      {formatCnpjCpf(selectedDocument)}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                variant="destructive"
                className="w-full gap-2 h-11"
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ClientHeader;
