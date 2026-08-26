import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
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
import '../../styles/workflow-editor.css';
import type { NodeConnection, Workflow, WorkflowNode } from '../../types';
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
import { WorkflowNodeModal } from './modal/WorkflowNodeModal';
import { RecordQueue } from './RecordQueue';
import { RunWorkflowModal } from './modal/RunWorkflowModal';
import { WorkflowHistoryModal } from './modal/WorkflowHistoryModal';
import { BottomPanel } from './BottomPanel/BottomPanel';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasContextMenu } from './components/CanvasContextMenu';
import { CanvasZoomControls } from './components/CanvasZoomControls';
import { CanvasFloatingActions } from './components/CanvasFloatingActions';
import { useWorkflowHistory } from '../../hooks/useWorkflowHistory';
import { useNodeOperations } from '../../hooks/useNodeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useCanvasViewport } from '../../hooks/useCanvasViewport';
import { useWorkflowRecording } from '../../hooks/useWorkflowRecording';

interface CanvasEditorProps {
  workflow: Workflow;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
  onBack: () => void;
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
  const [recordQueue, setRecordQueue] = useState<WorkflowNode[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  const [workflowValid, setWorkflowValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    unconfiguredNodes: string[];
    duplicateEdges: string[];
    isolatedNodes: string[];
  }>({ unconfiguredNodes: [], duplicateEdges: [], isolatedNodes: [] });

  const reactFlowWrapRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSelectedBeforeDragRef = useRef<Set<string>>(new Set());
  const shouldPreventSelectionRef = useRef(false);

  const currentNodes = workflow.nodes;
  const currentConnections = workflow.connections;

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

  const onNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChangeInternal(changes);

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

  const { pushHistory, undo, redo } = useWorkflowHistory(
    currentNodes,
    currentConnections,
    syncToWorkflow,
  );

  const {
    addNodeAt,
    deleteNode,
    duplicateNode,
    addNodeToQueue,
    updateNodeField,
    toggleNodeLock,
    clearNodeContent,
    copyNode,
    pasteNode: pasteNodeOp,
    addConnection,
    onConnect,
    deleteEdge,
  } = useNodeOperations({
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
  });

  const pasteNode = useCallback(
    (position: { x: number; y: number }) => {
      pasteNodeOp(position, copiedNode);
    },
    [pasteNodeOp, copiedNode],
  );

  const { zoom, goToRoot } = useCanvasViewport({
    currentNodes,
    setViewport,
    getViewport,
    getZoom,
    zoomIn,
    zoomOut,
    reactFlowWrapRef,
  });

  const { handleLaunchBrowser, handleStopRecording, handleRunOnRecorder, handleRunWorkflow } =
    useWorkflowRecording({
      workflowId: workflow.id,
      currentNodes,
      setIsRecording,
    });

  useKeyboardShortcuts({
    undo,
    redo,
    selectedNodeId,
    selectedEdgeId,
    copiedNode,
    copyNode,
    pasteNode,
    duplicateNode,
    deleteNode,
    deleteEdge,
    clearNodeContent,
    toggleNodeLock,
    setShowGrid,
    zoomIn,
    zoomOut,
    setViewport,
    getViewport,
    goToRoot,
    setEditModalOpen,
    screenToFlowPosition,
  });

  useEffect(() => {
    const handlers = {
      onDuplicate: duplicateNode,
      onDelete: deleteNode,
      onLockToggle: toggleNodeLock,
      onClearContent: clearNodeContent,
      onCopy: copyNode,
      onAddConnection: addConnection,
      onAddToQueue: addNodeToQueue,
      selectedNodesCount,
      nodeContextMenuCloseSignal,
      onOpenModal: (id: string) => {
        setSelectedNodeId(id);
        setEditModalOpen(true);
      },
    };

    const { nodesWithIncoming, nodesWithOutgoing } = getConnectionSets(currentConnections);

    const flowNodes = currentNodes.map((node) => {
      const flowNode = toFlowNode(node, handlers);
      const classes = [];
      if (nodesWithIncoming.has(node.id)) classes.push('has-incoming');
      if (nodesWithOutgoing.has(node.id)) classes.push('has-outgoing');
      if (classes.length > 0) {
        flowNode.className = (flowNode.className || '') + ' ' + classes.join(' ');
      }
      if (executingNodeId === node.id) {
        flowNode.data = { ...flowNode.data, isExecuting: true };
      }
      if (validationErrors.isolatedNodes?.includes(node.id)) {
        flowNode.data = { ...flowNode.data, isIsolated: true };
      }
      return flowNode;
    });

    setNodes((prevNodes) => {
      if (prevNodes.length !== flowNodes.length) return flowNodes;
      let hasContentChange = false;
      for (let i = 0; i < flowNodes.length; i++) {
        const prevNode = prevNodes.find((n) => n.id === flowNodes[i].id);
        if (!prevNode) {
          hasContentChange = true;
          break;
        }
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

  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selectedNodesCount,
          editModalOpen,
          nodeContextMenuCloseSignal,
        },
      })),
    );
  }, [selectedNodesCount, editModalOpen, nodeContextMenuCloseSignal, setNodes]);

  useEffect(() => {
    const invalidEdges = validateEdges(currentConnections);

    const flowEdges = currentConnections.map((conn) => {
      const isInvalid = invalidEdges.has(conn.id);
      const edge = toFlowEdge(conn);
      edge.type = 'workflowEdge';
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
        edge.animated = true;
      }
      return edge;
    });

    setEdges(flowEdges);
  }, [currentConnections, setEdges]);

  useEffect(() => {
    const validation = validateWorkflow(currentNodes, currentConnections);
    setWorkflowValid(validation.isValid);
    setValidationErrors(validation.errors);
  }, [currentNodes, currentConnections]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenuOpen(false);
  }, []);

  const handlePaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    setContextMenuType('canvas');
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
    setContextMenuOpen(true);
    setNodeContextMenuCloseSignal((prev) => prev + 1);
  }, []);

  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    if (shouldPreventSelectionRef.current) {
      shouldPreventSelectionRef.current = false;
      return;
    }

    setSelectedNodesCount(nodes.length);

    if (nodes.length > 0) {
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

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onNodeDragStart = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      wasSelectedBeforeDragRef.current = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
      if (!node.selected) {
        shouldPreventSelectionRef.current = true;
      }
    },
    [nodes],
  );

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      if (!wasSelectedBeforeDragRef.current.has(node.id)) {
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

    const unsubscribeLog = window.api.workflow.onLog((logEntry: any) => {
      if (logEntry.workflowId === workflow.id && logEntry.nodeId) {
        if (logEntry.level === 'info' && logEntry.message.includes('Executing node')) {
          setExecutingNodeId(logEntry.nodeId);
        } else if (logEntry.level === 'success' || logEntry.level === 'error') {
          setExecutingNodeId(null);
        }
      }
    });

    return () => {
      unsubscribeNodeRecorded();
      unsubscribeRecordingStopped();
      unsubscribeLog();
    };
  }, [workflow.id]);

  const selectedNode = selectedNodeId ? currentNodes.find((n) => n.id === selectedNodeId) : null;

  const handleAddNodeFromQueue = useCallback(
    (node: WorkflowNode) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const pos = screenToFlowPosition({ x: centerX, y: centerY });

      pushHistory();
      const newNode = { ...node, x: pos.x, y: pos.y };
      const updatedNodes = [...currentNodes, newNode];
      syncToWorkflow(updatedNodes, currentConnections);

      setRecordQueue((prev) => prev.filter((n) => n.id !== node.id));
    },
    [currentNodes, currentConnections, pushHistory, syncToWorkflow, screenToFlowPosition],
  );

  const handleRemoveFromQueue = useCallback((nodeId: string) => {
    setRecordQueue((prev) => prev.filter((n) => n.id !== nodeId));
  }, []);

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

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        pushHistory();
        const newNode = { ...node, x: position.x, y: position.y };
        const updatedNodes = [...currentNodes, newNode];
        syncToWorkflow(updatedNodes, currentConnections);

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
      <CanvasToolbar workflow={workflow} onBack={onBack} />

      <div className="flex flex-1 overflow-hidden">
        <RecordQueue
          nodes={recordQueue}
          onAddNode={handleAddNodeFromQueue}
          onRemoveNode={handleRemoveFromQueue}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
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
              onConnect={(connection: Connection) =>
                onConnect({
                  source: connection.source!,
                  target: connection.target!,
                  sourceHandle: connection.sourceHandle,
                  targetHandle: connection.targetHandle,
                })
              }
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

              <CanvasZoomControls
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onGoToRoot={goToRoot}
              />

              <CanvasFloatingActions
                isRecording={isRecording}
                workflowValid={workflowValid}
                nodeCount={currentNodes.length}
                logPanelOpen={logPanelOpen}
                setLogPanelOpen={setLogPanelOpen}
                setRunModalOpen={setRunModalOpen}
                setHistoryModalOpen={setHistoryModalOpen}
                onLaunchBrowser={handleLaunchBrowser}
                onStopRecording={handleStopRecording}
                onRunOnRecorder={handleRunOnRecorder}
              />
            </ReactFlow>

            {contextMenuOpen && contextMenuType === 'canvas' && (
              <CanvasContextMenu
                open={contextMenuOpen}
                position={contextMenuPosition}
                onOpenChange={setContextMenuOpen}
                onPaste={() => {
                  const pos = screenToFlowPosition({
                    x: contextMenuPosition.left,
                    y: contextMenuPosition.top,
                  });
                  pasteNode(pos);
                }}
                onAddNote={() => {
                  const pos = screenToFlowPosition({
                    x: contextMenuPosition.left,
                    y: contextMenuPosition.top,
                  });
                  addNodeAt('note', pos, true);
                }}
                onAddNode={() => {
                  const pos = screenToFlowPosition({
                    x: contextMenuPosition.left,
                    y: contextMenuPosition.top,
                  });
                  addNodeAt('action', pos, true);
                }}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                snapToGrid={snapToGrid}
                setSnapToGrid={setSnapToGrid}
                snapObject={snapObject}
                setSnapObject={setSnapObject}
                hasCopiedNode={!!copiedNode}
              />
            )}
          </div>

          {logPanelOpen && (
            <BottomPanel
              isOpen={logPanelOpen}
              onClose={() => setLogPanelOpen(false)}
              workflowId={workflow.id}
              validationErrors={validationErrors}
              nodes={currentNodes}
              onNodeClick={(nodeId) => {
                const node = currentNodes.find((n) => n.id === nodeId);
                if (node) {
                  const currentZoom = getZoom();
                  const flowWrapper = reactFlowWrapRef.current;
                  const canvasWidth = flowWrapper?.offsetWidth || window.innerWidth;
                  const canvasHeight = flowWrapper?.offsetHeight || window.innerHeight;
                  const nodeCenterX = node.x + node.w / 2;
                  const nodeCenterY = node.y + node.h / 2;
                  const viewportX = canvasWidth / 2 - nodeCenterX * currentZoom;
                  const viewportY = canvasHeight / 2 - nodeCenterY * currentZoom;
                  setViewport({ x: viewportX, y: viewportY, zoom: currentZoom }, { duration: 500 });
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
                const edge = currentConnections.find((e) => e.id === edgeId);
                if (edge) {
                  const fromNode = currentNodes.find((n) => n.id === edge.from);
                  const toNode = currentNodes.find((n) => n.id === edge.to);
                  if (fromNode && toNode) {
                    const currentZoom = getZoom();
                    const flowWrapper = reactFlowWrapRef.current;
                    const canvasWidth = flowWrapper?.offsetWidth || window.innerWidth;
                    const canvasHeight = flowWrapper?.offsetHeight || window.innerHeight;
                    const midX = (fromNode.x + toNode.x) / 2 + fromNode.w / 2;
                    const midY = (fromNode.y + toNode.y) / 2 + fromNode.h / 2;
                    const viewportX = canvasWidth / 2 - midX * currentZoom;
                    const viewportY = canvasHeight / 2 - midY * currentZoom;
                    setViewport(
                      { x: viewportX, y: viewportY, zoom: currentZoom },
                      { duration: 500 },
                    );
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

      {selectedNode && (
        <WorkflowNodeModal
          node={selectedNode}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={updateNodeField}
        />
      )}

      <RunWorkflowModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onRun={handleRunWorkflow}
      />

      <WorkflowHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        workflowId={workflow.id}
      />
    </div>
  );
};

export default CanvasEditor;
