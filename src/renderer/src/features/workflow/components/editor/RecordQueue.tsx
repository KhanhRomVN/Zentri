import { memo, useCallback } from 'react';
import { X, Trash2, ArrowRight, Settings } from 'lucide-react';
import type { WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';
import { cn } from '../../../../shared/lib/utils';

interface RecordQueueProps {
  nodes: WorkflowNode[];
  autoAdd: boolean;
  onAutoAddToggle: () => void;
  onAddNode: (node: WorkflowNode) => void;
  onRemoveNode: (nodeId: string) => void;
  onClearAll: () => void;
}

const CATEGORY_ICONS_MAP: Record<string, string> = {
  trigger: '▶',
  system: '⚙',
  interact: '👆',
  logic: '◆',
  timing: '⏱',
  end: '■',
};

export const RecordQueue = memo(
  ({ nodes, autoAdd, onAutoAddToggle, onAddNode, onRemoveNode, onClearAll }: RecordQueueProps) => {
    const handleDragStart = useCallback((e: React.DragEvent, node: WorkflowNode) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
      e.dataTransfer.setData('source', 'queue');
    }, []);

    return (
      <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-text-primary">Record Queue</span>
          </div>
          <span className="rounded bg-sidebar-item-hover px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
            {nodes.length}
          </span>
        </div>

        {/* Auto-add toggle */}
        <div className="border-b border-border px-3 py-2">
          <button
            onClick={onAutoAddToggle}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
              autoAdd
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-sidebar-item hover:bg-sidebar-item-hover text-text-secondary',
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="flex-1 text-left font-medium">Auto-add: {autoAdd ? 'ON' : 'OFF'}</span>
            <div
              className={cn(
                'h-4 w-7 rounded-full transition-colors',
                autoAdd ? 'bg-primary' : 'bg-border',
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  autoAdd ? 'translate-x-3' : 'translate-x-0',
                )}
              />
            </div>
          </button>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto p-2">
          {nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-2 rounded-lg bg-sidebar-item p-3">
                <ArrowRight className="h-6 w-6 text-text-secondary" />
              </div>
              <p className="text-xs font-medium text-text-secondary">No recorded nodes</p>
              <p className="mt-1 text-[10px] text-text-tertiary">Start recording to add nodes</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {nodes.map((node) => {
                const category = CATEGORY_META[node.category];
                const icon = CATEGORY_ICONS_MAP[node.category] || '•';

                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    className="group relative cursor-move rounded-lg border border-border bg-card-background p-2 shadow-sm transition-all hover:border-primary hover:shadow-md"
                  >
                    {/* Category indicator */}
                    <div
                      className="absolute bottom-0 left-0 top-0 w-1 rounded-l-lg"
                      style={{ background: category.color }}
                    />

                    {/* Content */}
                    <div className="ml-2 flex items-start gap-2">
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs"
                        style={{ background: category.bg, color: category.color }}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-text-primary">
                          {node.title || 'Untitled'}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-text-secondary">
                          {node.subtitle || '\u00a0'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!autoAdd && (
                          <button
                            onClick={() => onAddNode(node)}
                            className="rounded p-1 text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Add to canvas"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveNode(node.id)}
                          className="rounded p-1 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {nodes.length > 0 && (
          <div className="border-t border-border p-2">
            <button
              onClick={onClearAll}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-item px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>
    );
  },
);

RecordQueue.displayName = 'RecordQueue';
