import { useEffect, useRef } from 'react';
import { Terminal, Copy, Trash2 } from 'lucide-react';
import { formatTime, getLevelColor, getLevelBg, getLevelLabel, isNodeMarker } from '../../../utils';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning' | 'node_start' | 'node_end';
  message: string;
  nodeId?: string;
}

interface LogProps {
  logs: LogEntry[];
  onClear: () => void;
  onCopy: () => void;
}

export const Log = ({ logs, onClear, onCopy }: LogProps) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{logs.length} entries</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            disabled={logs.length === 0}
            className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy all logs"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="p-1.5 rounded-md text-text-secondary hover:bg-sidebar-item-hover hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
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
