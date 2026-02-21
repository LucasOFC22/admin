import React, { useState, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PermissionGroup as PermissionGroupType } from '@/types/permissions';
import { Icon } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Mapeamento de ícones usando importação dinâmica
import * as LucideIcons from 'lucide-react';

interface PermissionGroupSectionProps {
  group: PermissionGroupType;
  selectedPermissions: Set<string>;
  onPermissionToggle: (permissionId: string) => void;
  searchTerm?: string;
  defaultOpen?: boolean;
}

const PermissionGroupSection: React.FC<PermissionGroupSectionProps> = ({
  group,
  selectedPermissions,
  onPermissionToggle,
  searchTerm = '',
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Filtrar permissões se houver termo de busca
  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return group.permissions;
    return group.permissions.filter(
      p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [group.permissions, searchTerm]);

  // Contagem de permissões selecionadas
  const selectedCount = filteredPermissions.filter(p => selectedPermissions.has(p.id)).length;
  const totalCount = filteredPermissions.length;

  // Obter o componente de ícone
  const IconComponent = (LucideIcons as any)[group.icon] || LucideIcons.HelpCircle;

  // Se não houver permissões após filtro, não renderizar
  if (filteredPermissions.length === 0 && searchTerm) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="font-medium text-sm">{group.category}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {group.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedCount}/{totalCount}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-1 border-t pt-2">
            {filteredPermissions.map((permission) => {
              const isSelected = selectedPermissions.has(permission.id);
              const isCritical = permission.critical;

              return (
                <div
                  key={permission.id}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                    isCritical ? 'border-l-2 border-l-amber-500 pl-3' : ''
                  }`}
                  onClick={() => onPermissionToggle(permission.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onPermissionToggle(permission.id)}
                    className="cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{permission.name}</span>
                      {isCritical && (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block truncate">
                      {permission.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PermissionGroupSection;
