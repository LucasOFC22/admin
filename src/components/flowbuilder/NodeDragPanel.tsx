import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Ticket, 
  Bot, 
  Shuffle, 
  GitBranch, 
  HelpCircle, 
  Sparkles, 
  List, 
  Clock,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tag,
  Play,
  Globe,
  FileText,
  ToggleLeft,
  SkipForward,
  Repeat,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NodeType {
  type: string;
  label: string;
  icon: typeof MessageSquare;
  color: string;
  disabled?: boolean;
}

interface NodeCategory {
  name: string;
  nodes: NodeType[];
}

const getNodeCategories = (hasStartNode: boolean): NodeCategory[] => [
  {
    name: 'Início',
    nodes: [
      { type: 'start', label: 'Início', icon: Play, color: 'bg-green-500', disabled: hasStartNode },
    ]
  },
  {
    name: 'Bubbles',
    nodes: [
      { type: 'text', label: 'Texto', icon: MessageSquare, color: 'bg-blue-500' },
      { type: 'document', label: 'Documento', icon: FileText, color: 'bg-sky-500' },
    ]
  },
  {
    name: 'Inputs',
    nodes: [
      { type: 'menu', label: 'Menu', icon: List, color: 'bg-purple-500' },
      { type: 'buttons', label: 'Botões', icon: ToggleLeft, color: 'bg-teal-500' },
      { type: 'question', label: 'Pergunta', icon: HelpCircle, color: 'bg-cyan-500' },
      { type: 'location', label: 'Localização', icon: MapPin, color: 'bg-green-500' },
    ]
  },
  {
    name: 'Condicionais',
    nodes: [
      { type: 'condition', label: 'Condição', icon: GitBranch, color: 'bg-amber-500' },
      { type: 'randomizer', label: 'Randomizador', icon: Shuffle, color: 'bg-pink-500' },
      { type: 'interval', label: 'Intervalo', icon: Clock, color: 'bg-slate-500' },
      { type: 'jump', label: 'Pular', icon: SkipForward, color: 'bg-amber-500' },
      { type: 'loop', label: 'Loop', icon: Repeat, color: 'bg-indigo-500' },
    ]
  },
  {
    name: 'Integrações',
    nodes: [
      { type: 'ticket', label: 'Fila', icon: Ticket, color: 'bg-orange-500' },
      { type: 'tags', label: 'Tags', icon: Tag, color: 'bg-emerald-500' },
      { type: 'typebot', label: 'Typebot', icon: Bot, color: 'bg-indigo-500' },
      { type: 'openai', label: 'OpenAI', icon: Sparkles, color: 'bg-violet-500' },
      { type: 'httpRequest', label: 'HTTP Request', icon: Globe, color: 'bg-rose-500' },
      { type: 'javascript', label: 'JavaScript', icon: Code2, color: 'bg-amber-500' },
    ]
  },
];

interface NodeDragPanelProps {
  onNodeClick: (type: string) => void;
  hasStartNode?: boolean;
}

export const NodeDragPanel: React.FC<NodeDragPanelProps> = ({ onNodeClick, hasStartNode = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(['Início', 'Bubbles', 'Inputs', 'Condicionais', 'Integrações']);
  
  const nodeCategories = getNodeCategories(hasStartNode);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-64 bg-white border-r border-gray-200 rounded-none flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-800">Adicionar Nodes</h3>
          <p className="text-xs text-gray-500 mt-1">
            Arraste ou clique para adicionar
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {nodeCategories.map((category) => (
            <Collapsible
              key={category.name}
              open={openCategories.includes(category.name)}
              onOpenChange={() => toggleCategory(category.name)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md transition-colors">
                <span className="text-sm font-medium text-gray-800">{category.name}</span>
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 text-gray-500 transition-transform",
                    openCategories.includes(category.name) && "rotate-180"
                  )} 
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {category.nodes.map((node) => {
                  const Icon = node.icon;
                  const isDisabled = node.disabled;
                  return (
                    <div
                      key={node.type}
                      draggable={!isDisabled}
                      onDragStart={(e) => !isDisabled && onDragStart(e, node.type)}
                      onClick={() => !isDisabled && onNodeClick(node.type)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        'bg-white border border-gray-200',
                        'transition-all duration-200',
                        isDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-move hover:bg-gray-50 hover:scale-105 hover:shadow-md active:scale-95'
                      )}
                    >
                      <div className={cn('p-2 rounded-md', node.color, isDisabled && 'opacity-50')}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={cn("text-sm font-medium", isDisabled ? "text-gray-400" : "text-gray-800")}>
                        {node.label}
                        {isDisabled && <span className="text-xs ml-1">(já adicionado)</span>}
                      </span>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
