import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';
import { SidebarProvider } from '@/components/ui/sidebar';
import ClientSidebar from '@/components/client-dashboard/sidebar/ClientSidebar';
import { Menu, LogOut, ChevronDown, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logoFpTrans from '@/assets/logo-fp-trans.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCnpjCpf } from '@/lib/utils';
import { useClientDocumentStore } from '@/stores/clientDocumentStore';
interface DashboardLayoutProps {
  children: ReactNode;
}
const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    logActivity
  } = useClientActivityLogger();
  const {
    setSidebarOpen
  } = useSidebarStore();
  const {
    user,
    signOut
  } = useUnifiedAuth();
  const {
    selectedDocument,
    availableDocuments,
    setSelectedDocument,
    initializeFromUser
  } = useClientDocumentStore();

  // Inicializar store com documentos do usuário
  useEffect(() => {
    if (user?.cnpjcpf) {
      initializeFromUser(user.cnpjcpf, user.id);
    }
  }, [user?.cnpjcpf, user?.id, initializeFromUser]);
  useEffect(() => {
    // ✅ FIX: Debounce para evitar logs excessivos
    const timeoutId = setTimeout(() => {
      logActivity({
        acao: 'cliente_navegacao',
        modulo: 'cliente-navegacao',
        detalhes: {
          rota: location.pathname
        }
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, logActivity]);
  const handleLogout = async () => {
    try {
      await logActivity({
        acao: 'cliente_logout',
        modulo: 'cliente-auth',
        detalhes: {
          usuario_id: user?.id
        }
      });
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta."
      });
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o logout.",
        variant: "destructive"
      });
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen w-full flex overflow-hidden">
        <ClientSidebar />
        
        <div className="flex-1 flex flex-col h-screen min-w-0">
          {/* Header superior - fixed */}
          <header className="h-14 sm:h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 lg:px-6 z-40 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden h-9 w-9 shrink-0">
                <Menu size={20} />
              </Button>
              
              {/* Mobile: Logo pequena */}
              <div className="flex md:hidden items-center gap-2 min-w-0">
                <img src={logoFpTrans} alt="FP Trans" className="h-7 w-auto object-contain shrink-0" />
                {availableDocuments.length > 1 && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 px-2 h-8 text-xs">
                        <Building2 className="h-3.5 w-3.5" />
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel className="text-xs">Selecionar CNPJ/CPF</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableDocuments.map(doc => <DropdownMenuItem key={doc} onClick={() => {
                    setSelectedDocument(doc);
                    logActivity({
                      acao: 'cliente_trocar_documento',
                      modulo: 'cliente-auth',
                      detalhes: {
                        documento: doc
                      }
                    });
                    toast({
                      title: "Documento alterado",
                      description: `Visualizando dados de ${formatCnpjCpf(doc)}`
                    });
                  }} className="gap-2 cursor-pointer text-sm">
                          <span className="font-mono text-xs">{formatCnpjCpf(doc)}</span>
                          {selectedDocument === doc && <Check className="h-4 w-4 ml-auto text-primary" />}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>}
              </div>
              
              {/* Desktop: Logo + título + seletor */}
              <div className="hidden md:flex items-center gap-3">
                
                
                <span className="text-sm font-medium text-muted-foreground">Área do Cliente</span>
                
                {/* Seletor de CNPJ/CPF */}
                {availableDocuments.length > 1 && <>
                    <div className="h-6 w-px bg-border" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="font-mono text-xs">
                            {selectedDocument ? formatCnpjCpf(selectedDocument) : 'Selecionar'}
                          </span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Selecionar CNPJ/CPF</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableDocuments.map(doc => <DropdownMenuItem key={doc} onClick={() => {
                      setSelectedDocument(doc);
                      logActivity({
                        acao: 'cliente_trocar_documento',
                        modulo: 'cliente-auth',
                        detalhes: {
                          documento: doc
                        }
                      });
                      toast({
                        title: "Documento alterado",
                        description: `Visualizando dados de ${formatCnpjCpf(doc)}`
                      });
                    }} className="gap-2 cursor-pointer">
                            <span className="font-mono text-sm">{formatCnpjCpf(doc)}</span>
                            {selectedDocument === doc && <Check className="h-4 w-4 ml-auto text-primary" />}
                          </DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>}
              </div>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 hover:bg-primary/10 transition-colors duration-200 px-2 sm:px-3 h-9 sm:h-10 shrink-0">
                  <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                    {(user?.nome?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start max-w-[120px] lg:max-w-none">
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {user?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
                    </span>
                    {selectedDocument && <span className="text-[10px] sm:text-xs text-muted-foreground hidden lg:block">
                        {formatCnpjCpf(selectedDocument)}
                      </span>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-semibold">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground break-all text-xs">{user?.email}</p>
                  </div>
                  {selectedDocument && <div className="text-sm">
                      <span className="text-muted-foreground">CNPJ/CPF Ativo:</span>
                      <p className="font-medium text-foreground text-xs">{formatCnpjCpf(selectedDocument)}</p>
                    </div>}
                  {availableDocuments.length > 1 && <div className="text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-medium text-foreground">{availableDocuments.length} documentos</p>
                    </div>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main content - scrollable */}
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50/20 to-background overflow-auto">
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default DashboardLayout;