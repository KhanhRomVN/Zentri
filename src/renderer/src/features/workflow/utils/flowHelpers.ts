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
    const count = sourceHandleCounts.get(key) || 0;
    const isInvalid = count > 1;
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

/**
 * Check if a node is properly configured
 * A node is considered configured if it has non-empty title or note (config data)
 */
export function isNodeConfigured(node: WorkflowNode): boolean {
  // Start node is always valid
  if (node.type === 'start' || node.id === 'start') {
    return true;
  }

  // Note type nodes don't need configuration
  if (node.type === 'note') {
    return true;
  }

  // Check if node has configuration data
  // A node is configured if it has:
  // 1. A title (user-provided label or action name)
  // 2. Or a note field with JSON config data
  const hasTitle = !!(node.title && node.title.trim().length > 0);
  const hasConfig = !!(node.note && node.note.trim().length > 0);

  return hasTitle || hasConfig;
}

/**
 * Validate entire workflow diagram
 * Returns an object with validation status and error details
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: NodeConnection[],
): {
  isValid: boolean;
  errors: {
    unconfiguredNodes: string[]; // IDs of nodes missing configuration
    duplicateEdges: string[]; // IDs of invalid duplicate edges
  };
} {
  const errors = {
    unconfiguredNodes: [] as string[],
    duplicateEdges: [] as string[],
  };

  // Check for unconfigured nodes
  nodes.forEach((node) => {
    if (!isNodeConfigured(node)) {
      errors.unconfiguredNodes.push(node.id);
    }
  });

  // Check for duplicate/invalid edges
  const invalidEdges = validateEdges(connections);
  errors.duplicateEdges = Array.from(invalidEdges.keys());

  const isValid = errors.unconfiguredNodes.length === 0 && errors.duplicateEdges.length === 0;

  return { isValid, errors };
}
