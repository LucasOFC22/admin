import React from 'react';
import { Permission } from '@/types/permissions';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface PermissionItemProps {
  permission: Permission;
  onToggle: (permissionId: string, enabled: boolean) => void;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ permission, onToggle }) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'manage':
        return 'bg-purple-100 text-purple-800';
      case 'export':
        return 'bg-cyan-100 text-cyan-800';
      case 'configure':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Criar';
      case 'read':
        return 'Visualizar';
      case 'update':
        return 'Editar';
      case 'delete':
        return 'Excluir';
      case 'manage':
        return 'Gerenciar';
      case 'export':
        return 'Exportar';
      case 'configure':
        return 'Configurar';
      default:
        return action;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Badge className={getActionColor(permission.action)}>
          {getActionLabel(permission.action)}
        </Badge>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{permission.name}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{permission.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-gray-500">{permission.description}</p>
        </div>
      </div>
      
      <Switch
        checked={permission.enabled}
        onCheckedChange={(checked) => onToggle(permission.id, checked)}
      />
    </div>
  );
};

export default PermissionItem;