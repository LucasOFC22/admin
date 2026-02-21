
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { menuCategories, AdminTab } from '@/config/adminSidebarConfig';

interface AdminSidebarCollapsedProps {
  activeTab: AdminTab;
  handleCollapsedItemClick: (itemId: string, event: React.MouseEvent) => void;
  notifications?: Record<string, boolean>; // ID do item -> tem notificação não lida
}

// Itens que podem ter notificação (configurar conforme necessário)
const ITEMS_WITH_NOTIFICATIONS = ['email', 'whatsapp', 'chat-interno'];

const AdminSidebarCollapsed = ({ activeTab, handleCollapsedItemClick, notifications = {} }: AdminSidebarCollapsedProps) => {
  // Pegar todos os itens de todas as categorias para exibir no modo colapsado
  const collapsedItems = menuCategories.flatMap(category => category.items);

  // Simulação: itens que teriam notificação (substituir por lógica real)
  const hasNotification = (itemId: string) => {
    // Se tiver notificações passadas via props, usa elas
    if (Object.keys(notifications).length > 0) {
      return notifications[itemId] || false;
    }
    // Caso contrário, simula para email (remover em produção ou integrar com dados reais)
    return ITEMS_WITH_NOTIFICATIONS.includes(itemId) && itemId === 'email';
  };

  return (
    <nav className="p-2">
      <div className="space-y-1">
        {collapsedItems.map(item => (
          <div key={item.id} className="relative group/tooltip">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full h-10 justify-center p-0 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 rounded-lg relative",
                activeTab === item.id && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={(e) => handleCollapsedItemClick(item.id, e)}
              title={item.label}
            >
              <item.icon size={20} className="flex-shrink-0" />
              
              {/* Bolinha azul de notificação */}
              {hasNotification(item.id) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </Button>
            
            {/* Tooltip para modo colapsado */}
            <div 
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md pointer-events-none whitespace-nowrap z-50 shadow-md border opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200"
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default AdminSidebarCollapsed;
