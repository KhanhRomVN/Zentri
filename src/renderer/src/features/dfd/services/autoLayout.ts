import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled';
import type { DfdNode, DfdFlow, DfdLevel } from '../types';

const elk = new ELK();

/**
 * Auto-layout configuration for DFD diagrams
 * - Process nodes in the center
 * - Entity and Store nodes distributed around processes
 */
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.spacing.edgeNode': '40',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
};

interface LayoutResult {
  nodes: DfdNode[];
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Calculate node dimensions based on type
 */
function getNodeDimensions(node: DfdNode): { width: number; height: number } {
  if (node.type === 'process') {
    const r = node.r ?? 80;
    return { width: r * 2, height: r * 2 };
  }
  if (node.type === 'entity') {
    return { width: node.w ?? 140, height: node.h ?? 70 };
  }
  // store
  return { width: node.w ?? 180, height: node.h ?? 52 };
}

/**
 * Assign partition/layer based on node type to control placement
 * - Processes: central layers (partition 1)
 * - Entities: left side (partition 0)
 * - Stores: right side (partition 2)
 */
function getNodePartition(node: DfdNode, flows: DfdFlow[]): number {
  if (node.type === 'process') return 1;

  // Check if entity/store is source (left) or target (right)
  const isSource = flows.some((f) => f.from === node.id);
  const isTarget = flows.some((f) => f.to === node.id);

  if (node.type === 'entity') {
    // Entities typically on the left (sources)
    return isSource && !isTarget ? 0 : 2;
  }

  // Stores typically on the right (targets) or both sides
  return isTarget && !isSource ? 2 : 0;
}

/**
 * Convert DfdLevel to ELK graph format
 */
function toElkGraph(level: DfdLevel): ElkNode {
  const elkNodes: ElkNode[] = level.nodes.map((node) => {
    const { width, height } = getNodeDimensions(node);
    const partition = getNodePartition(node, level.flows);

    return {
      id: node.id,
      width,
      height,
      // Assign partition to control layer placement
      layoutOptions: {
        'elk.partitioning.partition': partition.toString(),
      },
    };
  });

  const elkEdges: ElkExtendedEdge[] = level.flows.map((flow) => ({
    id: flow.id,
    sources: [flow.from],
    targets: [flow.to],
  }));

  return {
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  };
}

/**
 * Convert ELK result back to DfdNode positions
 */
function fromElkGraph(elkResult: ElkNode, originalNodes: DfdNode[]): DfdNode[] {
  const positionMap = new Map<string, { x: number; y: number }>();

  elkResult.children?.forEach((elkNode) => {
    if (elkNode.x !== undefined && elkNode.y !== undefined) {
      positionMap.set(elkNode.id, { x: elkNode.x, y: elkNode.y });
    }
  });

  return originalNodes.map((node) => {
    const pos = positionMap.get(node.id);
    if (!pos) return node;

    if (node.type === 'process') {
      const r = node.r ?? 80;
      return {
        ...node,
        cx: pos.x + r,
        cy: pos.y + r,
      };
    }

    return {
      ...node,
      x: pos.x,
      y: pos.y,
    };
  });
}

/**
 * Auto-layout DFD level using ELK algorithm
 */
export async function autoLayoutDfd(level: DfdLevel): Promise<LayoutResult> {
  if (level.nodes.length === 0) {
    return { nodes: [], canvasWidth: 860, canvasHeight: 520 };
  }

  try {
    const elkGraph = toElkGraph(level);
    const layoutedGraph = await elk.layout(elkGraph);

    const nodes = fromElkGraph(layoutedGraph, level.nodes);

    // Calculate canvas size with padding
    const padding = 100;
    const canvasWidth = (layoutedGraph.width ?? 860) + padding * 2;
    const canvasHeight = (layoutedGraph.height ?? 520) + padding * 2;

    // Add padding offset to all nodes
    const adjustedNodes = nodes.map((node) => {
      if (node.type === 'process') {
        return {
          ...node,
          cx: (node.cx ?? 0) + padding,
          cy: (node.cy ?? 0) + padding,
        };
      }
      return {
        ...node,
        x: (node.x ?? 0) + padding,
        y: (node.y ?? 0) + padding,
      };
    });

    return {
      nodes: adjustedNodes,
      canvasWidth,
      canvasHeight,
    };
  } catch (error) {
    console.error('ELK layout failed:', error);
    // Fallback to original positions
    return {
      nodes: level.nodes,
      canvasWidth: level.canvas.w,
      canvasHeight: level.canvas.h,
    };
  }
}

/**
 * Check if level needs auto-layout (has undefined positions)
 */
export function needsAutoLayout(level: DfdLevel): boolean {
  return level.nodes.some((node) => {
    if (node.type === 'process') {
      return node.cx === undefined || node.cy === undefined;
    }
    return node.x === undefined || node.y === undefined;
  });
}
