import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Save, Maximize2, Minimize2, Plus, Play, Braces, ArrowLeft } from 'lucide-react';
import { FlowBuilderTextModal } from './FlowBuilderTextModal';
import { FlowBuilderTicketModal } from './FlowBuilderTicketModal';
import { FlowBuilderTypebotModal } from './FlowBuilderTypebotModal';
import { FlowBuilderRandomizerModal } from './FlowBuilderRandomizerModal';
import { FlowBuilderConditionModalV2 } from './FlowBuilderConditionModalV2';
import { FlowBuilderQuestionModal } from './FlowBuilderQuestionModal';
import { FlowBuilderOpenAIModal } from './FlowBuilderOpenAIModal';
import { FlowBuilderMenuModal } from './FlowBuilderMenuModal';
import { FlowBuilderButtonsModal } from './FlowBuilderButtonsModal';
import { FlowBuilderIntervalModal } from './FlowBuilderIntervalModal';
import { FlowBuilderLocationModal } from './FlowBuilderLocationModal';
import { FlowBuilderTagsModal } from './FlowBuilderTagsModal';
import { FlowBuilderHTTPRequestModal } from './FlowBuilderHTTPRequestModal';
import { FlowBuilderJumpModal } from './FlowBuilderJumpModal';
import { FlowBuilderDocumentModal } from './FlowBuilderDocumentModal';
import { FlowBuilderConvertBase64Modal } from './FlowBuilderConvertBase64Modal';
import { FlowBuilderLoopModal } from './FlowBuilderLoopModal';
import { FlowBuilderJavaScriptModal } from './FlowBuilderJavaScriptModal';
import { NodeDragPanel } from './NodeDragPanel';
import { FlowGroupNode } from './groups/FlowGroupNode';
import { GlobalDndContext } from './groups/GlobalDndContext';
import { useFlowGroups } from '@/hooks/useFlowGroups';
import { FlowBlock, FlowGroup } from '@/types/flowbuilder';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Start Node Component
const StartNode = ({ selected }: { selected?: boolean }) => (
  <div
    className={cn(
      "px-4 py-3 rounded-xl bg-white border-2 shadow-sm",
      "flex items-center gap-3 min-w-[120px]",
      selected ? "border-green-500 shadow-md" : "border-green-300",
      "transition-all duration-150"
    )}
  >
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
      <Play className="w-4 h-4 text-white fill-white" />
    </div>
    <span className="text-sm font-semibold text-gray-800">Início</span>
    <Handle
      type="source"
      position={Position.Right}
      className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
    />
  </div>
);

interface FlowBuilderGroupEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialGroups?: FlowGroup[];
  flowId?: string;
  onSave: (nodes: Node[], edges: Edge[], groups?: FlowGroup[]) => void;
  onAutoSave?: (nodes: Node[], edges: Edge[], groups?: FlowGroup[]) => void;
  onOpenVariables?: () => void;
  onBack?: () => void;
}

const FlowBuilderGroupEditorInner: React.FC<FlowBuilderGroupEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  initialGroups,
  flowId,
  onSave,
  onAutoSave,
  onOpenVariables,
  onBack
}) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [isMaximized, setIsMaximized] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [copiedGroup, setCopiedGroup] = useState<FlowGroup | null>(null);
  const [lastClickPosition, setLastClickPosition] = useState<{ x: number; y: number }>({ x: 300, y: 200 });
  
  // Check if initial data has a start node and get its position
  const initialStartNode = useMemo(() => 
    initialNodes.find(n => n.type === 'startNode' || n.data?.type === 'start'),
    [initialNodes]
  );
  const [hasStartNode, setHasStartNode] = useState(!!initialStartNode);
  const [startNodePosition, setStartNodePosition] = useState<{ x: number; y: number }>(
    initialStartNode?.position || { x: 50, y: 200 }
  );

  // Memoize initial data to prevent unnecessary re-renders
  const initialFlowData = useMemo(() => ({
    nodes: initialNodes,
    edges: initialEdges,
    groups: initialGroups
  }), [initialNodes, initialEdges, initialGroups]);

  // Use the groups hook with memoized data
  const {
    groups,
    edges,
    setEdges,
    createGroup,
    addBlockToGroup,
    updateBlock,
    deleteBlock,
    deleteGroup,
    copyGroup,
    copyGroupAtPosition,
    updateGroupTitle,
    reorderBlocks,
    moveBlockBetweenGroups,
    updateGroupPosition,
    convertToNodes,
    getGroupsForSave
  } = useFlowGroups(initialFlowData);

  const handleBlockMove = useCallback(
    (
      blockId: string,
      sourceGroupId: string,
      targetGroupId: string | null,
      newOrder: number,
      targetPosition?: { x: number; y: number }
    ) => {
      moveBlockBetweenGroups(blockId, sourceGroupId, targetGroupId, newOrder, targetPosition);
    },
    [moveBlockBetweenGroups]
  );

  const handleBlockReorder = useCallback(
    (groupId: string, blocks: FlowBlock[]) => {
      reorderBlocks(groupId, blocks);
    },
    [reorderBlocks]
  );

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    type: string | null;
    mode: 'create' | 'edit';
    groupId?: string;
    blockId?: string;
    data?: any;
  }>({
    open: false,
    type: null,
    mode: 'create'
  });

  // Stable callback references for node data
  const handleBlockClick = useCallback((groupId: string, block: FlowBlock) => {
    console.log('=== BLOCK CLICK ===', { groupId, blockId: block.id, blockType: block.type });
    setModalConfig({
      open: true,
      type: block.type,
      mode: 'edit',
      groupId,
      blockId: block.id,
      data: block.data
    });
  }, []);

  // Wrapper para adicionar bloco E abrir modal
  const handleAddBlockToGroup = useCallback((groupId: string, type: string) => {
    console.log('=== ADD BLOCK ===', { groupId, type });
    const blockId = `block-${Date.now()}`;
    addBlockToGroup(groupId, type, {}, blockId);
    setModalConfig({
      open: true,
      type,
      mode: 'create',
      groupId,
      blockId,
      data: {}
    });
  }, [addBlockToGroup]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    deleteGroup(groupId);
  }, [deleteGroup]);

  const handleCopyGroup = useCallback((groupId: string) => {
    copyGroup(groupId);
  }, [copyGroup]);

  // Convert groups to ReactFlow nodes
  const flowNodes = useMemo(() => {
    const nodes: Node[] = [];

    // Add start node if exists
    if (hasStartNode) {
      nodes.push({
        id: 'start-node',
        type: 'startNode',
        position: startNodePosition,
        data: {},
        deletable: false,
      });
    }

    // Add group nodes
    groups.forEach((group, index) => {
      nodes.push({
        id: group.id,
        type: 'flowGroup',
        position: group.position,
        data: {
          group,
          groupNumber: index + 1,
          onTitleChange: updateGroupTitle,
          onBlockClick: handleBlockClick,
          onBlockReorder: reorderBlocks,
          onAddBlock: handleAddBlockToGroup,
          onDeleteGroup: handleDeleteGroup,
          onCopyGroup: handleCopyGroup,
          onDeleteBlock: deleteBlock
        },
        dragHandle: '.group-drag-handle'
      });
    });

    return nodes;
  }, [groups, hasStartNode, startNodePosition, updateGroupTitle, handleBlockClick, reorderBlocks, handleAddBlockToGroup, handleDeleteGroup, handleCopyGroup, deleteBlock]);

  const nodeTypes = useMemo(() => ({
    flowGroup: FlowGroupNode,
    startNode: StartNode
  }), []);

  // Handle node position change
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        if (change.id === 'start-node') {
          setStartNodePosition(change.position);
        } else {
          updateGroupPosition(change.id, change.position);
        }
      }
    });
  }, [updateGroupPosition]);

  // Refs to track connection start validity (mainly for lateral handles like httpRequest-error)
  const invalidConnectionStartRef = useRef<string | null>(null);
  const lastConnectStartHandleRef = useRef<string | null>(null);

  // Validate if the pointer-down was REALLY on top of the handle circle.
  // This prevents lateral handles (ex: httpRequest-error) from stealing the drag.
  const onConnectStart = useCallback((event: any, params: any) => {
    const handleId: string | null = params?.handleId ?? null;

    invalidConnectionStartRef.current = null;
    lastConnectStartHandleRef.current = handleId;

    // For error handles, be VERY strict about what counts as a valid click
    if (handleId && handleId.includes('-error')) {
      const target = event?.target as HTMLElement | null;
      const handleEl = target?.closest?.('.react-flow__handle') as HTMLElement | null;
      
      if (!handleEl) {
        invalidConnectionStartRef.current = handleId;
        return;
      }

      const rect = handleEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX = event?.touches?.[0]?.clientX ?? event?.clientX;
      const clientY = event?.touches?.[0]?.clientY ?? event?.clientY;
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return;

      const distance = Math.hypot(clientX - centerX, clientY - centerY);

      // Very strict radius: only accept clicks directly on the tiny red circle
      const acceptableRadius = Math.max(rect.width, rect.height) / 2;

      if (distance > acceptableRadius) {
        invalidConnectionStartRef.current = handleId;
      }
    }
  }, []);

  const onConnectEnd = useCallback(() => {
    // Always clear after finishing a drag
    invalidConnectionStartRef.current = null;
    lastConnectStartHandleRef.current = null;
  }, []);

  // Handle edge connection - ignore invalid starts
  const onConnect = useCallback(
    (params: Connection) => {
      if (invalidConnectionStartRef.current && params.sourceHandle === invalidConnectionStartRef.current) {
        invalidConnectionStartRef.current = null;
        lastConnectStartHandleRef.current = null;
        return;
      }

      invalidConnectionStartRef.current = null;
      lastConnectStartHandleRef.current = null;
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // Handle edges change
  const onEdgesChange = useCallback((changes: any[]) => {
    setEdges((eds) => {
      let newEdges = [...eds];
      changes.forEach(change => {
        if (change.type === 'remove') {
          newEdges = newEdges.filter(e => e.id !== change.id);
        }
      });
      return newEdges;
    });
  }, [setEdges]);

  // Handle edge click - delete on click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdges((eds) => eds.filter(e => e.id !== edge.id));
  }, [setEdges]);

  // Handle drop from panel - create new group
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Handle start node
      if (type === 'start') {
        if (hasStartNode) return;
        setHasStartNode(true);
        setStartNodePosition(position);
        return;
      }

      // Create new group with the block
      const newGroup = createGroup(type, position);

      // Open modal for the new block
      setModalConfig({
        open: true,
        type,
        mode: 'create',
        groupId: newGroup.id,
        blockId: newGroup.blocks[0].id,
        data: {}
      });
    },
    [reactFlowInstance, createGroup, hasStartNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle click on panel to add node
  const handleNodeClick = useCallback((type: string) => {
    // Handle start node
    if (type === 'start') {
      if (hasStartNode) return;
      setHasStartNode(true);
      setStartNodePosition({ x: 50, y: 200 });
      return;
    }

    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    };

    const newGroup = createGroup(type, position);

    setModalConfig({
      open: true,
      type,
      mode: 'create',
      groupId: newGroup.id,
      blockId: newGroup.blocks[0].id,
      data: {}
    });
  }, [createGroup, hasStartNode]);

  // Handle modal save
  const handleModalSave = useCallback((data: any) => {
    console.log('=== MODAL SAVE ===', { groupId: modalConfig.groupId, blockId: modalConfig.blockId, data });
    if (modalConfig.groupId && modalConfig.blockId) {
      // Unwrap data if it comes wrapped from modal
      const actualData = data?.data || data;
      updateBlock(modalConfig.groupId, modalConfig.blockId, actualData);
    }
    setModalConfig({ open: false, type: null, mode: 'create' });
  }, [modalConfig.groupId, modalConfig.blockId, updateBlock]);

  const handleModalClose = useCallback(() => {
    // If creating and cancelled, remove the block/group
    if (modalConfig.mode === 'create' && modalConfig.groupId && modalConfig.blockId) {
      deleteBlock(modalConfig.groupId, modalConfig.blockId);
    }
    setModalConfig({ open: false, type: null, mode: 'create' });
  }, [modalConfig.mode, modalConfig.groupId, modalConfig.blockId, deleteBlock]);

  const handleModalUpdate = useCallback((updatedData: any) => {
    console.log('=== MODAL UPDATE ===', { groupId: modalConfig.groupId, blockId: modalConfig.blockId, updatedData });
    if (modalConfig.groupId && modalConfig.blockId) {
      // Unwrap data if it comes wrapped from modal (modal sends { data: { ... } })
      const actualData = updatedData?.data || updatedData;
      console.log('=== ACTUAL DATA TO SAVE ===', actualData);
      updateBlock(modalConfig.groupId, modalConfig.blockId, actualData);
    }
    setModalConfig({ open: false, type: null, mode: 'create' });
  }, [modalConfig.groupId, modalConfig.blockId, updateBlock]);

  // Sanitize edges - remove edges pointing to non-existent groups
  const sanitizeEdges = useCallback((currentEdges: Edge[], currentGroups: FlowGroup[], currentHasStartNode: boolean): Edge[] => {
    const validNodeIds = new Set<string>();
    
    // Add start node if exists
    if (currentHasStartNode) {
      validNodeIds.add('start-node');
    }
    
    // Add all group IDs
    currentGroups.forEach(g => validNodeIds.add(g.id));
    
    // Also add all block IDs as potential sources/targets
    currentGroups.forEach(g => {
      g.blocks.forEach(b => validNodeIds.add(b.id));
    });
    
    const sanitized = currentEdges.filter(edge => {
      const sourceExists = validNodeIds.has(edge.source);
      const targetExists = validNodeIds.has(edge.target);
      
      if (!sourceExists || !targetExists) {
        console.log('[Sanitize] Removendo edge órfã:', {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceExists,
          targetExists
        });
        return false;
      }
      return true;
    });
    
    if (sanitized.length !== currentEdges.length) {
      console.log(`[Sanitize] Removidas ${currentEdges.length - sanitized.length} edges órfãs`);
    }
    
    return sanitized;
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    const groupNodes = convertToNodes();
    const groupsData = getGroupsForSave();

    // Incluir o nó de início se existir
    const nodes = hasStartNode 
      ? [
          {
            id: 'start-node',
            type: 'startNode',
            position: startNodePosition,
            data: { type: 'start' }
          },
          ...groupNodes
        ]
      : groupNodes;

    // Sanitize edges before saving
    const sanitizedEdges = sanitizeEdges(edges, groupsData, hasStartNode);

    console.log('=== SALVANDO FLUXO ===');
    console.log('Groups:', groupsData);
    console.log('Nodes:', nodes);
    console.log('Edges originais:', edges.length, '-> Sanitizadas:', sanitizedEdges.length);
    console.log('Has Start Node:', hasStartNode);

    if (groupsData.length === 0 && !hasStartNode) {
      toast({
        title: 'Aviso',
        description: 'Nenhum bloco para salvar',
        variant: 'default'
      });
      return;
    }

    // Update local edges state if any were removed
    if (sanitizedEdges.length !== edges.length) {
      setEdges(sanitizedEdges);
    }

    onSave(nodes, sanitizedEdges, groupsData);
  }, [convertToNodes, getGroupsForSave, edges, onSave, toast, hasStartNode, startNodePosition, sanitizeEdges, setEdges]);

  // Refs para capturar sempre os valores mais recentes no auto-save
  const hasStartNodeRef = useRef(hasStartNode);
  const startNodePositionRef = useRef(startNodePosition);
  const groupsRef = useRef(groups);
  const edgesRef = useRef(edges);

  // Manter refs sempre atualizadas
  useEffect(() => {
    hasStartNodeRef.current = hasStartNode;
  }, [hasStartNode]);

  useEffect(() => {
    startNodePositionRef.current = startNodePosition;
  }, [startNodePosition]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Auto-save with debounce - usando refs para valores atualizados
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  
  const performAutoSave = useCallback(() => {
    if (isSavingRef.current || !onAutoSave) return;
    
    const currentHasStartNode = hasStartNodeRef.current;
    const currentStartPosition = startNodePositionRef.current;
    const currentGroups = groupsRef.current;
    const currentEdges = edgesRef.current;
    
    if (currentGroups.length === 0 && !currentHasStartNode) return;
    
    isSavingRef.current = true;
    
    // Sanitize edges inline (same logic as sanitizeEdges)
    const validNodeIds = new Set<string>();
    if (currentHasStartNode) validNodeIds.add('start-node');
    currentGroups.forEach(g => {
      validNodeIds.add(g.id);
      g.blocks.forEach(b => validNodeIds.add(b.id));
    });
    const sanitizedEdges = currentEdges.filter(edge => 
      validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
    );
    
    const groupNodes = currentGroups.flatMap(group => 
      group.blocks.map((block, index) => ({
        id: block.id,
        type: 'customNode',
        position: {
          x: group.position.x,
          y: group.position.y + (index * 100)
        },
        data: {
          ...block.data,
          type: block.type,
          label: block.data?.label || block.type
        }
      }))
    );
    
    // Incluir o nó de início se existir
    const nodes = currentHasStartNode 
      ? [
          {
            id: 'start-node',
            type: 'startNode',
            position: currentStartPosition,
            data: { type: 'start' }
          },
          ...groupNodes
        ]
      : groupNodes;
    
    console.log('=== AUTO-SAVE ===', {
      hasStartNode: currentHasStartNode,
      nodesCount: nodes.length,
      groupsCount: currentGroups.length,
      edgesOriginal: currentEdges.length,
      edgesSanitized: sanitizedEdges.length
    });
    
    onAutoSave(nodes, sanitizedEdges, currentGroups);
    
    // Pequeno delay antes de permitir outro save
    setTimeout(() => {
      isSavingRef.current = false;
    }, 500);
  }, [onAutoSave]);
  
  useEffect(() => {
    if (!onAutoSave) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(performAutoSave, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [groups, edges, hasStartNode, startNodePosition, performAutoSave]);

  // Handle pane click to track last click position
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setLastClickPosition(position);
    }
  }, [reactFlowInstance]);

  // Keyboard shortcuts: ESC, Ctrl+C, Ctrl+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - exit maximized
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
        return;
      }
      
      // Don't handle shortcuts if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      // Ctrl+C - Copy selected group
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selectedNode = flowNodes.find(n => n.selected && n.type === 'flowGroup');
        if (selectedNode) {
          const group = groups.find(g => g.id === selectedNode.id);
          if (group) {
            setCopiedGroup(group);
          }
        }
      }
      
      // Ctrl+V - Paste group at last click position
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedGroup) {
        e.preventDefault();
        copyGroupAtPosition(copiedGroup, lastClickPosition);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized, flowNodes, groups, copiedGroup, lastClickPosition, copyGroupAtPosition, toast]);

  return (
    <GlobalDndContext
      groups={groups}
      onBlockMove={handleBlockMove}
      onBlockReorder={handleBlockReorder}
      screenToFlowPosition={screenToFlowPosition}
    >
      <div
        className={cn(
          "flex gap-0 transition-all duration-300 h-screen w-full overflow-hidden",
          isMaximized && "fixed inset-0 z-50 bg-white p-4"
        )}
        ref={reactFlowWrapper}
      >
        <NodeDragPanel onNodeClick={handleNodeClick} hasStartNode={hasStartNode} />

        <div className="flex-1 relative rounded-r-xl overflow-hidden border border-gray-200 bg-white">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-white"
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#94a3b8',
              },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls className="!bg-white !border-gray-200 [&>button]:!bg-white [&>button]:!border-gray-200 [&>button]:!text-gray-600 [&>button:hover]:!bg-gray-100" />
            <MiniMap
              className="!bg-gray-50 !border-gray-200"
              nodeColor={() => '#3b82f6'}
              maskColor="rgba(255,255,255,0.8)"
            />
            <Panel position="top-right" className="flex items-stretch bg-background p-1.5 rounded-lg gap-1 border shadow-sm">
              {onBack && (
                <>
                  <Button
                    onClick={onBack}
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="w-px bg-border -my-1.5 mx-1" />
                </>
              )}
              {onOpenVariables && (
                <>
                  <Button
                    onClick={onOpenVariables}
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    aria-label="Variáveis"
                  >
                    <Braces className="w-4 h-4" />
                  </Button>
                  <div className="w-px bg-border -my-1.5 mx-1" />
                </>
              )}
              <Button
                onClick={handleSave}
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                aria-label="Salvar"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsMaximized(!isMaximized)}
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                aria-label={isMaximized ? "Minimizar" : "Maximizar"}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </Panel>
          </ReactFlow>

          {/* Empty state */}
          {groups.length === 0 && !hasStartNode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Arraste um bloco para começar</p>
                <p className="text-sm">Ou clique em um tipo de bloco no painel lateral</p>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <FlowBuilderTextModal
          open={modalConfig.open && modalConfig.type === 'text'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderMenuModal
          open={modalConfig.open && modalConfig.type === 'menu'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderButtonsModal
          open={modalConfig.open && modalConfig.type === 'buttons'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderQuestionModal
          open={modalConfig.open && modalConfig.type === 'question'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderConditionModalV2
          open={modalConfig.open && modalConfig.type === 'condition'}
          onClose={() => setModalConfig({ open: false, type: null, mode: 'create' })}
          onCancel={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderTicketModal
          open={modalConfig.open && modalConfig.type === 'ticket'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderTypebotModal
          open={modalConfig.open && modalConfig.type === 'typebot'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderOpenAIModal
          open={modalConfig.open && modalConfig.type === 'openai'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderRandomizerModal
          open={modalConfig.open && modalConfig.type === 'randomizer'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderIntervalModal
          open={modalConfig.open && modalConfig.type === 'interval'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderLocationModal
          open={modalConfig.open && modalConfig.type === 'location'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderTagsModal
          open={modalConfig.open && modalConfig.type === 'tags'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderHTTPRequestModal
          open={modalConfig.open && modalConfig.type === 'httpRequest'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
          flowId={flowId}
        />
        <FlowBuilderJumpModal
          open={modalConfig.open && modalConfig.type === 'jump'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
          groups={groups}
          currentGroupId={modalConfig.groupId}
        />
        <FlowBuilderDocumentModal
          open={modalConfig.open && modalConfig.type === 'document'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderConvertBase64Modal
          open={modalConfig.open && modalConfig.type === 'convertBase64'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderLoopModal
          open={modalConfig.open && modalConfig.type === 'loop'}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onUpdate={handleModalUpdate}
          data={modalConfig.data ? { data: modalConfig.data } : undefined}
          mode={modalConfig.mode}
        />
        <FlowBuilderJavaScriptModal
          open={modalConfig.open && modalConfig.type === 'javascript'}
          onClose={handleModalClose}
          initialData={modalConfig.data}
          onSave={handleModalSave}
        />
      </div>
    </GlobalDndContext>
  );
};

export const FlowBuilderGroupEditor: React.FC<FlowBuilderGroupEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowBuilderGroupEditorInner {...props} />
    </ReactFlowProvider>
  );
};
