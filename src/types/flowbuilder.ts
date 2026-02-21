// Types for the new FlowBuilder group/card system

import type { FlowBlockData } from './flowbuilder-blocks';

export type FlowBlockType = 
  | 'text' 
  | 'menu' 
  | 'question' 
  | 'condition' 
  | 'ticket' 
  | 'tags' 
  | 'typebot' 
  | 'openai' 
  | 'randomizer' 
  | 'interval' 
  | 'location' 
  | 'setVariable' 
  | 'webhook' 
  | 'httpRequest' 
  | 'buttons' 
  | 'jump' 
  | 'document' 
  | 'convertBase64' 
  | 'loop' 
  | 'javascript';

export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  order: number;
  data: FlowBlockData;
  hasOutput?: boolean;
}

export interface FlowGroup {
  id: string;
  title: string;
  position: { x: number; y: number };
  blocks: FlowBlock[];
  color: 'orange' | 'blue' | 'purple' | 'green' | 'pink' | 'amber' | 'cyan' | 'indigo' | 'violet' | 'slate' | 'emerald';
}

export interface FlowData {
  groups: FlowGroup[];
  edges: any[];
}

// Legacy support
export interface LegacyFlowData {
  nodes: any[];
  edges: any[];
}

// Color mapping for block types
export const blockTypeColors: Record<string, FlowGroup['color']> = {
  text: 'blue',
  menu: 'purple',
  question: 'cyan',
  condition: 'violet',
  ticket: 'orange',
  tags: 'emerald',
  typebot: 'indigo',
  openai: 'violet',
  randomizer: 'pink',
  interval: 'slate',
  location: 'green',
  setVariable: 'blue',
  webhook: 'orange',
  httpRequest: 'pink',
  buttons: 'cyan',
  jump: 'amber',
  document: 'blue',
  convertBase64: 'emerald',
  loop: 'indigo',
  javascript: 'amber'
};

// Get color for a block type
export const getColorForType = (type: string): FlowGroup['color'] => {
  return blockTypeColors[type] || 'blue';
};

// Convert legacy flow data to new group format
export const convertLegacyFlowData = (oldData: LegacyFlowData): FlowData => {
  const groups: FlowGroup[] = oldData.nodes
    .filter(n => n.data?.type !== 'start')
    .map(node => ({
      id: node.id,
      title: node.data?.label || 'Grupo',
      position: node.position,
      blocks: [{
        id: `block-${node.id}`,
        type: node.data?.type,
        order: 1,
        data: node.data
      }],
      color: getColorForType(node.data?.type)
    }));

  return { groups, edges: oldData.edges };
};
