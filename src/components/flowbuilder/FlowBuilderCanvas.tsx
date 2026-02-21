import React, { useCallback, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import { FlowGroup, FlowBlock, getColorForType } from '@/types/flowbuilder';
import { StartNode } from './StartNode';
import { FlowGroupCard } from './FlowGroupCard';
import { NodeDragPanel } from './NodeDragPanel';
import { BlockEditorModal } from './BlockEditorModal';

interface FlowBuilderCanvasProps {
  initialNodes?: any[];
  initialEdges?: any[];
  onSave?: (nodes: any[], edges: any[]) => void;
  onAutoSave?: (nodes: any[], edges: any[]) => void;
}

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  groupCard: FlowGroupCard,
};

export const FlowBuilderCanvas: React.FC<FlowBuilderCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onAutoSave,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [groupCounter, setGroupCounter] = useState(1);
  
  // Modal state
  const [editingBlock, setEditingBlock] = useState<{
    groupId: string;
    blockId: string;
    block: FlowBlock;
  } | null>(null);

  // Convert initial data to nodes
  const convertToNodes = useCallback((groups: FlowGroup[], hasStart: boolean): Node[] => {
    const nodes: Node[] = [];
    
    if (hasStart) {
      nodes.push({
        id: 'start-node',
        type: 'startNode',
        position: { x: 50, y: 200 },
        data: {},
        deletable: false,
      });
    }

    groups.forEach((group) => {
      nodes.push({
        id: group.id,
        type: 'groupCard',
        position: group.position,
        data: {
          group,
          onAddBlock: handleAddBlock,
          onUpdateBlock: handleUpdateBlock,
          onDeleteBlock: handleDeleteBlock,
          onReorderBlocks: handleReorderBlocks,
          onUpdateTitle: handleUpdateTitle,
          onCopyGroup: handleCopyGroup,
          onDeleteGroup: handleDeleteGroup,
          onEditBlock: handleEditBlock,
        },
      });
    });

    return nodes;
  }, []);

  // Parse initial nodes to extract groups
  const parseInitialData = useCallback(() => {
    const groups: FlowGroup[] = [];
    let hasStart = false;
    let counter = 1;

    initialNodes.forEach((node) => {
      if (node.type === 'startNode' || node.data?.type === 'start') {
        hasStart = true;
      } else if (node.type === 'groupCard') {
        groups.push(node.data.group);
        const match = node.data.group.title.match(/Group #(\d+)/);
        if (match) counter = Math.max(counter, parseInt(match[1]) + 1);
      } else if (node.data?.type) {
        // Legacy node - convert to group
        const groupId = `group-${nanoid()}`;
        groups.push({
          id: groupId,
          title: `Group #${counter}`,
          position: node.position,
          blocks: [{
            id: `block-${nanoid()}`,
            type: node.data.type,
            order: 1,
            data: node.data,
          }],
          color: getColorForType(node.data.type),
        });
        counter++;
      }
    });

    return { groups, hasStart, counter };
  }, [initialNodes]);

  const { groups: initialGroups, hasStart: initialHasStart, counter: initialCounter } = useMemo(
    () => parseInitialData(),
    [parseInitialData]
  );

  const [groups, setGroups] = useState<FlowGroup[]>(initialGroups);
  const [hasStartNode, setHasStartNode] = useState(initialHasStart);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    convertToNodes(initialGroups, initialHasStart)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when groups change
  const updateNodes = useCallback((newGroups: FlowGroup[], hasStart: boolean) => {
    setNodes(convertToNodes(newGroups, hasStart));
  }, [convertToNodes, setNodes]);

  // Handlers
  const handleAddBlock = useCallback((groupId: string, type: string) => {
    setGroups((prev) => {
      const newGroups = prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            blocks: [
              ...g.blocks,
              {
                id: `block-${nanoid()}`,
                type: type as FlowBlock['type'],
                order: g.blocks.length + 1,
                data: {},
              },
            ],
          };
        }
        return g;
      });
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleUpdateBlock = useCallback((groupId: string, blockId: string, data: any) => {
    setGroups((prev) => {
      const newGroups = prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            blocks: g.blocks.map((b) =>
              b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b
            ),
          };
        }
        return g;
      });
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleDeleteBlock = useCallback((groupId: string, blockId: string) => {
    setGroups((prev) => {
      const newGroups = prev
        .map((g) => {
          if (g.id === groupId) {
            const remaining = g.blocks
              .filter((b) => b.id !== blockId)
              .map((b, i) => ({ ...b, order: i + 1 }));
            return { ...g, blocks: remaining };
          }
          return g;
        })
        .filter((g) => g.blocks.length > 0);
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleReorderBlocks = useCallback((groupId: string, blocks: FlowBlock[]) => {
    setGroups((prev) => {
      const newGroups = prev.map((g) =>
        g.id === groupId ? { ...g, blocks } : g
      );
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleUpdateTitle = useCallback((groupId: string, title: string) => {
    setGroups((prev) => {
      const newGroups = prev.map((g) =>
        g.id === groupId ? { ...g, title } : g
      );
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleCopyGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const group = prev.find((g) => g.id === groupId);
      if (!group) return prev;
      
      const newGroup: FlowGroup = {
        ...group,
        id: `group-${nanoid()}`,
        title: `${group.title} (Cópia)`,
        position: { x: group.position.x + 50, y: group.position.y + 50 },
        blocks: group.blocks.map((b) => ({ ...b, id: `block-${nanoid()}` })),
      };
      
      const newGroups = [...prev, newGroup];
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
  }, [hasStartNode, updateNodes]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const newGroups = prev.filter((g) => g.id !== groupId);
      updateNodes(newGroups, hasStartNode);
      return newGroups;
    });
    setEdges((prev) => prev.filter((e) => e.source !== groupId && e.target !== groupId));
  }, [hasStartNode, updateNodes, setEdges]);

  const handleEditBlock = useCallback((groupId: string, blockId: string, block: FlowBlock) => {
    setEditingBlock({ groupId, blockId, block });
  }, []);

  const handleSaveBlock = useCallback((data: any) => {
    if (editingBlock) {
      handleUpdateBlock(editingBlock.groupId, editingBlock.blockId, data);
      setEditingBlock(null);
    }
  }, [editingBlock, handleUpdateBlock]);

  // Connection handler
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds));
  }, [setEdges]);

  // Node position change handler
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Update group positions
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === change.id ? { ...g, position: change.position! } : g
          )
        );
      }
    });
  }, [onNodesChange]);

  // Drop handler
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      if (type === 'start') {
        if (hasStartNode) return;
        setHasStartNode(true);
        setNodes((nds) => [
          ...nds,
          {
            id: 'start-node',
            type: 'startNode',
            position,
            data: {},
            deletable: false,
          },
        ]);
      } else {
        const newGroup: FlowGroup = {
          id: `group-${nanoid()}`,
          title: `Group #${groupCounter}`,
          position,
          blocks: [{
            id: `block-${nanoid()}`,
            type: type as FlowBlock['type'],
            order: 1,
            data: {},
          }],
          color: getColorForType(type),
        };

        setGroups((prev) => {
          const newGroups = [...prev, newGroup];
          updateNodes(newGroups, hasStartNode);
          return newGroups;
        });
        setGroupCounter((c) => c + 1);
      }
    },
    [reactFlowInstance, hasStartNode, groupCounter, updateNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Click to add node
  const handleNodeClick = useCallback((type: string) => {
    if (type === 'start') {
      if (hasStartNode) return;
      setHasStartNode(true);
      setNodes((nds) => [
        ...nds,
        {
          id: 'start-node',
          type: 'startNode',
          position: { x: 100, y: 200 },
          data: {},
          deletable: false,
        },
      ]);
    } else {
      const newGroup: FlowGroup = {
        id: `group-${nanoid()}`,
        title: `Group #${groupCounter}`,
        position: { x: 300 + (groups.length * 50), y: 200 },
        blocks: [{
          id: `block-${nanoid()}`,
          type: type as FlowBlock['type'],
          order: 1,
          data: {},
        }],
        color: getColorForType(type),
      };

      setGroups((prev) => {
        const newGroups = [...prev, newGroup];
        updateNodes(newGroups, hasStartNode);
        return newGroups;
      });
      setGroupCounter((c) => c + 1);
    }
  }, [hasStartNode, groupCounter, groups.length, updateNodes]);

  return (
    <div className="flex h-[600px] bg-white rounded-lg overflow-hidden border border-gray-200">
      <NodeDragPanel 
        onNodeClick={handleNodeClick} 
        hasStartNode={hasStartNode}
      />
      
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-white"
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background color="#e5e7eb" gap={20} size={1} />
          <Controls className="bg-white border border-gray-200 rounded-lg" />
        </ReactFlow>
      </div>

      {editingBlock && (
        <BlockEditorModal
          open={!!editingBlock}
          onClose={() => setEditingBlock(null)}
          block={editingBlock.block}
          onSave={handleSaveBlock}
        />
      )}
    </div>
  );
};
