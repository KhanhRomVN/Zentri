import { useCallback } from 'react';
import type { Workflow, WorkflowNode, NodeConnection } from '../types';
import { generateId } from '../utils';
import { findNodeItem } from '../constants';

interface UseNodeOperationsArgs {
  workflow: Workflow;
  currentNodes: WorkflowNode[];
  currentConnections: NodeConnection[];
  pushHistory: () => void;
  syncToWorkflow: (nodes: WorkflowNode[], connections: NodeConnection[]) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setCopiedNode: (node: WorkflowNode | null) => void;
  setRecordQueue: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  setEditModalOpen: (open: boolean) => void;
}

export const useNodeOperations = ({
  workflow,
  currentNodes,
  currentConnections,
  pushHistory,
  syncToWorkflow,
  selectedNodeId,
  setSelectedNodeId,
  setCopiedNode,
  setRecordQueue,
  setEditModalOpen,
}: UseNodeOperationsArgs) => {
  const addNodeAt = useCallback(
    (type: string, position: { x: number; y: number }, autoOpenModal = false) => {
      let nodeType = type;
      const item = findNodeItem(workflow.deviceType, type);
      if (!item) {
        nodeType = workflow.deviceType === 'website' ? 'click_web' : 'tap';
      }

      const finalItem = findNodeItem(workflow.deviceType, nodeType);
      if (!finalItem) return;

      const isPill = !!finalItem.pill;
      const w = isPill ? 136 : 208;
      const h = isPill ? 46 : 76;
      const newData: WorkflowNode = {
        id: generateId('n'),
        type: finalItem.type,
        category: finalItem.category,
        title: '',
        subtitle: '',
        note: '',
        x: Math.round(position.x - w / 2),
        y: Math.round(position.y - h / 2),
        w,
        h,
        pill: isPill,
        dual: finalItem.type === 'if' || finalItem.type === 'element_check',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      pushHistory();
      const updatedNodes = [...currentNodes, newData];
      syncToWorkflow(updatedNodes, currentConnections);
      setSelectedNodeId(newData.id);

      if (autoOpenModal) {
        setTimeout(() => setEditModalOpen(true), 100);
      }
    },
    [
      workflow.deviceType,
      pushHistory,
      currentNodes,
      currentConnections,
      syncToWorkflow,
      setSelectedNodeId,
      setEditModalOpen,
    ],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === 'start') return;
      pushHistory();
      const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
      const updatedConnections = currentConnections.filter(
        (e) => e.from !== nodeId && e.to !== nodeId,
      );
      syncToWorkflow(updatedNodes, updatedConnections);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [
      pushHistory,
      currentNodes,
      currentConnections,
      syncToWorkflow,
      selectedNodeId,
      setSelectedNodeId,
    ],
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;
      pushHistory();
      const copyData: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: generateId('n'),
        title: node.title ? `${node.title} (copy)` : '',
        x: node.x + 34,
        y: node.y + 34,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedNodes = [...currentNodes, copyData];
      syncToWorkflow(updatedNodes, currentConnections);
      setSelectedNodeId(copyData.id);
    },
    [currentNodes, currentConnections, pushHistory, syncToWorkflow, setSelectedNodeId],
  );

  const addNodeToQueue = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const queueNode: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: generateId('n'),
        x: 0,
        y: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRecordQueue((prev) => [...prev, queueNode]);

      pushHistory();
      const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
      const updatedConnections = currentConnections.filter(
        (e) => e.from !== nodeId && e.to !== nodeId,
      );
      syncToWorkflow(updatedNodes, updatedConnections);

      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [
      currentNodes,
      currentConnections,
      pushHistory,
      syncToWorkflow,
      selectedNodeId,
      setSelectedNodeId,
      setRecordQueue,
    ],
  );

  const updateNodeField = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode>) => {
      const updatedNodes = currentNodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
      );
      syncToWorkflow(updatedNodes, currentConnections);
    },
    [currentNodes, currentConnections, syncToWorkflow],
  );

  const toggleNodeLock = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;
      updateNodeField(nodeId, { locked: !node.locked });
    },
    [currentNodes, updateNodeField],
  );

  const clearNodeContent = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;
      const item = findNodeItem(workflow.deviceType, node.type);
      if (!item) return;
      updateNodeField(nodeId, {
        title: item.title,
        subtitle: item.subtitle || '',
        note: '',
      });
    },
    [currentNodes, workflow.deviceType, updateNodeField],
  );

  const copyNode = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;
      setCopiedNode(JSON.parse(JSON.stringify(node)));
    },
    [currentNodes, setCopiedNode],
  );

  const pasteNode = useCallback(
    (position: { x: number; y: number }, copiedNode: WorkflowNode | null) => {
      if (!copiedNode) return;
      pushHistory();
      const newNode: WorkflowNode = {
        ...JSON.parse(JSON.stringify(copiedNode)),
        id: generateId('n'),
        x: position.x - copiedNode.w / 2,
        y: position.y - copiedNode.h / 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedNodes = [...currentNodes, newNode];
      syncToWorkflow(updatedNodes, currentConnections);
      setSelectedNodeId(newNode.id);
    },
    [pushHistory, currentNodes, currentConnections, syncToWorkflow, setSelectedNodeId],
  );

  const addConnection = useCallback(
    (nodeId: string, direction: 'top' | 'right' | 'bottom' | 'left') => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const defaultType = workflow.deviceType === 'website' ? 'click_web' : 'tap';
      const item = findNodeItem(workflow.deviceType, defaultType);
      if (!item) return;

      const w = 208;
      const h = 76;
      let newX = node.x;
      let newY = node.y;

      if (direction === 'top') newY = node.y - h - 60;
      else if (direction === 'bottom') newY = node.y + node.h + 60;
      else if (direction === 'left') newX = node.x - w - 60;
      else if (direction === 'right') newX = node.x + node.w + 60;

      const newNodeData: WorkflowNode = {
        id: generateId('n'),
        type: item.type,
        category: item.category,
        title: '',
        subtitle: '',
        note: '',
        x: newX,
        y: newY,
        w,
        h,
        pill: false,
        dual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newConnection: NodeConnection = {
        id: generateId('c'),
        from: direction === 'top' || direction === 'left' ? newNodeData.id : nodeId,
        to: direction === 'top' || direction === 'left' ? nodeId : newNodeData.id,
        fromSide: 'out',
        toSide: 'in',
      };

      pushHistory();
      const updatedNodes = [...currentNodes, newNodeData];
      const updatedConnections = [...currentConnections, newConnection];
      syncToWorkflow(updatedNodes, updatedConnections);
      setSelectedNodeId(newNodeData.id);
      setTimeout(() => setEditModalOpen(true), 100);
    },
    [
      currentNodes,
      currentConnections,
      workflow.deviceType,
      pushHistory,
      syncToWorkflow,
      setSelectedNodeId,
      setEditModalOpen,
    ],
  );

  const onConnect = useCallback(
    (connection: {
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    }) => {
      const existingFromSameSource = currentConnections.filter(
        (c) => c.from === connection.source && c.fromSide === (connection.sourceHandle || 'out'),
      );

      pushHistory();

      let updatedConnections = currentConnections;
      if (existingFromSameSource.length > 0) {
        console.warn('[CanvasEditor] Replacing existing connection(s) from same source handle');
        updatedConnections = currentConnections.filter(
          (c) =>
            !(c.from === connection.source && c.fromSide === (connection.sourceHandle || 'out')),
        );
      }

      const newConnection: NodeConnection = {
        id: generateId('c'),
        from: connection.source,
        to: connection.target,
        fromSide: (connection.sourceHandle as any) || 'out',
        toSide: (connection.targetHandle as any) || 'in',
      };

      updatedConnections = [...updatedConnections, newConnection];
      syncToWorkflow(currentNodes, updatedConnections);
    },
    [pushHistory, currentNodes, currentConnections, syncToWorkflow],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      pushHistory();
      const updatedConnections = currentConnections.filter((e) => e.id !== edgeId);
      syncToWorkflow(currentNodes, updatedConnections);
      setSelectedNodeId(null);
    },
    [pushHistory, currentNodes, currentConnections, syncToWorkflow, setSelectedNodeId],
  );

  return {
    addNodeAt,
    deleteNode,
    duplicateNode,
    addNodeToQueue,
    updateNodeField,
    toggleNodeLock,
    clearNodeContent,
    copyNode,
    pasteNode,
    addConnection,
    onConnect,
    deleteEdge,
  };
};
