import { useState, useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { FlowGroup, FlowBlock, getColorForType, LegacyFlowData } from '@/types/flowbuilder';
import { Edge } from 'reactflow';

interface ExtendedFlowData extends LegacyFlowData {
  groups?: FlowGroup[];
}

const convertLegacyToGroups = (nodes: any[]): FlowGroup[] => {
  if (!nodes || nodes.length === 0) return [];
  const validNodes = nodes.filter(n => n.data?.type !== 'start');
  let groupCounter = 1;
  return validNodes.map(node => ({
    id: node.id || `group-${nanoid()}`,
    title: node.data?.label || `Group #${groupCounter++}`,
    position: node.position || { x: 100, y: 100 },
    blocks: [{
      id: node.data?.blockId || `block-${nanoid()}`,
      type: node.data?.type || 'text',
      order: 1,
      data: node.data || {}
    }],
    color: getColorForType(node.data?.type || 'text')
  }));
};

export const useFlowGroups = (initialData?: ExtendedFlowData) => {
  const [groups, setGroups] = useState<FlowGroup[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const initializedRef = useRef(false);

  // Initialize state only once when initialData has content
  useEffect(() => {
    if (initializedRef.current) return;
    
    const hasGroups = initialData?.groups && initialData.groups.length > 0;
    const hasNodes = initialData?.nodes && initialData.nodes.length > 0;
    const hasEdges = initialData?.edges && initialData.edges.length > 0;
    
    if (!hasGroups && !hasNodes && !hasEdges) return;

    console.log('=== INIT FLOW DATA ===', {
      groupsLength: initialData?.groups?.length || 0,
      nodesLength: initialData?.nodes?.length || 0,
      edgesLength: initialData?.edges?.length || 0
    });

    initializedRef.current = true;

    if (hasGroups) {
      setGroups(initialData.groups!);
    } else if (hasNodes) {
      setGroups(convertLegacyToGroups(initialData.nodes!));
    }

    if (hasEdges) {
      setEdges(initialData.edges!);
    }

    const allGroups = initialData?.groups || [];
    const maxNum = allGroups.reduce((max, g) => {
      const match = g.title?.match(/Group #(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    setGroupCounter(maxNum + 1);
  }, [initialData?.groups, initialData?.nodes, initialData?.edges]);

  const createGroup = useCallback((type: string, position: { x: number; y: number }) => {
    const newGroup: FlowGroup = {
      id: `group-${nanoid()}`,
      title: `Group #${groupCounter}`,
      position,
      blocks: [{
        id: `block-${nanoid()}`,
        type: type as FlowBlock['type'],
        order: 1,
        data: {}
      }],
      color: getColorForType(type)
    };
    
    setGroups(prev => [...prev, newGroup]);
    setGroupCounter(prev => prev + 1);
    return newGroup;
  }, [groupCounter]);

  // Add a block to an existing group (accepts optional blockId for modal sync)
  const addBlockToGroup = useCallback((groupId: string, type: string, data?: any, blockId?: string) => {
    const newBlockId = blockId || `block-${nanoid()}`;
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newBlock: FlowBlock = {
          id: newBlockId,
          type: type as FlowBlock['type'],
          order: group.blocks.length + 1,
          data: data || {}
        };
        return {
          ...group,
          blocks: [...group.blocks, newBlock]
        };
      }
      return group;
    }));
    return newBlockId;
  }, []);

  // Update a block in a group
  const updateBlock = useCallback((groupId: string, blockId: string, data: any) => {
    console.log('=== UPDATE BLOCK CALLED ===', { groupId, blockId, data });
    setGroups(prev => {
      const updated = prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            blocks: group.blocks.map(block => 
              block.id === blockId 
                ? { ...block, data: { ...block.data, ...data } }
                : block
            )
          };
        }
        return group;
      });
      console.log('=== GROUPS AFTER UPDATE ===', updated.find(g => g.id === groupId)?.blocks);
      return updated;
    });
  }, []);

  // Delete a block from a group
  const deleteBlock = useCallback((groupId: string, blockId: string) => {
    setGroups(prev => {
      const updatedGroups = prev.map(group => {
        if (group.id === groupId) {
          const remainingBlocks = group.blocks
            .filter(block => block.id !== blockId)
            .map((block, index) => ({ ...block, order: index + 1 }));
          
          return { ...group, blocks: remainingBlocks };
        }
        return group;
      });

      // Remove groups with no blocks
      return updatedGroups.filter(group => group.blocks.length > 0);
    });
  }, []);

  // Delete a group
  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
    setEdges(prev => prev.filter(edge => 
      edge.source !== groupId && edge.target !== groupId
    ));
  }, []);

  // Copy a group
  const copyGroup = useCallback((groupId: string) => {
    const groupToCopy = groups.find(g => g.id === groupId);
    if (!groupToCopy) return;

    const newGroup: FlowGroup = {
      ...groupToCopy,
      id: `group-${nanoid()}`,
      title: `${groupToCopy.title} (Cópia)`,
      position: {
        x: groupToCopy.position.x + 50,
        y: groupToCopy.position.y + 50
      },
      blocks: groupToCopy.blocks.map(block => ({
        ...block,
        id: `block-${nanoid()}`
      }))
    };

    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, [groups]);

  // Copy a group at a specific position
  const copyGroupAtPosition = useCallback((sourceGroup: FlowGroup, position: { x: number; y: number }) => {
    const newGroup: FlowGroup = {
      ...sourceGroup,
      id: `group-${nanoid()}`,
      title: `${sourceGroup.title} (Cópia)`,
      position,
      blocks: sourceGroup.blocks.map(block => ({
        ...block,
        id: `block-${nanoid()}`
      }))
    };

    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, []);

  // Update group title
  const updateGroupTitle = useCallback((groupId: string, title: string) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, title } : group
    ));
  }, []);

  // Reorder blocks within a group
  const reorderBlocks = useCallback((groupId: string, blocks: FlowBlock[]) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, blocks } : group
    ));
  }, []);

  // Move a block between groups
  const moveBlockBetweenGroups = useCallback((
    blockId: string,
    sourceGroupId: string,
    targetGroupId: string | null,
    newOrder: number,
    targetPosition?: { x: number; y: number }
  ) => {
    setGroups(prev => {
      const sourceGroup = prev.find(g => g.id === sourceGroupId);
      if (!sourceGroup) return prev;

      const blockToMove = sourceGroup.blocks.find(b => b.id === blockId);
      if (!blockToMove) return prev;

      // Remove o bloco do grupo de origem
      const groupsWithoutBlock = prev.map(group => {
        if (group.id === sourceGroupId) {
          const remainingBlocks = group.blocks
            .filter(b => b.id !== blockId)
            .map((b, i) => ({ ...b, order: i + 1 }));
          return { ...group, blocks: remainingBlocks };
        }
        return group;
      });

      let nextGroups = groupsWithoutBlock;

      if (targetGroupId) {
        // Move o bloco para um grupo existente
        nextGroups = groupsWithoutBlock.map(group => {
          if (group.id === targetGroupId) {
            const newBlocks = [...group.blocks];
            const insertIndex = Math.min(
              Math.max(newOrder - 1, 0),
              newBlocks.length
            );
            newBlocks.splice(insertIndex, 0, { ...blockToMove, order: newOrder });
            return {
              ...group,
              blocks: newBlocks.map((b, i) => ({ ...b, order: i + 1 }))
            };
          }
          return group;
        });
      } else if (targetPosition) {
        // Drop em área vazia: cria novo card com o bloco
        const newGroup: FlowGroup = {
          id: `group-${nanoid()}`,
          title: `Group #${groupCounter}`,
          position: targetPosition,
          blocks: [{ ...blockToMove, order: 1 }],
          color: getColorForType(blockToMove.type)
        };

        nextGroups = [...groupsWithoutBlock, newGroup];
      }

      // Remove grupos vazios
      return nextGroups.filter(g => g.blocks.length > 0);
    });

    if (!targetGroupId && targetPosition) {
      setGroupCounter(prev => prev + 1);
    }
  }, [groupCounter]);

  // Update group position
  const updateGroupPosition = useCallback((groupId: string, position: { x: number; y: number }) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, position } : group
    ));
  }, []);

  // Convert groups back to nodes for saving (legacy compatibility)
  const convertToNodes = useCallback(() => {
    return groups.flatMap(group => 
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
  }, [groups]);

  // Get groups for saving (new format)
  const getGroupsForSave = useCallback(() => {
    return groups;
  }, [groups]);

  return {
    groups,
    edges,
    setGroups,
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
  };
};
