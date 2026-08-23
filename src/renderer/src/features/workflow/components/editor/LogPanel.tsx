import { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning' | 'node_start' | 'node_end';
  message: string;
  nodeId?: string;
}

interface LogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export const LogPanel = ({ isOpen, onClose, workflowId }: LogPanelProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [height, setHeight] = useState(200); // Default 1/5 of typical diagram height (1000px)
  const [isResizing, setIsResizing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Load initial logs
  useEffect(() => {
    if (isOpen && workflowId) {
      loadLiveLogs();
    }
  }, [isOpen, workflowId]);

  // Listen for real-time logs
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = window.api.workflow.onLog((logEntry: any) => {
      // Only show logs for this workflow
      if (logEntry.workflowId === workflowId) {
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
      console.error('[LogPanel] Failed to load logs:', error);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Copy all logs to clipboard
  const copyLogs = async () => {
    const logText = logs
      .map(
        (log) =>
          `${formatTime(log.timestamp)} [${log.level.toUpperCase()}]${log.nodeId ? ` [${log.nodeId}]` : ''} ${log.message}`,
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      // Optional: Show a brief success indicator
    } catch (error) {
      console.error('[LogPanel] Failed to copy logs:', error);
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = height;
  };

  // Handle resize
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'node_start':
        return 'text-blue-400';
      case 'node_end':
        return 'text-green-400';
      case 'info':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-text-secondary';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'node_start':
        return 'bg-blue-500/20 border-l-4 border-blue-500';
      case 'node_end':
        return 'bg-green-500/20 border-l-4 border-green-500';
      case 'info':
        return 'bg-primary/10';
      case 'success':
        return 'bg-success/10';
      case 'error':
        return 'bg-error/10';
      case 'warning':
        return 'bg-warning/10';
      default:
        return 'bg-sidebar-item-hover';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'node_start':
        return 'START';
      case 'node_end':
        return 'END';
      default:
        return level.toUpperCase();
    }
  };

  const isNodeMarker = (level: string) => {
    return level === 'node_start' || level === 'node_end';
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  if (!isOpen) return null;

  const panelHeight = `${height}px`;

  return (
    <div
      className="border-t border-border bg-card-background shadow-2xl flex flex-col"
      style={{ height: panelHeight, minHeight: '100px', maxHeight: '600px' }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`h-1 cursor-ns-resize hover:bg-primary/50 transition-colors ${
          isResizing ? 'bg-primary' : 'bg-border/50'
        }`}
        title="Drag to resize"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">Workflow Execution Logs</span>
          <span className="text-xs text-text-secondary">({logs.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy all logs"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-error transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div className="overflow-y-auto flex-1 p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal className="h-12 w-12 text-text-secondary/30 mx-auto mb-3" />
              <div className="text-sm text-text-secondary">
                No logs yet. Run workflow to see execution logs.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-2 rounded ${getLevelBg(log.level)} ${
                  isNodeMarker(log.level) ? 'font-bold' : ''
                }`}
              >
                <span className="text-text-secondary shrink-0">{formatTime(log.timestamp)}</span>
                <span
                  className={`font-semibold uppercase shrink-0 ${getLevelColor(log.level)}`}
                  style={{ minWidth: '60px' }}
                >
                  [{getLevelLabel(log.level)}]
                </span>
                {log.nodeId && (
                  <span
                    className={`shrink-0 ${isNodeMarker(log.level) ? 'text-text-primary font-bold' : 'text-text-secondary'}`}
                  >
                    [{log.nodeId}]
                  </span>
                )}
                <span
                  className={`flex-1 ${isNodeMarker(log.level) ? 'text-text-primary font-semibold' : 'text-text-primary'}`}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
