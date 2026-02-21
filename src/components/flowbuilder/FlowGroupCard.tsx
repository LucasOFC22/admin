import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowBlock, FlowGroup } from '@/types/flowbuilder';
import { FlowBlockItem } from './groups/FlowBlockItem';
import { DraggableBlockWrapper } from './groups/DraggableBlockWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FlowGroupCardProps extends NodeProps {
  data: {
    group: FlowGroup;
    onAddBlock: (groupId: string, type: string) => void;
    onUpdateBlock: (groupId: string, blockId: string, data: any) => void;
    onDeleteBlock: (groupId: string, blockId: string) => void;
    onReorderBlocks: (groupId: string, blocks: FlowBlock[]) => void;
    onUpdateTitle: (groupId: string, title: string) => void;
    onCopyGroup: (groupId: string) => void;
    onDeleteGroup: (groupId: string) => void;
    onEditBlock: (groupId: string, blockId: string, block: FlowBlock) => void;
  };
}

const blockTypes = [
  { type: 'text', label: 'Texto' },
  { type: 'menu', label: 'Menu' },
  { type: 'buttons', label: 'Botões' },
  { type: 'question', label: 'Pergunta' },
  { type: 'condition', label: 'Condição' },
  { type: 'ticket', label: 'Fila' },
  { type: 'tags', label: 'Tags' },
  { type: 'location', label: 'Localização' },
  { type: 'httpRequest', label: 'HTTP Request' },
  { type: 'convertBase64', label: 'Converter Base64' },
  { type: 'jump', label: 'Pular' },
  { type: 'document', label: 'Documento' },
];

export const FlowGroupCard: React.FC<FlowGroupCardProps> = ({ data, selected }) => {
  const { group, onAddBlock, onDeleteBlock, onUpdateTitle, onCopyGroup, onDeleteGroup, onEditBlock } = data;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(group.title);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef } = useDroppable({
    id: group.id,
    data: {
      type: 'group',
      groupId: group.id,
    },
  });

  const handleTitleSave = () => {
    onUpdateTitle(group.id, title);
    setIsEditingTitle(false);
  };


  // Check if any block has outputs (menu, question with options)
  const blocksWithOutputs = group.blocks.filter(b => 
    b.type === 'menu' || b.type === 'question' || b.type === 'condition' || b.type === 'randomizer'
  );

  // Blocks that should NOT have output handles (jump navega diretamente, interval tem timer)
  // httpRequest removido - sucesso usa saída azul do grupo, apenas erro usa handle vermelho próprio
  const noOutputBlockTypes = ['interval', 'jump'];
  
  // Check if ALL blocks are no-output types (shouldn't show default output)
  const allBlocksAreNoOutput = group.blocks.length > 0 && 
    group.blocks.every(b => noOutputBlockTypes.includes(b.type));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-white rounded-xl border-2 shadow-sm min-w-[280px] max-w-[320px]",
        "transition-all duration-150",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !-left-1.5"
      />

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="h-7 text-sm font-medium"
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 max-w-[180px] break-words"
            onClick={() => setIsEditingTitle(true)}
          >
            {group.title}
          </span>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-blue-600"
            onClick={() => onCopyGroup(group.id)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-600"
            onClick={() => onDeleteGroup(group.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Blocks */}
      {!isCollapsed && (
        <div className="p-2 space-y-1.5">
          <SortableContext items={group.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {group.blocks.map((block, index) => (
              <DraggableBlockWrapper key={block.id} block={block} groupId={group.id}>
                <FlowBlockItem
                  block={block}
                  groupId={group.id}
                  onClick={() => onEditBlock(group.id, block.id, block)}
                  onDelete={() => onDeleteBlock(group.id, block.id)}
                  showOutputHandles={false}
                  isFirst={index === 0}
                  isLast={index === group.blocks.length - 1}
                />
              </DraggableBlockWrapper>
            ))}
          </SortableContext>

          {/* Add Block Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-8 border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="text-xs">Adicionar bloco</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-40">
              {blockTypes.map((bt) => (
                <DropdownMenuItem
                  key={bt.type}
                  onClick={() => onAddBlock(group.id, bt.type)}
                  className="text-sm"
                >
                  {bt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Output Handles for blocks with multiple outputs */}
      {blocksWithOutputs.length > 0 && (
        <div className="relative">
          {blocksWithOutputs.map((block, blockIndex) => {
            const options = block.data?.menuData?.options || block.data?.options || [];
            const outputCount = block.type === 'randomizer' ? 2 : 
                               block.type === 'condition' ? 2 :
                               Math.max(options.length, 1);
            
            return Array.from({ length: outputCount }).map((_, optIndex) => (
              <Handle
                key={`${block.id}-output-${optIndex}`}
                type="source"
                position={Position.Right}
                id={`${block.id}-${optIndex}`}
                className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white !z-50 hover:!scale-125 transition-transform"
                style={{
                  top: `${40 + (blockIndex * 60) + (optIndex * 16)}px`,
                }}
              />
            ));
          })}
        </div>
      )}

      {/* Default output handle if no special outputs and not all blocks are no-output types */}
      {blocksWithOutputs.length === 0 && !allBlocksAreNoOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white !-right-1.5 !z-50"
        />
      )}
    </div>
  );
};
