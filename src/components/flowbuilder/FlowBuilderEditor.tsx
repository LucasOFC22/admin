import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import { Button } from '@/components/ui/button';
import {
  Save, 
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FlowBuilderTextModal } from './FlowBuilderTextModal';
import { FlowBuilderTicketModal } from './FlowBuilderTicketModal';
import { FlowBuilderTypebotModal } from './FlowBuilderTypebotModal';
import { FlowBuilderRandomizerModal } from './FlowBuilderRandomizerModal';
import { FlowBuilderConditionModalV2 } from './FlowBuilderConditionModalV2';
import { FlowBuilderQuestionModal } from './FlowBuilderQuestionModal';
import { FlowBuilderOpenAIModal } from './FlowBuilderOpenAIModal';
import { FlowBuilderMenuModal } from './FlowBuilderMenuModal';
import { FlowBuilderIntervalModal } from './FlowBuilderIntervalModal';
import { FlowBuilderLocationModal } from './FlowBuilderLocationModal';
import { FlowBuilderTagsModal } from './FlowBuilderTagsModal';
import { NodeDragPanel } from './NodeDragPanel';
import { NodeContextMenu } from './NodeContextMenu';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FlowBuilderEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave: (nodes: Node[], edges: Edge[]) => void;
  onAutoSave?: (nodes: Node[], edges: Edge[]) => void;
}

export const FlowBuilderEditor: React.FC<FlowBuilderEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onAutoSave
}) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);
  
  // Estados para copiar/colar e maximizar
  const [copiedNode, setCopiedNode] = useState<Node | null>(null);
  const [pastePosition, setPastePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Criar node inicial se não existir
  const initialNodesWithStart = useMemo(() => {
    const hasStartNode = initialNodes.some(node => node.data?.type === 'start');
    if (hasStartNode || initialNodes.length === 0) {
      return initialNodes.length === 0 
        ? [{
            id: 'start-node',
            type: 'customNode',
            position: { x: 250, y: 50 },
            data: { 
              label: 'Início',
              type: 'start',
              description: 'Ponto de partida do fluxo'
            },
            draggable: false,
            deletable: false
          }]
        : initialNodes;
    }
    return [
      {
        id: 'start-node',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { 
          label: 'Início',
          type: 'start',
          description: 'Ponto de partida do fluxo'
        },
        draggable: false,
        deletable: false
      },
      ...initialNodes
    ];
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesWithStart);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const nodeTypes = useMemo(() => ({ 
    customNode: CustomNode
  }), []);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    type: string | null;
    mode: 'create' | 'edit';
    data?: any;
  }>({
    open: false,
    type: null,
    mode: 'create'
  });

  // Auto-save on changes
  useEffect(() => {
    if (onAutoSave && nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        onAutoSave(nodes, edges);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, onAutoSave]);

  // Keyboard shortcuts para copiar/colar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C - Copiar
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selectedNode = nodes.find(n => n.selected && n.data?.type !== 'start');
        if (selectedNode) {
          setCopiedNode(selectedNode);
        }
      }
      
      // Ctrl+V - Colar
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNode && pastePosition) {
        const newNode: Node = {
          ...copiedNode,
          id: `${copiedNode.data.type}-${nanoid()}`,
          position: { x: pastePosition.x, y: pastePosition.y },
          selected: false
        };
        setNodes((nds) => [...nds, newNode]);
      }

      // ESC - Sair do modo maximizado
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes, copiedNode, pastePosition, isMaximized, setNodes, toast]);

  // Connection handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Create a new node
  const createNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `${type}-${nanoid()}`,
        type: 'customNode',
        position,
        data: { 
          type,
          label: getNodeLabel(type)
        },
      };

      setNodes((nds) => [...nds, newNode]);
      return newNode;
    },
    [setNodes]
  );

  // Get node label by type
  const getNodeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      text: 'Mensagem de Texto',
      menu: 'Menu Interativo',
      question: 'Pergunta',
      condition: 'Condição',
      ticket: 'Criar Fila',
      tags: 'Tags',
      typebot: 'Typebot',
      openai: 'OpenAI',
      randomizer: 'Randomizador',
      interval: 'Intervalo',
      location: 'Localização',
    };
    return labels[type] || type;
  };

  // Handle drag and drop from panel
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create node and open modal
      const newNode = createNode(type, position);
      setModalConfig({
        open: true,
        type,
        mode: 'create',
        data: newNode
      });
    },
    [reactFlowInstance, createNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Capturar posição do mouse para colar
  const onPaneMouseMove = useCallback((event: React.MouseEvent) => {
    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setPastePosition(position);
    }
  }, [reactFlowInstance]);

  // Handle node click from panel
  const handleNodeClick = useCallback(
    (type: string) => {
      const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
      
      const newNode = createNode(type, position);
      setModalConfig({
        open: true,
        type,
        mode: 'create',
        data: newNode
      });
    },
    [createNode]
  );

  // Handle double click to edit node
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data?.type === 'start') return;
      
      setModalConfig({
        open: true,
        type: node.data.type,
        mode: 'edit',
        data: node
      });
    },
    []
  );

  // Handle context menu (botão direito)
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.data?.type === 'start') return;
      
      // Selecionar o node clicado
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
    },
    [setNodes]
  );

  // Handler para copiar node do menu de contexto
  const handleCopyNode = useCallback(() => {
    const selectedNode = nodes.find(n => n.selected && n.data?.type !== 'start');
    if (selectedNode) {
      setCopiedNode(selectedNode);
    }
  }, [nodes]);

  // Handler para deletar node do menu de contexto
  const handleDeleteNode = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected && n.data?.type !== 'start');
    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !node.selected || node.data?.type === 'start'));
      setEdges((eds) => eds.filter((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        return sourceNode && targetNode && !sourceNode.selected && !targetNode.selected;
      }));
    }
  }, [nodes, setNodes, setEdges]);

  // Handle modal save
  const handleModalSave = useCallback(
    (data: any) => {
      isSavingRef.current = true;
      
      if (modalConfig.data) {
        setNodes((nds) => {
          const updatedNodes = nds.map((node) => {
            if (node.id === modalConfig.data.id) {
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          });
          return updatedNodes;
        });
      }
      setModalConfig({ open: false, type: null, mode: 'create' });
    },
    [modalConfig, setNodes]
  );

  const handleModalClose = useCallback(() => {
    // Se acabamos de salvar, apenas resetar a flag e fechar
    if (isSavingRef.current) {
      isSavingRef.current = false;
      setModalConfig({ open: false, type: null, mode: 'create' });
      return;
    }
    
    // Se é um node novo e não foi salvo, deletar
    if (modalConfig.mode === 'create' && modalConfig.data) {
      setNodes((nds) => nds.filter((node) => node.id !== modalConfig.data.id));
    }
    setModalConfig({ open: false, type: null, mode: 'create' });
  }, [modalConfig, setNodes]);

  const handleModalUpdate = useCallback((updatedNode: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    setModalConfig({ open: false, type: null, mode: 'create' });
  }, [setNodes]);

  // Delete selected nodes
  const onDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      return;
    }

    setNodes((nds) => nds.filter((node) => !node.selected && node.data?.type !== 'start'));
    setEdges((eds) => eds.filter((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return sourceNode && targetNode && !sourceNode.selected && !targetNode.selected;
    }));
  }, [nodes, setNodes, setEdges]);


  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  return (
    <ReactFlowProvider>
      <div 
        className={cn(
          "flex gap-4 transition-all duration-300",
          isMaximized 
            ? "fixed inset-0 z-50 bg-background p-4" 
            : "h-[600px]"
        )} 
        ref={reactFlowWrapper}
      >
        <NodeDragPanel onNodeClick={handleNodeClick} />
        
        <div className="flex-1 relative">
          <NodeContextMenu 
            onCopy={handleCopyNode}
            onDelete={handleDeleteNode}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneMouseMove={onPaneMouseMove}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background"
              minZoom={0.1}
              maxZoom={2}
            >
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </NodeContextMenu>
  
          <Panel position="top-right" className="flex gap-2">
            <Button 
              onClick={() => setIsMaximized(!isMaximized)} 
              size="sm" 
              variant="outline"
              title={isMaximized ? "Sair do modo tela cheia" : "Maximizar"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={onDeleteSelected} variant="destructive" size="sm">
              Deletar Selecionados
            </Button>
          </Panel>
        </div>
  
        {/* Modals */}
        <FlowBuilderTextModal
          open={modalConfig.open && modalConfig.type === 'text'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderMenuModal
          open={modalConfig.open && modalConfig.type === 'menu'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderQuestionModal
          open={modalConfig.open && modalConfig.type === 'question'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderConditionModalV2
          open={modalConfig.open && modalConfig.type === 'condition'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderTicketModal
          open={modalConfig.open && modalConfig.type === 'ticket'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderTypebotModal
          open={modalConfig.open && modalConfig.type === 'typebot'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderOpenAIModal
          open={modalConfig.open && modalConfig.type === 'openai'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderRandomizerModal
          open={modalConfig.open && modalConfig.type === 'randomizer'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderIntervalModal
          open={modalConfig.open && modalConfig.type === 'interval'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderLocationModal
          open={modalConfig.open && modalConfig.type === 'location'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
        <FlowBuilderTagsModal
          open={modalConfig.open && modalConfig.type === 'tags'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data}
          mode={modalConfig.mode}
        />
      </div>
    </ReactFlowProvider>
  );
};
