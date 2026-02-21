import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { FlowBlock } from '@/types/flowbuilder';
import { GripVertical } from 'lucide-react';

interface DraggableBlockWrapperProps {
  block: FlowBlock;
  groupId: string;
  children: React.ReactNode;
  isExternalDragOver?: boolean;
}

export const DraggableBlockWrapper: React.FC<DraggableBlockWrapperProps> = ({
  block,
  groupId,
  children,
  isExternalDragOver = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: block.id,
    data: {
      type: 'block',
      block,
      groupId
    }
  });

  const style: React.CSSProperties = {
    transform: isExternalDragOver ? undefined : CSS.Transform.toString(transform),
    transition: isExternalDragOver ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "ring-2 ring-blue-400 rounded-lg opacity-50"
      )}
    >
      <div className="flex items-start gap-1">
        {/* Drag handle - apenas este elemento recebe os listeners de drag */}
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded mt-1.5 flex-shrink-0"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {/* Conteúdo - livre para ReactFlow Handles funcionarem */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};
