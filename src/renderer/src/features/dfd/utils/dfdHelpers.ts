import type { Node, Edge } from '@xyflow/react';
import type { DfdNode, DfdFlow } from '../types';

/**
 * Convert DfdNode to ReactFlow Node
 */
export function toFlowNode(node: DfdNode, handlers: Record<string, unknown>): Node {
  const base = {
    data: { ...node, ...handlers } as unknown as Record<string, unknown>,
    draggable: true,
  };

  if (node.type === 'process') {
    const r = node.r ?? 80;
    return {
      id: node.id,
      type: 'dfdProcess',
      position: { x: (node.cx ?? 0) - r, y: (node.cy ?? 0) - r },
      ...base,
    };
  }

  if (node.type === 'entity') {
    return {
      id: node.id,
      type: 'dfdEntity',
      position: { x: node.x ?? 0, y: node.y ?? 0 },
      ...base,
    };
  }

  return {
    id: node.id,
    type: 'dfdStore',
    position: { x: node.x ?? 0, y: node.y ?? 0 },
    ...base,
  };
}

/**
 * Convert DfdFlow to ReactFlow Edge
 */
export function toFlowEdge(flow: DfdFlow, handlers: Record<string, unknown>): Edge {
  return {
    id: flow.id,
    source: flow.from,
    target: flow.to,
    type: 'dfdFlow',
    data: { ...flow, ...handlers } as unknown as Record<string, unknown>,
    selectable: true,
  };
}

/**
 * Build breadcrumb chain from current level to root
 */
export function buildLevelChain(
  levels: Record<string, import('../types').DfdLevel>,
  startLevelId: string,
): { id: string; code: string; title: string }[] {
  const chain: { id: string; code: string; title: string }[] = [];
  let current = levels[startLevelId];

  if (current) {
    chain.unshift({ id: startLevelId, code: current.code, title: current.title });
    while (current.parent) {
      const parentLevelId = current.parent.level;
      current = levels[parentLevelId];
      if (current) {
        chain.unshift({ id: parentLevelId, code: current.code, title: current.title });
      } else {
        break;
      }
    }
  }

  return chain;
}
