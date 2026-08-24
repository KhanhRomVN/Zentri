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
  Play,
  Video,
  History,
  ScrollText,
  RefreshCw,
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
import {
  generateId,
  toFlowNode,
  toFlowEdge,
  validateEdges,
  getConnectionSets,
  validateWorkflow,
} from '../../utils';
import { WorkflowNodeComponent } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';
import { WorkflowNodeModal } from './WorkflowNodeModal';
import { RecordQueue } from './RecordQueue';
import { RunWorkflowModal, type RunConfig } from './RunWorkflowModal';
import { WorkflowHistoryModal } from './WorkflowHistoryModal';
import { BottomPanel } from './BottomPanel/BottomPanel';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../../../../components/ui/Dropdown';
import { Kbd } from '../../../../components/ui/Kbd/Kbd';
import { Tooltip } from '../Tooltip';

interface CanvasEditorProps {
  workflow: Workflow;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
  onBack: () => void;
}

interface Snapshot {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

const edgeTypes = {
  workflowEdge: WorkflowEdge,
};

const CanvasEditor = ({ workflow, onUpdateWorkflow, onBack }: CanvasEditorProps) => {
  const { zoomIn, zoomOut, screenToFlowPosition, getZoom, setViewport, getViewport } =
    useReactFlow();

  // Use ReactFlow's state management for nodes and edges
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
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

  const [recordQueue, setRecordQueue] = useState<WorkflowNode[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null); // Track currently executing node
  const [workflowValid, setWorkflowValid] = useState(true); // Track if workflow has errors
  const [validationErrors, setValidationErrors] = useState<{
    unconfiguredNodes: string[];
    duplicateEdges: string[];
    isolatedNodes: string[];
  }>({ unconfiguredNodes: [], duplicateEdges: [], isolatedNodes: [] });

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

  // Wrap onNodesChange to sync position changes back to workflow
  const onNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChangeInternal(changes);

      // Only sync position changes when dragging stops (dragging: false)
      const positionChanges = changes.filter(
        (c) => c.type === 'position' && c.position && c.dragging === false,
      );
      if (positionChanges.length > 0) {
        const updatedNodes = currentNodes.map((node) => {
          const change = positionChanges.find((c) => c.id === node.id);
          if (change && change.position) {
            return {
              ...node,
              x: Math.round(change.position.x),
              y: Math.round(change.position.y),
              updatedAt: new Date().toISOString(),
            };
          }
          return node;
        });
        syncToWorkflow(updatedNodes, currentConnections);
      }
    },
    [onNodesChangeInternal, currentNodes, currentConnections, syncToWorkflow],
  );

  // Sync workflow.nodes → ReactFlow nodes
  useEffect(() => {
    const handlers = {
      onDuplicate: duplicateNode,
      onDelete: deleteNode,
      onLockToggle: toggleNodeLock,
      onClearContent: clearNodeContent,
      onCopy: copyNode,
      onAddConnection: addConnection,
      onAddToQueue: addNodeToQueue,
      selectedNodesCount, // Pass selected count to all nodes
      nodeContextMenuCloseSignal, // Signal to close node context menus
      onOpenModal: (id: string) => {
        setSelectedNodeId(id);
        setEditModalOpen(true);
      },
    };

    // Check which nodes have incoming/outgoing connections
    const { nodesWithIncoming, nodesWithOutgoing } = getConnectionSets(currentConnections);

    const flowNodes = currentNodes.map((node) => {
      const flowNode = toFlowNode(node, handlers);
      // Add classes based on connection type
      const classes = [];
      if (nodesWithIncoming.has(node.id)) classes.push('has-incoming');
      if (nodesWithOutgoing.has(node.id)) classes.push('has-outgoing');
      if (classes.length > 0) {
        flowNode.className = (flowNode.className || '') + ' ' + classes.join(' ');
      }
      // Add isExecuting prop if this node is currently executing
      if (executingNodeId === node.id) {
        flowNode.data = { ...flowNode.data, isExecuting: true };
      }
      // Add isIsolated prop if this node is in the isolated nodes list
      if (validationErrors.isolatedNodes?.includes(node.id)) {
        flowNode.data = { ...flowNode.data, isIsolated: true };
      }
      return flowNode;
    });

    // Only update if nodes actually changed (compare by structure, not reference)
    setNodes((prevNodes) => {
      // If count is different, definitely update
      if (prevNodes.length !== flowNodes.length) {
        return flowNodes;
      }

      // Check if any node has actually changed (content, not just position)
      let hasContentChange = false;
      for (let i = 0; i < flowNodes.length; i++) {
        const prevNode = prevNodes.find((n) => n.id === flowNodes[i].id);
        if (!prevNode) {
          hasContentChange = true;
          break;
        }

        // Check if data has changed (excluding position)
        const prevData = prevNode.data as any;
        const newData = flowNodes[i].data as any;

        if (
          prevData.type !== newData.type ||
          prevData.title !== newData.title ||
          prevData.subtitle !== newData.subtitle ||
          prevData.note !== newData.note ||
          prevData.locked !== newData.locked ||
          prevData.disabled !== newData.disabled ||
          prevData.isExecuting !== newData.isExecuting ||
          prevData.isIsolated !== newData.isIsolated
        ) {
          hasContentChange = true;
          break;
        }
      }

      // Only update if there's actual content change
      return hasContentChange ? flowNodes : prevNodes;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentNodes,
    currentConnections,
    nodeContextMenuCloseSignal,
    executingNodeId,
    validationErrors,
  ]);

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
    // Validate edges and get invalid ones
    const invalidEdges = validateEdges(currentConnections);

    const flowEdges = currentConnections.map((conn) => {
      const isInvalid = invalidEdges.has(conn.id);

      // Convert to flow edge with error styling if invalid
      const edge = toFlowEdge(conn);
      edge.type = 'workflowEdge'; // Use custom edge type
      edge.data = {
        isInvalid,
        errorMessage: isInvalid
          ? 'Invalid connection: multiple edges from same source handle'
          : undefined,
      };

      if (isInvalid) {
        edge.style = {
          stroke: 'rgb(var(--error))',
          strokeWidth: 2,
        };
        edge.markerEnd = {
          type: 'arrowclosed',
          color: 'rgb(var(--error))',
        };
        edge.animated = true; // Animate error edges
      }
      return edge;
    });

    setEdges(flowEdges);
  }, [currentConnections, setEdges]);

  // Validate workflow whenever nodes or connections change
  useEffect(() => {
    const validation = validateWorkflow(currentNodes, currentConnections);
    setWorkflowValid(validation.isValid);
    setValidationErrors(validation.errors);
  }, [currentNodes, currentConnections]);

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

  const addNodeToQueue = useCallback(
    (nodeId: string) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Clone node and add to record queue
      const queueNode: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: generateId('n'),
        x: 0,
        y: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRecordQueue((prev) => [...prev, queueNode]);

      // Remove node from canvas (MOVE instead of ADD)
      pushHistory();
      const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
      const updatedConnections = currentConnections.filter(
        (e) => e.from !== nodeId && e.to !== nodeId,
      );
      syncToWorkflow(updatedNodes, updatedConnections);

      // Clear selection
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [currentNodes, currentConnections, pushHistory, syncToWorkflow, selectedNodeId],
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
      // Check if connection already exists from same source handle
      const existingFromSameSource = currentConnections.filter(
        (c) => c.from === connection.source && c.fromSide === (connection.sourceHandle || 'out'),
      );

      pushHistory();

      // Remove existing connection from same source handle (auto-replace behavior)
      let updatedConnections = currentConnections;
      if (existingFromSameSource.length > 0) {
        console.warn('[CanvasEditor] Replacing existing connection(s) from same source handle');
        console.warn('[CanvasEditor] Removing:', existingFromSameSource);
        updatedConnections = currentConnections.filter(
          (c) =>
            !(c.from === connection.source && c.fromSide === (connection.sourceHandle || 'out')),
        );
      }

      const newConnection: NodeConnection = {
        id: generateId('c'),
        from: connection.source!,
        to: connection.target!,
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
      // Get current zoom to preserve it
      const currentZoom = getZoom();

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get ReactFlow wrapper element to calculate actual canvas size
      const flowWrapper = reactFlowWrapRef.current;
      const canvasWidth = flowWrapper?.offsetWidth || viewportWidth;
      const canvasHeight = flowWrapper?.offsetHeight || viewportHeight;

      console.log('[goToRoot] Debug Info:', {
        windowSize: { width: viewportWidth, height: viewportHeight },
        canvasSize: { width: canvasWidth, height: canvasHeight },
        rootNode: { x: rootNode.x, y: rootNode.y, w: rootNode.w, h: rootNode.h },
        currentZoom,
      });

      // Calculate center of the node in flow coordinates
      const nodeCenterX = rootNode.x + rootNode.w / 2;
      const nodeCenterY = rootNode.y + rootNode.h / 2;

      // Calculate center of the canvas
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      // Calculate viewport offset to center the node
      // Formula: viewport.x = canvasCenter - (nodeCenter * zoom)
      const viewportX = canvasCenterX - nodeCenterX * currentZoom;
      const viewportY = canvasCenterY - nodeCenterY * currentZoom;

      console.log('[goToRoot] Center calculations:', {
        nodeCenter: { x: nodeCenterX, y: nodeCenterY },
        canvasCenter: { x: canvasCenterX, y: canvasCenterY },
        viewport: { x: viewportX, y: viewportY },
      });

      // Calculate viewport position to center the node
      setViewport(
        {
          x: viewportX,
          y: viewportY,
          zoom: currentZoom,
        },
        { duration: 500 },
      );
    }
  }, [currentNodes, setViewport, getZoom]);

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

      // Zoom in/out
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
      }

      // Reset zoom to 100%
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setViewport({ x: getViewport().x, y: getViewport().y, zoom: 1 }, { duration: 300 });
      }

      // Go to root (Home key)
      if (e.key === 'Home') {
        e.preventDefault();
        goToRoot();
      }

      // Open edit modal for selected node
      if (e.key === 'Enter' && selectedNodeId && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        setEditModalOpen(true);
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
    zoomIn,
    zoomOut,
    goToRoot,
  ]);

  // Setup workflow recording listeners
  useEffect(() => {
    const unsubscribeNodeRecorded = window.api.workflow.onNodeRecorded((nodeData: any) => {
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
    });

    const unsubscribeRecordingStopped = window.api.workflow.onRecordingStopped(
      (workflowId: string) => {
        if (workflowId === workflow.id) {
          setIsRecording(false);
        }
      },
    );

    // Listen for workflow logs to track executing node
    const unsubscribeLog = window.api.workflow.onLog((logEntry: any) => {
      if (logEntry.workflowId === workflow.id && logEntry.nodeId) {
        // Update executing node based on log level
        if (logEntry.level === 'info' && logEntry.message.includes('Executing node')) {
          setExecutingNodeId(logEntry.nodeId);
        } else if (logEntry.level === 'success' || logEntry.level === 'error') {
          // Clear executing state when node completes or fails
          setExecutingNodeId(null);
        }
      }
    });

    return () => {
      unsubscribeNodeRecorded();
      unsubscribeRecordingStopped();
      unsubscribeLog();
    };
  }, [
    workflow.id,
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
    console.log('[CanvasEditor] handleLaunchBrowser called');
    try {
      setIsRecording(true);
      console.log('[CanvasEditor] Calling window.api.workflow.startRecording...');

      const result = await window.api.workflow.startRecording(
        workflow.id,
        'https://www.google.com',
      );

      console.log('[CanvasEditor] startRecording result:', result);

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

  // Handler to run workflow on recorder browser (NEW)
  const handleRunOnRecorder = useCallback(async () => {
    console.log('[CanvasEditor] handleRunOnRecorder called');
    try {
      // No validation - run regardless of errors
      // User can test incomplete workflows for debugging

      console.log('[CanvasEditor] Calling window.api.workflow.runOnRecorder...');

      const result = await window.api.workflow.runOnRecorder(workflow.id, currentNodes);

      console.log('[CanvasEditor] runOnRecorder result:', result);

      if (!result.success) {
        console.error('[CanvasEditor] Failed to run workflow on recorder:', result.error);
        alert(`Failed to run workflow on recorder: ${result.error}`);
      } else {
        console.log('[CanvasEditor] Workflow executed successfully on recorder browser');
        // No alert on success - user can watch in browser
      }
    } catch (error) {
      console.error('[CanvasEditor] Error running workflow on recorder:', error);
    }
  }, [workflow.id, currentNodes]);

  // Handler to run workflow
  const handleRunWorkflow = useCallback(
    async (config: RunConfig) => {
      try {
        // Get start URL from first node if it's a "go to URL" action
        let startUrl = 'https://google.com';
        const firstActionNode = currentNodes.find((n) => n.type !== 'start');
        if (firstActionNode?.note) {
          try {
            const parsed = JSON.parse(firstActionNode.note);
            if (parsed?.config?.action === 'go_to_url' && parsed?.config?.url) {
              startUrl = parsed.config.url;
            }
          } catch {
            // Keep default URL
          }
        }

        const runConfig = {
          method: config.method,
          ...(config.method === 'profile'
            ? { emailIds: config.emailIds }
            : { count: config.count }),
          nodes: currentNodes,
          startUrl,
        };

        const result = await window.api.workflow.runWorkflow(workflow.id, runConfig);

        if (!result.success) {
          console.error('[CanvasEditor] Failed to run workflow:', result.error);
          alert(`Failed to run workflow: ${result.error}`);
          return;
        }
      } catch (error) {
        console.error('[CanvasEditor] Error running workflow:', error);
        alert(`Error running workflow: ${error}`);
      }
    },
    [workflow.id, currentNodes],
  );

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

  // Handle drop from queue
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapRef.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      try {
        const dataStr = event.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const data = JSON.parse(dataStr);
        if (data.type !== 'queue-node' || !data.node) return;

        const node = data.node as WorkflowNode;

        // Get position relative to ReactFlow
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        pushHistory();
        const newNode = { ...node, x: position.x, y: position.y };
        const updatedNodes = [...currentNodes, newNode];
        syncToWorkflow(updatedNodes, currentConnections);

        // Remove from queue
        setRecordQueue((prev) => prev.filter((n) => n.id !== node.id));
      } catch (error) {
        console.error('[CanvasEditor] Error handling drop:', error);
      }
    },
    [currentNodes, currentConnections, pushHistory, syncToWorkflow, screenToFlowPosition],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
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
      </div>

      {/* Main content with RecordQueue and Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Record Queue Sidebar */}
        <RecordQueue
          nodes={recordQueue}
          onAddNode={handleAddNodeFromQueue}
          onRemoveNode={handleRemoveFromQueue}
        />

        {/* Canvas and Log Panel Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* React Flow canvas */}
          <div
            ref={reactFlowWrapRef}
            className={`border-b border-r border-border relative ${logPanelOpen ? 'flex-1' : 'h-full'}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={(event, params) => {}}
              onConnectEnd={(event) => {}}
              onPaneClick={onPaneClick}
              onPaneContextMenu={handlePaneContextMenu}
              onSelectionChange={onSelectionChange}
              onEdgeClick={onEdgeClick}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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
                  <Tooltip content="Zoom out" side="top">
                    <button
                      onClick={() => zoomOut()}
                      className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <span className="min-w-[3rem] text-center text-xs font-semibold text-text-primary">
                    {zoom}%
                  </span>
                  <Tooltip content="Zoom in" side="top">
                    <button
                      onClick={() => zoomIn()}
                      className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <div className="mx-1 h-4 w-px bg-border" />
                  <Tooltip content="Go to root node" side="top">
                    <button
                      onClick={goToRoot}
                      className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
                    >
                      <Home className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </Panel>

              {/* Floating Action Buttons - Bottom Right */}
              <Panel position="bottom-right">
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-card-background/95 p-1.5 shadow-lg backdrop-blur">
                  {/* Record Browser Button */}
                  <Tooltip
                    content={isRecording ? 'Stop recording' : 'Launch browser recorder'}
                    side="left"
                  >
                    <button
                      onClick={isRecording ? handleStopRecording : handleLaunchBrowser}
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        isRecording
                          ? 'bg-error/10 text-error hover:bg-error/20'
                          : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                    </button>
                  </Tooltip>

                  {/* Run on Recorder Button (Only show when recording/recorder active) */}
                  {isRecording && (
                    <Tooltip content="Run workflow on recorder browser" side="left">
                      <button
                        onClick={handleRunOnRecorder}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}

                  {/* Run Workflow Button */}
                  <Tooltip
                    content={
                      !workflowValid
                        ? 'Cannot run: workflow has errors'
                        : currentNodes.length <= 1
                          ? 'Add nodes to run workflow'
                          : isRecording
                            ? 'Cannot run while recording'
                            : 'Run workflow'
                    }
                    side="left"
                  >
                    <button
                      onClick={() => setRunModalOpen(true)}
                      disabled={currentNodes.length <= 1 || isRecording || !workflowValid}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-success/10 hover:text-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </Tooltip>

                  {/* Workflow History Button */}
                  <Tooltip content="View run history" side="left">
                    <button
                      onClick={() => setHistoryModalOpen(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </Tooltip>

                  {/* Execution Logs Button */}
                  <Tooltip content={logPanelOpen ? 'Hide logs' : 'Show execution logs'} side="left">
                    <button
                      onClick={() => setLogPanelOpen(!logPanelOpen)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        logPanelOpen
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <ScrollText className="h-4 w-4" />
                    </button>
                  </Tooltip>
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

          {/* Bottom Panel - Separate div below canvas */}
          {logPanelOpen && (
            <BottomPanel
              isOpen={logPanelOpen}
              onClose={() => setLogPanelOpen(false)}
              workflowId={workflow.id}
              validationErrors={validationErrors}
              nodes={currentNodes}
              onNodeClick={(nodeId) => {
                // Find node and center it in viewport
                const node = currentNodes.find((n) => n.id === nodeId);
                if (node) {
                  // Get current zoom to preserve it
                  const currentZoom = getZoom();

                  // Get ReactFlow wrapper element to calculate actual canvas size
                  const flowWrapper = reactFlowWrapRef.current;
                  const canvasWidth = flowWrapper?.offsetWidth || window.innerWidth;
                  const canvasHeight = flowWrapper?.offsetHeight || window.innerHeight;

                  // Calculate center of the node in flow coordinates
                  const nodeCenterX = node.x + node.w / 2;
                  const nodeCenterY = node.y + node.h / 2;

                  // Calculate center of the canvas
                  const canvasCenterX = canvasWidth / 2;
                  const canvasCenterY = canvasHeight / 2;

                  // Calculate viewport offset to center the node
                  const viewportX = canvasCenterX - nodeCenterX * currentZoom;
                  const viewportY = canvasCenterY - nodeCenterY * currentZoom;

                  setViewport(
                    {
                      x: viewportX,
                      y: viewportY,
                      zoom: currentZoom,
                    },
                    { duration: 500 },
                  );
                  // Select node (simulates left click)
                  setTimeout(() => {
                    setSelectedNodeId(nodeId);
                    setNodes((nds) =>
                      nds.map((n) => ({
                        ...n,
                        selected: n.id === nodeId,
                      })),
                    );
                  }, 100);
                }
              }}
              onEdgeClick={(edgeId) => {
                // Find edge and center it in viewport
                const edge = currentConnections.find((e) => e.id === edgeId);
                if (edge) {
                  const fromNode = currentNodes.find((n) => n.id === edge.from);
                  const toNode = currentNodes.find((n) => n.id === edge.to);
                  if (fromNode && toNode) {
                    // Get current zoom to preserve it
                    const currentZoom = getZoom();

                    // Get ReactFlow wrapper element to calculate actual canvas size
                    const flowWrapper = reactFlowWrapRef.current;
                    const canvasWidth = flowWrapper?.offsetWidth || window.innerWidth;
                    const canvasHeight = flowWrapper?.offsetHeight || window.innerHeight;

                    // Calculate midpoint between nodes (edge center)
                    const midX = (fromNode.x + toNode.x) / 2 + fromNode.w / 2;
                    const midY = (fromNode.y + toNode.y) / 2 + fromNode.h / 2;

                    // Calculate center of the canvas
                    const canvasCenterX = canvasWidth / 2;
                    const canvasCenterY = canvasHeight / 2;

                    // Calculate viewport offset to center the edge
                    const viewportX = canvasCenterX - midX * currentZoom;
                    const viewportY = canvasCenterY - midY * currentZoom;

                    setViewport(
                      {
                        x: viewportX,
                        y: viewportY,
                        zoom: currentZoom,
                      },
                      { duration: 500 },
                    );
                    // Select edge (simulates left click)
                    setTimeout(() => {
                      setSelectedEdgeId(edgeId);
                      setEdges((eds) =>
                        eds.map((e) => ({
                          ...e,
                          selected: e.id === edgeId,
                        })),
                      );
                    }, 100);
                  }
                }
              }}
            />
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

      {/* Run workflow modal */}
      <RunWorkflowModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onRun={handleRunWorkflow}
      />

      {/* Workflow History Modal */}
      <WorkflowHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        workflowId={workflow.id}
      />
    </div>
  );
};

export default CanvasEditor;
