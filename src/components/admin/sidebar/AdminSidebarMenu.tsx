import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { menuCategories, AdminTab } from '@/config/adminSidebarConfig';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { useUserEmailAccess } from '@/hooks/useUserEmailAccess';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarMenuProps {
  activeTab: AdminTab;
  expandedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  handleItemClick: (itemId: string) => void;
}

const AdminSidebarMenu = ({ 
  activeTab, 
  expandedCategories, 
  toggleCategory, 
  handleItemClick 
}: AdminSidebarMenuProps) => {
  const { isLoadingCargoPermissions, canAccessPage } = usePermissionGuard();
  const { hasAccess: hasEmailAccess, loading: loadingEmailAccess } = useUserEmailAccess();
  
  const tabPermissionMapping = databasePermissionsService.getSidebarTabPermissionMapping();
  
  const filterItemsByPermissions = (items: any[]) => {
    return items.filter(item => {
      // Verificar permissão de email baseada em contas vinculadas
      if (item.id === 'email') {
        return hasEmailAccess;
      }
      
      const requiredPermission = tabPermissionMapping[item.id];
      if (!requiredPermission) return true;
      return canAccessPage(item.id);
    });
  };

  const filterCategoriesByPermissions = (categories: any[]) => {
    return categories.map(category => ({
      ...category,
      items: filterItemsByPermissions(category.items)
    })).filter(category => category.items.length > 0);
  };

  if (isLoadingCargoPermissions || loadingEmailAccess) {
    return (
      <nav className="py-2">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </nav>
    );
  }

  const filteredCategories = filterCategoriesByPermissions(menuCategories);

  return (
    <nav className="py-1">
      <div className="space-y-1">
        {filteredCategories.map(category => (
          <Collapsible 
            key={category.id}
            open={expandedCategories.includes(category.id)} 
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <button 
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{category.label}</span>
                <ChevronRight 
                  size={12} 
                  className={cn(
                    "transition-transform duration-200",
                    expandedCategories.includes(category.id) && "rotate-90"
                  )} 
                />
              </button>
            </CollapsibleTrigger>
            <AnimatePresence initial={false}>
              {expandedCategories.includes(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pb-2">
                    {category.items.map((item, index) => (
                      <motion.button 
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.15 }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-all",
                          activeTab === item.id 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <item.icon size={16} className="flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible>
        ))}
      </div>
    </nav>
  );
};

export default AdminSidebarMenu;
