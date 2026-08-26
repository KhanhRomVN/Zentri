import { useCallback, useRef } from 'react';
import type { WorkflowNode, NodeConnection } from '../../../types';

interface Snapshot {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

export const useWorkflowHistory = (
  currentNodes: WorkflowNode[],
  currentConnections: NodeConnection[],
  syncToWorkflow: (nodes: WorkflowNode[], connections: NodeConnection[]) => void,
) => {
  const historyRef = useRef<Snapshot[]>([]);
  const redoRef = useRef<Snapshot[]>([]);

  const pushHistory = useCallback(() => {
    historyRef.current.push(
      JSON.parse(JSON.stringify({ nodes: currentNodes, connections: currentConnections })),
    );
    if (historyRef.current.length > 50) historyRef.current.shift();
    redoRef.current = [];
  }, [currentNodes, currentConnections]);

  const undo = useCallback(() => {
    const snap = historyRef.current.pop();
    if (!snap) return;
    redoRef.current.push(
      JSON.parse(JSON.stringify({ nodes: currentNodes, connections: currentConnections })),
    );
    syncToWorkflow(snap.nodes, snap.connections);
  }, [currentNodes, currentConnections, syncToWorkflow]);

  const redo = useCallback(() => {
    const snap = redoRef.current.pop();
    if (!snap) return;
    historyRef.current.push(
      JSON.parse(JSON.stringify({ nodes: currentNodes, connections: currentConnections })),
    );
    syncToWorkflow(snap.nodes, snap.connections);
  }, [currentNodes, currentConnections, syncToWorkflow]);

  return { pushHistory, undo, redo };
};