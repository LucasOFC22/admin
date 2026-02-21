import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Copy, Trash2 } from 'lucide-react';

interface NodeContextMenuProps {
  children: React.ReactNode;
  onCopy: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ 
  children, 
  onCopy, 
  onDelete, 
  disabled = false 
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={disabled}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copiar
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Apagar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
