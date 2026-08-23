import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNode, NodeConnection } from '../types';

/**
 * Convert WorkflowNode to ReactFlow Node
 */
export function toFlowNode(node: WorkflowNode, handlers: any): Node {
  return {
    id: node.id,
    type: 'workflowNode',
    position: { x: node.x, y: node.y },
    data: { ...node, ...handlers } as unknown as Record<string, unknown>,
    draggable: !node.locked,
  };
}

/**
 * Convert NodeConnection to ReactFlow Edge
 */
export function toFlowEdge(conn: NodeConnection): Edge {
  return {
    id: conn.id,
    source: conn.from,
    target: conn.to,
    sourceHandle: conn.fromSide,
    targetHandle: conn.toSide,
    label: conn.label,
    type: 'smoothstep',
    style: { stroke: conn.color || 'rgb(var(--primary))', strokeWidth: 2 },
    markerEnd: {
      type: 'arrowclosed',
      color: conn.color || 'rgb(var(--primary))',
    },
    animated: false,
  };
}

/**
 * Validate edges to detect invalid connections (one source connecting to multiple targets)
 */
export function validateEdges(connections: NodeConnection[]): Map<string, boolean> {
  const sourceHandleCounts = new Map<string, number>();

  connections.forEach((conn) => {
    const key = `${conn.from}-${conn.fromSide}`;
    sourceHandleCounts.set(key, (sourceHandleCounts.get(key) || 0) + 1);
  });

  const invalidEdges = new Map<string, boolean>();
  connections.forEach((conn) => {
    const key = `${conn.from}-${conn.fromSide}`;
    const isInvalid = (sourceHandleCounts.get(key) || 0) > 1;
    if (isInvalid) {
      invalidEdges.set(conn.id, true);
    }
  });

  return invalidEdges;
}

/**
 * Get nodes with incoming/outgoing connections
 */
export function getConnectionSets(connections: NodeConnection[]): {
  nodesWithIncoming: Set<string>;
  nodesWithOutgoing: Set<string>;
} {
  const nodesWithIncoming = new Set<string>();
  const nodesWithOutgoing = new Set<string>();

  connections.forEach((conn) => {
    nodesWithOutgoing.add(conn.from);
    nodesWithIncoming.add(conn.to);
  });

  return { nodesWithIncoming, nodesWithOutgoing };
}
