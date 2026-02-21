import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Copy, Trash2, GripVertical, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlowBlockItem } from './FlowBlockItem';
import { DraggableBlockWrapper } from './DraggableBlockWrapper';
import { FlowGroup, FlowBlock } from '@/types/flowbuilder';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const blockTypes = [
  { type: 'text', label: 'Texto' },
  { type: 'menu', label: 'Menu' },
  { type: 'buttons', label: 'Botões' },
  { type: 'question', label: 'Pergunta' },
  { type: 'condition', label: 'Condição' },
  { type: 'ticket', label: 'Fila' },
  { type: 'tags', label: 'Tags' },
  { type: 'typebot', label: 'Typebot' },
  { type: 'openai', label: 'OpenAI' },
  { type: 'randomizer', label: 'Randomizador' },
  { type: 'interval', label: 'Intervalo' },
  { type: 'location', label: 'Localização' },
  { type: 'httpRequest', label: 'HTTP Request' },
  { type: 'convertBase64', label: 'Converter Base64' },
  { type: 'jump', label: 'Pular' },
  { type: 'document', label: 'Documento' },
];

interface FlowGroupNodeProps extends NodeProps {
  data: {
    group: FlowGroup;
    groupNumber: number;
    onTitleChange: (groupId: string, title: string) => void;
    onBlockClick: (groupId: string, block: FlowBlock) => void;
    onBlockReorder: (groupId: string, blocks: FlowBlock[]) => void;
    onAddBlock: (groupId: string, type: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onCopyGroup: (groupId: string) => void;
    onDeleteBlock: (groupId: string, blockId: string) => void;
  };
}

const FlowGroupNodeComponent: React.FC<FlowGroupNodeProps> = ({ data, selected }) => {
  const { group, groupNumber, onTitleChange, onBlockClick, onBlockReorder, onAddBlock, onDeleteGroup, onCopyGroup, onDeleteBlock } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(group.title);
  const [isHovered, setIsHovered] = useState(false);

  // Drop zone for receiving blocks from other groups
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `dropzone-${group.id}`,
    data: {
      type: 'group',
      groupId: group.id
    }
  });

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (titleValue.trim() !== group.title) {
      onTitleChange(group.id, titleValue.trim() || `Group #${groupNumber}`);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleBlur();
    if (e.key === 'Escape') { setTitleValue(group.title); setIsEditing(false); }
  };

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newBlocks = [...group.blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    const reorderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i + 1 }));
    onBlockReorder(group.id, reorderedBlocks);
  };

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index >= group.blocks.length - 1) return;
    const newBlocks = [...group.blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    const reorderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i + 1 }));
    onBlockReorder(group.id, reorderedBlocks);
  };

  // Check if any block has multiple outputs (menu, condition, randomizer)
  const hasBlockWithMultipleOutputs = group.blocks.some(b => 
    ['menu', 'condition', 'randomizer'].includes(b.type)
  );

  return (
    <div
      className="relative pt-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action buttons - now inside the hover area */}
      <div className={cn(
        "absolute top-0 right-0 flex gap-1 transition-all duration-200 z-10",
        isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white hover:bg-gray-100 border border-gray-200" onClick={() => onCopyGroup(group.id)}><Copy className="h-4 w-4" /></Button>
        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDeleteGroup(group.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>

      <div
        ref={setDropRef}
        className={cn(
          "relative flex flex-col rounded-xl overflow-visible w-[320px] select-none transition-all duration-200",
          "bg-white shadow-lg",
          selected && "ring-2 ring-blue-500 border-blue-300",
          isOver 
            ? "border-[3px] border-dashed border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]" 
            : "border-2 border-gray-200"
        )}
      >
        <Handle type="target" position={Position.Top} className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white !-top-2 !z-30" />

      <div className="group-drag-handle px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-grab active:cursor-grabbing">
        {isEditing ? (
          <Input value={titleValue} onChange={(e) => setTitleValue(e.target.value)} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} autoFocus className="h-7 bg-white border-gray-300 text-gray-800 text-sm font-medium" />
        ) : (
          <div className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="text-gray-800 font-semibold text-sm flex-1 cursor-text">{group.title || `Group #${groupNumber}`}</span>
          </div>
        )}
      </div>

      <div className="px-3 py-3 space-y-2 min-h-[80px]">
        <SortableContext
          items={group.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.blocks.map((block, index) => (
            <DraggableBlockWrapper key={block.id} block={block} groupId={group.id} isExternalDragOver={isOver}>
              <FlowBlockItem
                block={block} 
                groupId={group.id}
                onClick={() => onBlockClick(group.id, block)} 
                onDelete={() => onDeleteBlock(group.id, block.id)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === group.blocks.length - 1}
              />
            </DraggableBlockWrapper>
          ))}
        </SortableContext>
        {group.blocks.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-lg">
            {isOver ? "Solte aqui para adicionar" : "Clique em + para adicionar um bloco"}
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-dashed border-gray-300">
              <Plus className="h-4 w-4 mr-2" />Adicionar bloco<ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border-gray-200 z-[250]">
            {blockTypes.map((bt) => (
              <DropdownMenuItem key={bt.type} onClick={() => onAddBlock(group.id, bt.type)} className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900">{bt.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        {/* Only show bottom handle if no block has multiple outputs */}
        {!hasBlockWithMultipleOutputs && (
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="group-success-output"
            className="group-success-handle !w-4 !h-4 !bg-blue-500 !border-2 !border-white !-bottom-2" 
            style={{ zIndex: 200 }}
          />
        )}
      </div>
    </div>
  );
};

export const FlowGroupNode = FlowGroupNodeComponent;
