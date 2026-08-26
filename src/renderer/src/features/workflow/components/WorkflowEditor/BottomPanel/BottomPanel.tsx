import { useState, useEffect, useRef } from 'react';
import { Terminal, AlertCircle, X } from 'lucide-react';
import { Log } from './Log';
import { Error } from './Error';
import type { WorkflowNode } from '../../../types';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning' | 'node_start' | 'node_end';
  message: string;
  nodeId?: string;
}

interface ValidationErrors {
  unconfiguredNodes: string[];
  duplicateEdges: string[];
}

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  validationErrors: ValidationErrors;
  nodes: WorkflowNode[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

type TabType = 'logs' | 'errors';

export const BottomPanel = ({
  isOpen,
  onClose,
  workflowId,
  validationErrors,
  nodes,
  onNodeClick,
  onEdgeClick,
}: BottomPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [height, setHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  const errorCount =
    validationErrors.unconfiguredNodes.length + validationErrors.duplicateEdges.length;

  // Clear logs on mount (when opening workflow editor)
  useEffect(() => {
    // Clear logs when component first mounts or workflowId changes
    setLogs([]);
  }, [workflowId]);

  // Load initial logs - REMOVED to start with empty logs
  // useEffect(() => {
  //   if (isOpen && workflowId) {
  //     loadLiveLogs();
  //   }
  // }, [isOpen, workflowId]);

  // Listen for real-time logs
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = window.api.workflow.onLog((logEntry: any) => {
      if (logEntry.workflowId === workflowId) {
        // If this is the first log of a new workflow execution (starting message), clear previous logs
        if (
          logEntry.message.includes('Starting workflow execution') ||
          logEntry.message.includes('Starting execution for instance')
        ) {
          setLogs([]);
        }

        setLogs((prev) => [
          ...prev,
          {
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            nodeId: logEntry.nodeId,
          },
        ]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, workflowId]);

  const loadLiveLogs = async () => {
    try {
      const result = await window.api.workflow.getLiveLogs(workflowId, 100);

      if (result.success && result.logs) {
        setLogs(
          result.logs.map((log: any) => ({
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            nodeId: log.node_id,
          })),
        );
      }
    } catch (error) {
      console.error('[BottomPanel] Failed to load logs:', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = async () => {
    const logText = logs
      .map(
        (log) =>
          `${log.timestamp} [${log.level.toUpperCase()}]${log.nodeId ? ` [${log.nodeId}]` : ''} ${log.message}`,
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(logText);
    } catch (error) {
      console.error('[BottomPanel] Failed to copy logs:', error);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = height;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(100, Math.min(600, resizeStartHeight.current + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <div
      className="border-t border-border bg-card-background shadow-2xl flex flex-col"
      style={{ height: `${height}px`, minHeight: '100px', maxHeight: '600px' }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`h-1 cursor-ns-resize hover:bg-primary/50 transition-colors ${
          isResizing ? 'bg-primary' : 'bg-border/50'
        }`}
        title="Drag to resize"
      />

      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          {/* Logs Tab */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-primary text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span className="text-sm font-semibold">Logs</span>
            <span className="text-xs text-text-secondary">({logs.length})</span>
          </button>

          {/* Errors Tab */}
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-primary text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">Errors</span>
            {errorCount > 0 && (
              <span className="text-xs bg-error text-white px-1.5 py-0.5 rounded-full">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-error transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' && <Log logs={logs} onClear={clearLogs} onCopy={copyLogs} />}
        {activeTab === 'errors' && (
          <Error
            errors={validationErrors}
            nodes={nodes}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
          />
        )}
      </div>
    </div>
  );
};
