import React, { useCallback } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  DragStartEvent,
  PointerSensor, 
  useSensor, 
  useSensors,
  pointerWithin
} from '@dnd-kit/core';
import { FlowBlock } from '@/types/flowbuilder';
import { MessageSquare, List, HelpCircle, GitBranch, Ticket, Tag, Bot, Sparkles, Shuffle, Clock, MapPin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const blockConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  text: { icon: MessageSquare, label: 'Texto', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  menu: { icon: List, label: 'Menu', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  question: { icon: HelpCircle, label: 'Pergunta', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  condition: { icon: GitBranch, label: 'Condição', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  ticket: { icon: Ticket, label: 'Fila', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  tags: { icon: Tag, label: 'Tags', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  typebot: { icon: Bot, label: 'Typebot', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  openai: { icon: Sparkles, label: 'OpenAI', color: 'text-violet-600', bgColor: 'bg-violet-100' },
  randomizer: { icon: Shuffle, label: 'Randomizador', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  interval: { icon: Clock, label: 'Intervalo', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  location: { icon: MapPin, label: 'Localização', color: 'text-green-600', bgColor: 'bg-green-100' },
  httpRequest: { icon: Globe, label: 'HTTP Request', color: 'text-rose-600', bgColor: 'bg-rose-100' },
};

interface GlobalDndContextProps {
  children: React.ReactNode;
  onBlockMove: (
    blockId: string,
    sourceGroupId: string,
    targetGroupId: string | null,
    newOrder: number,
    targetPosition?: { x: number; y: number }
  ) => void;
  onBlockReorder: (groupId: string, blocks: FlowBlock[]) => void;
  groups: { id: string; blocks: FlowBlock[] }[];
  screenToFlowPosition?: (point: { x: number; y: number }) => { x: number; y: number };
}

export const GlobalDndContext: React.FC<GlobalDndContextProps> = ({
  children,
  onBlockMove,
  onBlockReorder,
  groups,
  screenToFlowPosition
}) => {
  const [activeBlock, setActiveBlock] = React.useState<FlowBlock | null>(null);
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
  const [dragEndPosition, setDragEndPosition] = React.useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    // Prefer explicit dnd-kit data when available
    if (data?.type === 'block' && data.block && data.groupId) {
      setActiveBlock(data.block);
      setActiveGroupId(data.groupId);
      return;
    }

    // Fallback: infer block and group from the active id
    const blockId = active.id as string;
    const sourceGroup = groups.find((g) => g.blocks.some((b) => b.id === blockId));
    if (sourceGroup) {
      const block = sourceGroup.blocks.find((b) => b.id === blockId) || null;
      setActiveBlock(block);
      setActiveGroupId(sourceGroup.id);
    }
  }, [groups]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Get the mouse position at end of drag
    const mousePosition = event.activatorEvent instanceof MouseEvent 
      ? { x: event.activatorEvent.clientX, y: event.activatorEvent.clientY }
      : null;

    // Resolve source block and group from state or by inferring from id
    let currentBlock = activeBlock;
    let currentGroupId = activeGroupId;

    if (!currentBlock || !currentGroupId) {
      const activeId = active.id as string;
      const sourceGroup = groups.find((g) => g.blocks.some((b) => b.id === activeId));
      if (sourceGroup) {
        currentGroupId = sourceGroup.id;
        currentBlock = sourceGroup.blocks.find((b) => b.id === activeId) || null;
      }
    }

    setActiveBlock(null);
    setActiveGroupId(null);

    if (!currentBlock || !currentGroupId) return;

    const sourceGroupId = currentGroupId;
    const blockId = active.id as string;

    // If dropped over something
    if (over) {
      const overData = over.data.current;

      // Dropping on a droppable group area (fallback to over.id === groupId)
      const isGroupDrop = overData?.type === 'group' || groups.some((g) => g.id === over.id);
      if (isGroupDrop) {
        const targetGroupId = (overData as any)?.groupId ?? (over.id as string);

        if (sourceGroupId !== targetGroupId) {
          const targetGroup = groups.find((g) => g.id === targetGroupId);
          const newOrder = (targetGroup?.blocks.length || 0) + 1;
          onBlockMove(blockId, sourceGroupId, targetGroupId, newOrder);
        }
        return;
      }

      // Dropping on another block (fallback: infer group by target block id)
      const isBlockDrop = overData?.type === 'block' || groups.some((g) => g.blocks.some((b) => b.id === over.id));
      if (isBlockDrop) {
        const targetBlockId = over.id as string;
        const targetGroup = groups.find((g) => g.blocks.some((b) => b.id === targetBlockId));
        const targetGroupId = targetGroup?.id;

        if (!targetGroupId) return;

        if (sourceGroupId === targetGroupId) {
          // Reordering within same group
          const group = groups.find((g) => g.id === sourceGroupId);
          if (group && active.id !== over.id) {
            const oldIndex = group.blocks.findIndex((b) => b.id === blockId);
            const newIndex = group.blocks.findIndex((b) => b.id === targetBlockId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              const newBlocks = [...group.blocks];
              const [removed] = newBlocks.splice(oldIndex, 1);
              newBlocks.splice(newIndex, 0, removed);
              const reorderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i + 1 }));
              onBlockReorder(sourceGroupId, reorderedBlocks);
            }
          }
        } else {
          // Moving to different group at specific position
          if (targetGroup) {
            const targetIndex = targetGroup.blocks.findIndex((b) => b.id === targetBlockId);
            const newOrder = targetIndex !== -1 ? targetIndex + 1 : targetGroup.blocks.length + 1;
            onBlockMove(blockId, sourceGroupId, targetGroupId, newOrder);
          }
        }
        return;
      }
    }

    // Dropped on empty area - create new card
    // Use the delta from the drag event to calculate position
    if (event.delta && screenToFlowPosition) {
      // Get approximate drop position from the event
      const rect = (event.activatorEvent?.target as HTMLElement)?.getBoundingClientRect();
      if (rect) {
        const dropX = rect.left + event.delta.x;
        const dropY = rect.top + event.delta.y;
        const flowPosition = screenToFlowPosition({ x: dropX, y: dropY });
        onBlockMove(blockId, sourceGroupId, null, 1, flowPosition);
      }
    }
  }, [activeBlock, activeGroupId, groups, onBlockMove, onBlockReorder, screenToFlowPosition]);

  const config = activeBlock ? blockConfig[activeBlock.type] : null;
  const Icon = config?.icon || MessageSquare;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeBlock && (
          <div className={cn(
            "flex items-center gap-2 p-2.5 rounded-lg w-[280px]",
            "bg-white shadow-2xl border-2 border-blue-400",
            "opacity-90"
          )}>
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-blue-600">{activeBlock.order}</span>
            </div>
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", config?.bgColor)}>
              <Icon className={cn("h-4 w-4", config?.color)} />
            </div>
            <div className="flex-1 min-w-0 max-w-[180px]">
              <p className="text-xs font-semibold text-gray-800">{config?.label}</p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
