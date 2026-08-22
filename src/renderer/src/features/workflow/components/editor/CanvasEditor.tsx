import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Home,
  Plus,
  StickyNote,
  Grid3x3,
  Clipboard,
  Globe,
} from 'lucide-react';
import {
  ReactFlow,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './workflow-editor.css';
import type { NodeConnection, Workflow, WorkflowNode } from '../../types';
import { findNodeItem, PLATFORM_META } from '../../constants';
import { WorkflowNodeComponent } from './WorkflowNode';
import { WorkflowNodeModal } from './WorkflowNodeModal';
import { RecordQueue } from './RecordQueue';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../../../../components/ui/Dropdown';
import { Kbd } from '../../../../components/ui/Kbd/Kbd';

interface CanvasEditorProps {
  workflow: Workflow;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
  onBack: () => void;
}

interface Snapshot {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

function toFlowNode(node: WorkflowNode, handlers: any): Node {
  return {
    id: node.id,
    type: 'workflowNode',
    position: { x: node.x, y: node.y },
    data: { ...node, ...handlers } as unknown as Record<string, unknown>,
    draggable: !node.locked,
  };
}

function toFlowEdge(conn: NodeConnection): Edge {
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

const CanvasEditor = ({ workflow, onUpdateWorkflow, onBack }: CanvasEditorProps) => {
  const { zoomIn, zoomOut, screenToFlowPosition, getZoom, setViewport, getViewport } =
    useReactFlow();

  // Use ReactFlow's state management for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodesCount, setSelectedNodesCount] = useState(0);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [contextMenuType, setContextMenuType] = useState<'canvas' | 'node' | 'edge'>('canvas');
  const [nodeContextMenuCloseSignal, setNodeContextMenuCloseSignal] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapObject, setSnapObject] = useState(true);
  const [copiedNode, setCopiedNode] = useState<WorkflowNode | null>(null);
  const [zoom, setZoom] = useState(1);

  // Record queue state
  const [recordQueue, setRecordQueue] = useState<WorkflowNode[]>([]);
  const [autoAdd, setAutoAdd] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const historyRef = useRef<Snapshot[]>([]);
  const redoRef = useRef<Snapshot[]>([]);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactFlowWrapRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const wasSelectedBeforeDragRef = useRef<Set<string>>(new Set());
  const shouldPreventSelectionRef = useRef(false);

  const currentNodes = workflow.nodes;
  const currentConnections = workflow.connections;

  // Sync workflow.nodes → ReactFlow nodes
  useEffect(() => {
    const handlers = {
      onDuplicate: duplicateNode,
      onDelete: deleteNode,
      onLockToggle: toggleNodeLock,
      onClearContent: clearNodeContent,
      onCopy: copyNode,
      onAddConnection: addConnection,
      selectedNodesCount, // Pass selected count to all nodes
      nodeContextMenuCloseSignal, // Signal to close node context menus
      onOpenModal: (id: string) => {
        setSelectedNodeId(id);
        setEditModalOpen(true);
      },
    };

    // Check which nodes have incoming/outgoing connections
    const nodesWithIncoming = new Set<string>();
    const nodesWithOutgoing = new Set<string>();
    currentConnections.forEach((conn) => {
      nodesWithOutgoing.add(conn.from);
      nodesWithIncoming.add(conn.to);
    });

    const flowNodes = currentNodes.map((node) => {
      const flowNode = toFlowNode(node, handlers);
      // Add classes based on connection type
      const classes = [];
      if (nodesWithIncoming.has(node.id)) classes.push('has-incoming');
      if (nodesWithOutgoing.has(node.id)) classes.push('has-outgoing');
      if (classes.length > 0) {
        flowNode.className = (flowNode.className || '') + ' ' + classes.join(' ');
      }
      return flowNode;
    });
    setNodes(flowNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodes, currentConnections, nodeContextMenuCloseSignal]);

  // Separate effect to update node data when selection changes
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selectedNodesCount,
          editModalOpen, // Pass editModalOpen to all nodes
          nodeContextMenuCloseSignal, // Pass signal to all nodes
        },
      })),
    );
  }, [selectedNodesCount, editModalOpen, nodeContextMenuCloseSignal, setNodes]);

  // Sync workflow.connections → ReactFlow edges
  useEffect(() => {
    const flowEdges = currentConnections.map(toFlowEdge);
    setEdges(flowEdges);
  }, [currentConnections]);

  // ─── Sync React Flow → workflow (debounced) ─────────────────────────────
  const syncToWorkflow = useCallback(
    (newNodes: WorkflowNode[], newEdges: NodeConnection[]) => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        onUpdateWorkflow({
          nodes: newNodes,
          connections: newEdges,
        });
      }, 200);
    },
    [onUpdateWorkflow],
  );

  // ─── History (undo/redo) ────────────────────────────────────────────────
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

  // ─── Node operations ────────────────────────────────────────────────────
  const addNodeAt = useCallback(
    (type: string, position: { x: number; y: number }, autoOpenModal = false) => {
      // Fallback to default node type if not found
      let nodeType = type;
      const item = findNodeItem(workflow.platform, type);
      if (!item) {
        // Use default based on platform
        nodeType = workflow.platform === 'website' ? 'click_web' : 'tap';
      }

      const finalItem = findNodeItem(workflow.platform, nodeType);
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
    [workflow.platform, pushHistory, currentNodes, currentConnections, syncToWorkflow],
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
    [pushHistory, currentNodes, currentConnections, syncToWorkflow, selectedNodeId],
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
    [currentNodes, currentConnections, pushHistory, syncToWorkflow],
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
      const item = findNodeItem(workflow.platform, node.type);
      if (!item) return;
      updateNodeField(nodeId, {
        title: item.title,
        subtitle: item.subtitle || '',
        note: '',
      });
    },
    [currentNodes, workflow.platform, updateNodeField],
  );

  const copyNode = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;
      setCopiedNode(JSON.parse(JSON.stringify(node)));
    },
    [currentNodes],
  );

  const pasteNode = useCallback(
    (position: { x: number; y: number }) => {
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
    [copiedNode, pushHistory, currentNodes, currentConnections, syncToWorkflow],
  );

  const addConnection = useCallback(
    (nodeId: string, direction: 'top' | 'right' | 'bottom' | 'left') => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Use default node type based on platform
      const defaultType = workflow.platform === 'website' ? 'click_web' : 'tap';
      const item = findNodeItem(workflow.platform, defaultType);
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
    [currentNodes, currentConnections, workflow.platform, pushHistory, syncToWorkflow],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('[CanvasEditor] onConnect triggered', connection);
      pushHistory();
      const newConnection: NodeConnection = {
        id: generateId('c'),
        from: connection.source!,
        to: connection.target!,
        fromSide: (connection.sourceHandle as any) || 'out',
        toSide: (connection.targetHandle as any) || 'in',
      };
      console.log('[CanvasEditor] Creating new connection', newConnection);
      const updatedConnections = [...currentConnections, newConnection];
      syncToWorkflow(currentNodes, updatedConnections);
    },
    [pushHistory, currentNodes, currentConnections, syncToWorkflow],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      pushHistory();
      const updatedConnections = currentConnections.filter((e) => e.id !== edgeId);
      syncToWorkflow(currentNodes, updatedConnections);
      setSelectedEdgeId(null);
    },
    [pushHistory, currentNodes, currentConnections, syncToWorkflow],
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenuOpen(false);
  }, []);

  // Handle right-click on canvas
  const handlePaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    setContextMenuType('canvas');
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
    setContextMenuOpen(true);
    // Signal all nodes to close their context menus
    setNodeContextMenuCloseSignal((prev) => prev + 1);
  }, []);

  // Handle selection change
  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    // Skip selection change if we're preventing it (during drag of unselected node)
    if (shouldPreventSelectionRef.current) {
      shouldPreventSelectionRef.current = false;
      return;
    }

    // Update selected nodes count
    setSelectedNodesCount(nodes.length);

    if (nodes.length > 0) {
      // Use setTimeout to avoid selection being cleared immediately
      setTimeout(() => {
        setSelectedNodeId(nodes[0].id);
        setSelectedEdgeId(null);
      }, 0);
    } else if (edges.length > 0) {
      setTimeout(() => {
        setSelectedEdgeId(edges[0].id);
        setSelectedNodeId(null);
      }, 0);
    } else {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, []);

  // Handle edge click
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  // Handle node drag start - save current selection state
  const onNodeDragStart = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      wasSelectedBeforeDragRef.current = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
      // If node wasn't selected before drag, mark that we should prevent selection
      if (!node.selected) {
        shouldPreventSelectionRef.current = true;
      }
    },
    [nodes],
  );

  // Handle node drag stop - restore selection state if node wasn't selected before
  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      if (!wasSelectedBeforeDragRef.current.has(node.id)) {
        // Node wasn't selected before drag, so deselect it
        shouldPreventSelectionRef.current = true;
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              selected: wasSelectedBeforeDragRef.current.has(n.id),
            })),
          );
          setSelectedNodeId(null);
          setSelectedNodesCount(0);
        }, 0);
      }
      wasSelectedBeforeDragRef.current.clear();
    },
    [setNodes],
  );

  // Update zoom display
  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoom(Math.round(currentZoom * 100));
    };

    updateZoom();
    const interval = setInterval(updateZoom, 100);
    return () => clearInterval(interval);
  }, [getZoom]);

  // Go to root node
  const goToRoot = useCallback(() => {
    const rootNode = currentNodes.find((n) => n.type === 'start' || n.id === 'start');
    if (rootNode) {
      setViewport({ x: -rootNode.x + 400, y: -rootNode.y + 300, zoom: 1 }, { duration: 500 });
    }
  }, [currentNodes, setViewport]);

  // Middle mouse button pan
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        if (reactFlowWrapRef.current) {
          reactFlowWrapRef.current.style.cursor = 'grabbing';
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) {
        e.preventDefault();
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;

        const viewport = getViewport();
        setViewport({
          x: viewport.x + dx,
          y: viewport.y + dy,
          zoom: viewport.zoom,
        });

        panStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isPanningRef.current = false;
        if (reactFlowWrapRef.current) {
          reactFlowWrapRef.current.style.cursor = '';
        }
      }
    };

    const wrap = reactFlowWrapRef.current;
    if (wrap) {
      wrap.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        wrap.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return undefined;
  }, [getViewport, setViewport]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        if (delta > 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    };

    const wrap = reactFlowWrapRef.current;
    if (wrap) {
      wrap.addEventListener('wheel', handleWheel, { passive: false });
      return () => wrap.removeEventListener('wheel', handleWheel);
    }

    return undefined;
  }, [zoomIn, zoomOut]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }

      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedNodeId) {
        e.preventDefault();
        copyNode(selectedNodeId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && copiedNode) {
        e.preventDefault();
        const center = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        pasteNode(center);
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedNodeId) {
        e.preventDefault();
        duplicateNode(selectedNodeId);
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          deleteEdge(selectedEdgeId);
        }
      }

      // Clear content
      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace' && selectedNodeId) {
        e.preventDefault();
        clearNodeContent(selectedNodeId);
      }

      // Lock/Unlock
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l' && selectedNodeId) {
        e.preventDefault();
        toggleNodeLock(selectedNodeId);
      }

      // Show grid
      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowGrid((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    selectedNodeId,
    selectedEdgeId,
    copyNode,
    duplicateNode,
    deleteNode,
    deleteEdge,
    clearNodeContent,
    toggleNodeLock,
    copiedNode,
    pasteNode,
    getViewport,
    screenToFlowPosition,
  ]);

  // Setup workflow recording listeners
  useEffect(() => {
    const unsubscribeNodeRecorded = window.api.workflow.onNodeRecorded((nodeData: any) => {
      console.log('[CanvasEditor] Node recorded:', nodeData);

      const newNode: WorkflowNode = {
        id: generateId('n'),
        type: nodeData.type || 'click_web',
        category: nodeData.category || 'interact',
        title: nodeData.title || '',
        subtitle: nodeData.subtitle || '',
        note: nodeData.note || '',
        x: 0,
        y: 0,
        w: 208,
        h: 76,
        pill: false,
        dual: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...nodeData,
      };

      setRecordQueue((prev) => [...prev, newNode]);

      // Auto-add to canvas if enabled
      if (autoAdd) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const pos = screenToFlowPosition({ x: centerX, y: centerY });

        pushHistory();
        const updatedNodes = [...currentNodes, { ...newNode, x: pos.x, y: pos.y }];
        syncToWorkflow(updatedNodes, currentConnections);
      }
    });

    const unsubscribeRecordingStopped = window.api.workflow.onRecordingStopped(
      (workflowId: string) => {
        console.log('[CanvasEditor] Recording stopped for:', workflowId);
        if (workflowId === workflow.id) {
          setIsRecording(false);
        }
      },
    );

    return () => {
      unsubscribeNodeRecorded();
      unsubscribeRecordingStopped();
    };
  }, [
    workflow.id,
    autoAdd,
    currentNodes,
    currentConnections,
    pushHistory,
    syncToWorkflow,
    screenToFlowPosition,
  ]);

  const selectedNode = selectedNodeId ? currentNodes.find((n) => n.id === selectedNodeId) : null;

  const platform = PLATFORM_META[workflow.platform];

  // Handler to launch browser with recorder
  const handleLaunchBrowser = useCallback(async () => {
    try {
      console.log('[CanvasEditor] Launching browser with recorder');
      setIsRecording(true);

      const result = await window.api.workflow.startRecording(
        workflow.id,
        'https://www.google.com',
      );

      if (!result.success) {
        console.error('[CanvasEditor] Failed to start recording:', result.error);
        setIsRecording(false);
        alert(`Failed to start recording: ${result.error}`);
      } else {
        console.log('[CanvasEditor] Recording started successfully');
      }
    } catch (error) {
      console.error('[CanvasEditor] Error launching browser:', error);
      setIsRecording(false);
      alert('Failed to launch browser');
    }
  }, [workflow.id]);

  // Handler to stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      console.log('[CanvasEditor] Stopping recording');
      const result = await window.api.workflow.stopRecording(workflow.id);

      if (!result.success) {
        console.error('[CanvasEditor] Failed to stop recording:', result.error);
      }

      setIsRecording(false);
    } catch (error) {
      console.error('[CanvasEditor] Error stopping recording:', error);
      setIsRecording(false);
    }
  }, [workflow.id]);

  // Handler to add node from queue to canvas
  const handleAddNodeFromQueue = useCallback(
    (node: WorkflowNode) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const pos = screenToFlowPosition({ x: centerX, y: centerY });

      pushHistory();
      const newNode = { ...node, x: pos.x, y: pos.y };
      const updatedNodes = [...currentNodes, newNode];
      syncToWorkflow(updatedNodes, currentConnections);

      // Remove from queue
      setRecordQueue((prev) => prev.filter((n) => n.id !== node.id));
    },
    [currentNodes, currentConnections, pushHistory, syncToWorkflow, screenToFlowPosition],
  );

  // Handler to remove node from queue
  const handleRemoveFromQueue = useCallback((nodeId: string) => {
    setRecordQueue((prev) => prev.filter((n) => n.id !== nodeId));
  }, []);

  // Handler to clear all queue
  const handleClearQueue = useCallback(() => {
    setRecordQueue([]);
  }, []);

  // Handler to toggle auto-add
  const handleToggleAutoAdd = useCallback(() => {
    setAutoAdd((prev) => !prev);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-text-primary">
      {/* Top bar */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-t border-r border-border px-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          title="Back to list"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-text-secondary">Workflow /</span>
        <span className="text-sm font-bold text-text-primary">{workflow.name}</span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: platform.bg, color: platform.color }}
        >
          {platform.label}
        </span>
        <div className="ml-auto" />
        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-1.5 rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error/90"
            title="Stop recording"
          >
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Stop Recording
          </button>
        ) : (
          <button
            onClick={handleLaunchBrowser}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
            title="Launch browser with recorder"
          >
            <Globe className="h-3.5 w-3.5" />
            Launch Browser
          </button>
        )}
      </div>

      {/* Main content with RecordQueue and Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Record Queue Sidebar */}
        <RecordQueue
          nodes={recordQueue}
          autoAdd={autoAdd}
          onAutoAddToggle={handleToggleAutoAdd}
          onAddNode={handleAddNodeFromQueue}
          onRemoveNode={handleRemoveFromQueue}
          onClearAll={handleClearQueue}
        />

        {/* React Flow canvas */}
        <div ref={reactFlowWrapRef} className="flex-1 relative border-b border-r border-border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={(event, params) => {
              console.log('[CanvasEditor] onConnectStart', event, params);
            }}
            onConnectEnd={(event) => {
              console.log('[CanvasEditor] onConnectEnd', event);
            }}
            onPaneClick={onPaneClick}
            onPaneContextMenu={handlePaneContextMenu}
            onSelectionChange={onSelectionChange}
            onEdgeClick={onEdgeClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: 'rgb(var(--primary))', strokeWidth: 2 },
              markerEnd: { type: 'arrowclosed', color: 'rgb(var(--primary))' },
            }}
            fitView
            minZoom={0.35}
            maxZoom={1.8}
            deleteKeyCode={null}
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            proOptions={{ hideAttribution: true }}
            zoomOnScroll={false}
            panOnScroll={true}
            panOnDrag={[2]}
            selectionOnDrag={true}
            connectionMode={ConnectionMode.Loose}
            connectOnClick={false}
          >
            <Background
              variant={showGrid ? ('dots' as any) : undefined}
              gap={20}
              size={2}
              color="#ff0000"
            />

            {/* Zoom controls overlay bar */}
            <Panel position="bottom-left">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card-background/95 px-3 py-2 shadow-lg backdrop-blur">
                <button
                  onClick={() => zoomOut()}
                  className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] text-center text-xs font-semibold text-text-primary">
                  {zoom}%
                </span>
                <button
                  onClick={() => zoomIn()}
                  className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-border" />
                <button
                  onClick={goToRoot}
                  className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                  title="Go to root node"
                >
                  <Home className="h-4 w-4" />
                </button>
              </div>
            </Panel>
          </ReactFlow>

          {/* Context menu */}
          {contextMenuOpen && (
            <Dropdown
              open={contextMenuOpen}
              onOpenChange={setContextMenuOpen}
              strategy="fixed"
              position={contextMenuPosition}
            >
              <DropdownTrigger>
                <div />
              </DropdownTrigger>
              <DropdownContent className="min-w-[200px]">
                {contextMenuType === 'canvas' && (
                  <>
                    <DropdownItem
                      icon={<Clipboard className="h-3.5 w-3.5" />}
                      onClick={() => {
                        const pos = screenToFlowPosition({
                          x: contextMenuPosition.left,
                          y: contextMenuPosition.top,
                        });
                        pasteNode(pos);
                      }}
                      disabled={!copiedNode}
                    >
                      Paste <Kbd className="ml-auto">Ctrl+V</Kbd>
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<StickyNote className="h-3.5 w-3.5" />}
                      onClick={() => {
                        const pos = screenToFlowPosition({
                          x: contextMenuPosition.left,
                          y: contextMenuPosition.top,
                        });
                        addNodeAt('note', pos, true);
                      }}
                    >
                      Add sticky note
                    </DropdownItem>
                    <DropdownItem
                      icon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => {
                        const pos = screenToFlowPosition({
                          x: contextMenuPosition.left,
                          y: contextMenuPosition.top,
                        });
                        addNodeAt('action', pos, true);
                      }}
                    >
                      Add node
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<Grid3x3 className="h-3.5 w-3.5" />}
                      onClick={() => setShowGrid((prev) => !prev)}
                      className={showGrid ? 'bg-primary/10 text-primary' : ''}
                    >
                      Show grid <Kbd className="ml-auto">G</Kbd>
                    </DropdownItem>
                    <DropdownItem
                      icon={<Grid3x3 className="h-3.5 w-3.5" />}
                      onClick={() => setSnapToGrid((prev) => !prev)}
                      className={snapToGrid ? 'bg-primary/10 text-primary' : ''}
                    >
                      Snap to grid
                    </DropdownItem>
                    <DropdownItem
                      icon={<Grid3x3 className="h-3.5 w-3.5" />}
                      onClick={() => setSnapObject((prev) => !prev)}
                      className={snapObject ? 'bg-primary/10 text-primary' : ''}
                    >
                      Snap object
                    </DropdownItem>
                  </>
                )}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Node edit modal */}
      {selectedNode && (
        <WorkflowNodeModal
          node={selectedNode}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={updateNodeField}
        />
      )}
    </div>
  );
};

export default CanvasEditor;
