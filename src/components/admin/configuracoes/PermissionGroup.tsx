import React, { useState } from 'react';
import { PermissionGroup as PermissionGroupType } from '@/types/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BarChart3, FileText, Package, Users, Building2, MessageCircle, Settings, TrendingUp, Activity, Webhook } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PermissionItem from './PermissionItem';

// Mapeamento de ícones
const iconMap: { [key: string]: React.ComponentType<any> } = {
  BarChart3,
  FileText,
  Package,
  Users,
  Building2,
  MessageCircle,
  Settings,
  TrendingUp,
  Activity,
  Webhook,
};

interface PermissionGroupProps {
  group: PermissionGroupType;
  onPermissionToggle: (permissionId: string, enabled: boolean) => void;
  defaultOpen?: boolean;
}

const PermissionGroup: React.FC<PermissionGroupProps> = ({ 
  group, 
  onPermissionToggle, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const IconComponent = iconMap[group.icon];
  
  const enabledCount = group.permissions.filter(p => p.enabled).length;
  const totalCount = group.permissions.length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {IconComponent && <IconComponent className="h-5 w-5 text-gray-600" />}
                <div>
                  <CardTitle className="text-lg">{group.category}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {enabledCount}/{totalCount} ativas
                </Badge>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {group.permissions.map((permission) => (
                <PermissionItem
                  key={permission.id}
                  permission={permission}
                  onToggle={onPermissionToggle}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PermissionGroup;