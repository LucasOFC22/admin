import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronRight, 
  Shield, 
  Users, 
  FileText, 
  MessageCircle, 
  BarChart3, 
  Square, 
  Webhook, 
  Search,
  Package,
  Building2,
  Settings,
  Activity,
  UserCheck,
  Receipt,
  Truck,
  AlertTriangle,
  Database,
  FileCheck,
  CheckSquare,
  Mail,
  Network,
  MessageSquare,
  StickyNote,
  HelpCircle,
  KeyRound,
  MailOpen,
  GitBranch,
  Briefcase,
  Contact,
  FileWarning,
  AlertCircle,
  Workflow
} from 'lucide-react';
import { databasePermissionsService } from '@/services/databasePermissionsService';
import { PermissionGroup } from '@/types/permissions';
import { PERMISSION_AREAS, getGroupArea } from '@/config/permissionAreas';

interface AdvancedPermissionSelectorProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  disabled?: boolean;
  showCriticalWarnings?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Shield,
  Users,
  FileText,
  MessageCircle,
  BarChart3,
  Square,
  Webhook,
  Package,
  Building2,
  Settings,
  Activity,
  UserCheck,
  Receipt,
  Truck,
  AlertTriangle,
  Database,
  FileCheck,
  Mail,
  Network,
  MessageSquare,
  StickyNote,
  HelpCircle,
  KeyRound,
  MailOpen,
  GitBranch,
  Briefcase,
  Contact,
  FileWarning,
  AlertCircle,
  Workflow
};

const AdvancedPermissionSelector: React.FC<AdvancedPermissionSelectorProps> = memo(({
  selectedPermissions,
  onPermissionsChange,
  disabled = false,
  showCriticalWarnings = true
}) => {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set(['admin']));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const hasInitialized = useRef(false);

  // Carregar grupos apenas uma vez com cache
  useEffect(() => {
    let mounted = true;
    
    const loadGroups = async () => {
      const groups = await databasePermissionsService.getPermissionGroups();
      if (mounted) {
        setPermissionGroups(groups);
      }
    };

    loadGroups();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Separar grupos por área
  const { adminGroups, clienteGroups } = useMemo(() => {
    const admin: PermissionGroup[] = [];
    const cliente: PermissionGroup[] = [];

    permissionGroups.forEach(group => {
      const area = getGroupArea(group.category, group.permissions);
      if (area === 'cliente') {
        cliente.push(group);
      } else {
        admin.push(group);
      }
    });

    return { adminGroups: admin, clienteGroups: cliente };
  }, [permissionGroups]);

  // Filtro de busca por área
  const filteredAdminGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminGroups
      .map(g => ({
        ...g,
        permissions: g.permissions.filter(p => {
          if (!q) return true;
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false) ||
            p.id.toLowerCase().includes(q)
          );
        })
      }))
      .filter(g => g.permissions.length > 0);
  }, [adminGroups, query]);

  const filteredClienteGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clienteGroups
      .map(g => ({
        ...g,
        permissions: g.permissions.filter(p => {
          if (!q) return true;
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false) ||
            p.id.toLowerCase().includes(q)
          );
        })
      }))
      .filter(g => g.permissions.length > 0);
  }, [clienteGroups, query]);

  // Toggle de área (expandir/colapsar)
  const toggleArea = useCallback((areaId: string) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) {
        newSet.delete(areaId);
      } else {
        newSet.add(areaId);
      }
      return newSet;
    });
  }, []);

  // Toggle de grupo
  const toggleGroup = useCallback((category: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handlePermissionToggle = useCallback((permissionId: string, checked: boolean) => {
    let newPermissions = [...selectedPermissions];
    
    if (checked) {
      if (!newPermissions.includes(permissionId)) {
        newPermissions.push(permissionId);
      }
    } else {
      newPermissions = newPermissions.filter(p => p !== permissionId);
    }
    
    onPermissionsChange(newPermissions);
  }, [selectedPermissions, onPermissionsChange]);

  const handleSelectAllInGroup = useCallback((group: PermissionGroup) => {
    const groupPermissionIds = group.permissions.map(p => p.id);
    const allSelected = groupPermissionIds.every(id => selectedPermissions.includes(id));
    
    let newPermissions = [...selectedPermissions];
    
    if (allSelected) {
      newPermissions = newPermissions.filter(id => !groupPermissionIds.includes(id));
    } else {
      groupPermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
    }
    
    onPermissionsChange(newPermissions);
  }, [selectedPermissions, onPermissionsChange]);

  const handleSelectAllInArea = useCallback((areaId: string) => {
    const groups = areaId === 'cliente' ? clienteGroups : adminGroups;
    const areaPermissionIds = groups.flatMap(g => g.permissions.map(p => p.id));
    const allSelected = areaPermissionIds.every(id => selectedPermissions.includes(id));
    
    let newPermissions = [...selectedPermissions];
    
    if (allSelected) {
      newPermissions = newPermissions.filter(id => !areaPermissionIds.includes(id));
    } else {
      areaPermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
    }
    
    onPermissionsChange(newPermissions);
  }, [selectedPermissions, onPermissionsChange, adminGroups, clienteGroups]);

  const getAreaStats = useCallback((areaId: string) => {
    const groups = areaId === 'cliente' ? clienteGroups : adminGroups;
    const total = groups.reduce((acc, g) => acc + g.permissions.length, 0);
    const selected = groups.reduce((acc, g) => 
      acc + g.permissions.filter(p => selectedPermissions.includes(p.id)).length, 0
    );
    return { total, selected };
  }, [adminGroups, clienteGroups, selectedPermissions]);

  const getGroupStats = useCallback((group: PermissionGroup) => {
    const total = group.permissions.length;
    const selected = group.permissions.filter(p => selectedPermissions.includes(p.id)).length;
    const critical = group.permissions.filter(p => p.critical && selectedPermissions.includes(p.id)).length;
    
    return { total, selected, critical };
  }, [selectedPermissions]);

  const handleSelectAll = useCallback(() => {
    const allPermissionIds = permissionGroups.flatMap(group => group.permissions.map(p => p.id));
    onPermissionsChange(allPermissionIds);
  }, [permissionGroups, onPermissionsChange]);

  const handleDeselectAll = useCallback(() => {
    onPermissionsChange([]);
  }, [onPermissionsChange]);

  const totalPermissions = useMemo(() => 
    permissionGroups.reduce((acc, group) => acc + group.permissions.length, 0),
    [permissionGroups]
  );
  
  const allSelected = selectedPermissions.length === totalPermissions && totalPermissions > 0;

  // Renderizar área
  const renderArea = (
    areaId: string,
    areaConfig: typeof PERMISSION_AREAS.admin,
    groups: PermissionGroup[]
  ) => {
    const isExpanded = expandedAreas.has(areaId);
    const stats = getAreaStats(areaId);
    const progress = stats.total > 0 ? (stats.selected / stats.total) * 100 : 0;
    const allAreaSelected = stats.selected === stats.total && stats.total > 0;
    const AreaIcon = areaId === 'admin' ? Shield : Users;

    const areaColors = {
      admin: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-600',
        progressBg: 'bg-blue-100',
        progressFill: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      cliente: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-600',
        progressBg: 'bg-emerald-100',
        progressFill: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
      }
    };

    const colors = areaColors[areaId as keyof typeof areaColors] || areaColors.admin;

    if (groups.length === 0) return null;

    return (
      <div key={areaId} className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleArea(areaId)}>
          <div 
            className={`${colors.bg} p-4 cursor-pointer hover:opacity-90 transition-all`}
            onClick={() => toggleArea(areaId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                  <AreaIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{areaConfig.label}</h3>
                  <p className="text-sm text-muted-foreground">{areaConfig.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllInArea(areaId);
                  }}
                  disabled={disabled}
                  className={`${colors.text} hover:${colors.bg}`}
                >
                  {allAreaSelected ? (
                    <CheckSquare className="h-4 w-4 mr-1" />
                  ) : (
                    <Square className="h-4 w-4 mr-1" />
                  )}
                  {allAreaSelected ? 'Desmarcar' : 'Selecionar'} Todas
                </Button>

                <div className="flex items-center gap-2 min-w-[180px]">
                  <div className={`h-2 flex-1 rounded-full ${colors.progressBg} overflow-hidden`}>
                    <div 
                      className={`h-full ${colors.progressFill} transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <Badge variant="outline" className={`${colors.badge} text-xs`}>
                    {stats.selected}/{stats.total}
                  </Badge>
                </div>

                <Button variant="ghost" size="sm" className="ml-2 p-0 h-8 w-8">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <div className="p-4 space-y-3 bg-background">
              {groups.map((group) => {
                const IconComponent = iconMap[group.icon] || Shield;
                const groupStats = getGroupStats(group);
                const isGroupExpanded = expandedGroups.has(group.category);
                const allGroupSelected = groupStats.selected === groupStats.total && groupStats.total > 0;
                const groupProgress = groupStats.total > 0 ? (groupStats.selected / groupStats.total) * 100 : 0;

                return (
                  <div key={group.category} className="border rounded-lg bg-card overflow-hidden">
                    <Collapsible open={isGroupExpanded} onOpenChange={() => toggleGroup(group.category)}>
                      <div 
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                        onClick={() => toggleGroup(group.category)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                            groupStats.selected > 0 
                              ? 'bg-primary/15 text-primary ring-1 ring-primary/30' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-sm">{group.category}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {group.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {groupProgress > 0 && (
                            <div className="hidden sm:flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${groupProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {groupStats.selected}/{groupStats.total}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInGroup(group);
                            }}
                            disabled={disabled}
                            className="h-7 text-xs px-2"
                          >
                            {allGroupSelected ? '✓' : 'Todas'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isGroupExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-1 border-t pt-2">
                          {group.permissions.map((permission) => {
                            const isSelected = selectedPermissions.includes(permission.id);
                            const isCritical = permission.critical;

                            return (
                              <div
                                key={permission.id}
                                className={`flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                                  isCritical ? 'border-l-2 border-l-amber-500 pl-3' : ''
                                } ${isSelected ? 'bg-primary/5' : ''}`}
                                onClick={() => handlePermissionToggle(permission.id, !isSelected)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                                  disabled={disabled}
                                  className="mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{permission.name}</span>
                                    {isCritical && showCriticalWarnings && (
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
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header com busca e ações */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-lg border border-primary/20 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar permissões por nome ou descrição..."
              className="h-10 pl-10 text-sm bg-background/50 backdrop-blur-sm"
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-8 px-3 text-xs font-medium">
              {selectedPermissions.length} / {totalPermissions} selecionadas
            </Badge>
            <Button
              type="button"
              variant={allSelected ? "outline" : "default"}
              size="sm"
              disabled={disabled || totalPermissions === 0}
              onClick={allSelected ? handleDeselectAll : handleSelectAll}
              className="h-8 text-xs"
            >
              {allSelected ? 'Limpar Todas' : 'Selecionar Todas'}
            </Button>
          </div>
        </div>
      </div>

      {/* Áreas de permissões */}
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-4">
          {renderArea('admin', PERMISSION_AREAS.admin, filteredAdminGroups)}
          {renderArea('cliente', PERMISSION_AREAS.cliente, filteredClienteGroups)}
        </div>
      </ScrollArea>
    </div>
  );
});

AdvancedPermissionSelector.displayName = 'AdvancedPermissionSelector';

export default AdvancedPermissionSelector;
