import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Shield, Users, CheckSquare, Square } from 'lucide-react';
import { PermissionGroup as PermissionGroupType, PermissionAreaConfig } from '@/types/permissions';
import PermissionGroupSection from './PermissionGroupSection';

interface PermissionAreaSectionProps {
  area: PermissionAreaConfig;
  groups: PermissionGroupType[];
  selectedPermissions: Set<string>;
  onPermissionToggle: (permissionId: string) => void;
  onSelectAllArea: (areaId: string, select: boolean) => void;
  searchTerm?: string;
  defaultOpen?: boolean;
}

const PermissionAreaSection: React.FC<PermissionAreaSectionProps> = ({
  area,
  groups,
  selectedPermissions,
  onPermissionToggle,
  onSelectAllArea,
  searchTerm = '',
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Contagem de permissões da área
  const allPermissionsInArea = groups.flatMap(g => g.permissions);
  const totalCount = allPermissionsInArea.length;
  const selectedCount = allPermissionsInArea.filter(p => selectedPermissions.has(p.id)).length;
  const progress = totalCount > 0 ? (selectedCount / totalCount) * 100 : 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  // Ícone da área
  const AreaIcon = area.id === 'admin' ? Shield : Users;

  // Cores por área
  const areaColors = {
    admin: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-600',
      progress: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    cliente: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600',
      progress: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  };

  const colors = areaColors[area.id] || areaColors.admin;

  const handleSelectAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAllArea(area.id, !allSelected);
  };

  // Filtrar grupos se houver termo de busca
  const filteredGroups = searchTerm
    ? groups.filter(group => {
        const categoryMatch = group.category.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionMatch = group.permissions.some(
          p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return categoryMatch || permissionMatch;
      })
    : groups;

  if (filteredGroups.length === 0 && searchTerm) {
    return null;
  }

  return (
    <div className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={`${colors.bg} p-4 cursor-pointer hover:opacity-90 transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                  <AreaIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{area.label}</h3>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllClick}
                  className={`${colors.text} hover:${colors.bg}`}
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 mr-1" />
                  ) : someSelected ? (
                    <Square className="h-4 w-4 mr-1" />
                  ) : (
                    <Square className="h-4 w-4 mr-1" />
                  )}
                  {allSelected ? 'Desmarcar' : 'Selecionar'} Todas
                </Button>

                <div className="flex items-center gap-2 min-w-[180px]">
                  <Progress 
                    value={progress} 
                    className="h-2 flex-1 bg-gray-200"
                  />
                  <Badge variant="outline" className={colors.badge}>
                    {selectedCount}/{totalCount}
                  </Badge>
                </div>

                <Button variant="ghost" size="sm" className="ml-2">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-3 bg-background">
            {filteredGroups.map((group) => (
              <PermissionGroupSection
                key={group.category}
                group={group}
                selectedPermissions={selectedPermissions}
                onPermissionToggle={onPermissionToggle}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PermissionAreaSection;
