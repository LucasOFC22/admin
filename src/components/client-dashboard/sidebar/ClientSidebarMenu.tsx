import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  DollarSign, 
  Truck, 
  Package,
  MapPin,
  User,
  Lock,
  Home,
  ChevronDown,
  Plus,
  Search,
  FolderOpen
} from 'lucide-react';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ClientSidebarMenuProps {
  sidebarOpen: boolean;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  permission?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  permission?: string;
  subItems?: SubMenuItem[];
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

const ClientSidebarMenu = ({ sidebarOpen }: ClientSidebarMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canView, canCreate } = usePermissionGuard();
  const { logActivity } = useClientActivityLogger();
  const { setSidebarOpen } = useSidebarStore();
  const isMobile = useIsMobile();
  const [openItems, setOpenItems] = useState<string[]>(['coleta', 'cotacao', 'financeiro']);

  const menuCategories: MenuCategory[] = [
    {
      id: 'inicio',
      label: 'Início',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/area-cliente/dashboard',
          permission: 'clientes.dashboard.visualizar'
        }
      ]
    },
    {
      id: 'operacoes',
      label: 'Operações',
      items: [
        {
          id: 'coleta',
          label: 'Coleta',
          icon: Truck,
          subItems: [
            {
              id: 'criar-coleta',
              label: 'Criar',
              icon: Plus,
              path: '/area-cliente/solicitar-coleta',
              permission: 'clientes.coletas.criar'
            },
            {
              id: 'consultar-coletas',
              label: 'Consultar',
              icon: Search,
              path: '/area-cliente/minhas-coletas',
              permission: 'clientes.coletas.visualizar'
            }
          ]
        },
        {
          id: 'cotacao',
          label: 'Cotação',
          icon: Package,
          subItems: [
            {
              id: 'criar-cotacao',
              label: 'Criar',
              icon: Plus,
              path: '/area-cliente/solicitar-cotacao',
              permission: 'clientes.cotacoes.criar'
            },
            {
              id: 'consultar-cotacoes',
              label: 'Consultar',
              icon: Search,
              path: '/area-cliente/minhas-cotacoes',
              permission: 'clientes.cotacoes.visualizar'
            }
          ]
        }
      ]
    },
    {
      id: 'acompanhamentos',
      label: 'Acompanhamentos',
      items: [
        {
          id: 'conhecimentos',
          label: 'Conhecimentos',
          icon: FileText,
          path: '/area-cliente/conhecimentos',
          permission: 'clientes.conhecimentos.visualizar'
        },
        {
          id: 'financeiro',
          label: 'Financeiro',
          icon: DollarSign,
          subItems: [
            {
              id: 'financeiro-dashboard',
              label: 'Dashboard',
              icon: Home,
              path: '/area-cliente/financeiro/dashboard',
              permission: 'clientes.financeiro.visualizar'
            },
            {
              id: 'financeiro-em-aberto',
              label: 'Em Aberto',
              icon: DollarSign,
              path: '/area-cliente/financeiro/em-aberto',
              permission: 'clientes.financeiro.visualizar'
            },
            {
              id: 'financeiro-consultar',
              label: 'Consultar',
              icon: Search,
              path: '/area-cliente/financeiro/consultar',
              permission: 'clientes.financeiro.visualizar'
            }
          ]
        },
        {
          id: 'rastrear',
          label: 'Rastrear',
          icon: MapPin,
          path: '/area-cliente/rastrear'
        },
        {
          id: 'documentos',
          label: 'Documentos',
          icon: FolderOpen,
          path: '/area-cliente/documentos',
          permission: 'clientes.documentos.visualizar'
        }
      ]
    },
    {
      id: 'cadastro',
      label: 'Minha Conta',
      items: [
        {
          id: 'ficha-cnpj',
          label: 'Ficha CNPJ',
          icon: User,
          path: '/area-cliente/ficha-cnpj',
          permission: 'clientes.perfil.visualizar'
        },
        {
          id: 'alterar-senha',
          label: 'Alterar Senha',
          icon: Lock,
          path: '/area-cliente/alterar-senha',
          permission: 'clientes.perfil.editar'
        }
      ]
    }
  ];

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (path: string, label: string) => {
    logActivity({
      acao: 'cliente_menu_item_click',
      modulo: 'cliente-navegacao',
      detalhes: { item: label, rota: path }
    });
    navigate(path);
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const checkPermission = (permission?: string) => {
    if (!permission) return true;
    return canView(permission);
  };

  const filterSubItems = (subItems: SubMenuItem[]) => {
    return subItems.filter(item => checkPermission(item.permission));
  };

  const isPathActive = (path: string) => location.pathname === path;
  
  const hasActiveSubItem = (subItems?: SubMenuItem[]) => {
    return subItems?.some(item => isPathActive(item.path)) ?? false;
  };

  // Collapsed mode - just icons with scroll
  if (!sidebarOpen) {
    const allItems = menuCategories.flatMap(cat => cat.items);
    
    return (
      <ScrollArea className="h-full">
        <nav className="p-2">
          <div className="space-y-1">
            {allItems.map(item => {
              if (!item.path && !item.subItems?.length) return null;
              if (item.permission && !checkPermission(item.permission)) return null;
              
              const Icon = item.icon;
              const isActive = item.path ? isPathActive(item.path) : hasActiveSubItem(item.subItems);
              
              return (
                <div key={item.id} className="relative group/tooltip">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-center px-2 py-3 text-client-sidebar-foreground/70 hover:bg-client-sidebar-accent hover:text-client-sidebar-accent-foreground transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => {
                      if (item.path) {
                        handleItemClick(item.path, item.label);
                      } else if (item.subItems?.length) {
                        const firstAllowed = filterSubItems(item.subItems)[0];
                        if (firstAllowed) {
                          handleItemClick(firstAllowed.path, firstAllowed.label);
                        }
                      }
                    }}
                    title={item.label}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                  </Button>
                  
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded pointer-events-none whitespace-nowrap z-50 shadow-lg border opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </ScrollArea>
    );
  }

  // Expanded mode with collapsible groups
  return (
    <nav className="p-3">
      <div className="space-y-6">
        {menuCategories.map(category => {
          const visibleItems = category.items.filter(item => {
            if (item.subItems) {
              return filterSubItems(item.subItems).length > 0;
            }
            return checkPermission(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={category.id}>
              <div className="px-3 py-2">
                <span className="text-[10px] font-bold text-client-sidebar-muted uppercase tracking-widest">
                  {category.label}
                </span>
              </div>
              <div className="space-y-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  
                  // Item with sub-items (collapsible)
                  if (item.subItems && item.subItems.length > 0) {
                    const filteredSubItems = filterSubItems(item.subItems);
                    const isOpen = openItems.includes(item.id);
                    const hasActive = hasActiveSubItem(filteredSubItems);
                    
                    return (
                      <Collapsible
                        key={item.id}
                        open={isOpen}
                        onOpenChange={() => toggleItem(item.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between px-3 py-2.5 h-auto transition-all duration-200",
                              "text-client-sidebar-foreground/80 hover:bg-client-sidebar-accent hover:text-client-sidebar-accent-foreground",
                              hasActive && "bg-primary/10 text-primary border border-primary/30",
                              isOpen && !hasActive && "bg-client-sidebar-accent/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className="flex-shrink-0" />
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <ChevronDown 
                              size={16} 
                              className={cn(
                                "transition-transform duration-200",
                                isOpen && "rotate-180"
                              )}
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 mt-1 space-y-1">
                          {filteredSubItems.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubActive = isPathActive(subItem.path);
                            
                            return (
                              <Button
                                key={subItem.id}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start px-3 py-2 h-auto transition-all duration-200",
                                  "text-client-sidebar-foreground/70 hover:bg-client-sidebar-accent hover:text-client-sidebar-accent-foreground",
                                  isSubActive && "bg-primary text-primary-foreground shadow-sm"
                                )}
                                onClick={() => handleItemClick(subItem.path, subItem.label)}
                              >
                                <SubIcon size={14} className="flex-shrink-0" />
                                <span className="ml-2 text-sm">{subItem.label}</span>
                              </Button>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }
                  
                  // Regular item (no sub-items)
                  const isActive = item.path ? isPathActive(item.path) : false;
                  
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-3 py-2.5 h-auto transition-all duration-200",
                        "text-client-sidebar-foreground/80 hover:bg-client-sidebar-accent hover:text-client-sidebar-accent-foreground",
                        isActive && "bg-primary text-primary-foreground shadow-sm"
                      )}
                      onClick={() => item.path && handleItemClick(item.path, item.label)}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default ClientSidebarMenu;
