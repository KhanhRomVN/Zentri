import { memo } from 'react';
import { X, Copy, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import type { NodeConnection, WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';
import { cn } from '../../../../shared/lib/utils';

interface InspectorProps {
  node: WorkflowNode;
  connectionsIn: NodeConnection[];
  connectionsOut: NodeConnection[];
  nodeTitles: Record<string, string>;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClose: () => void;
}

export const Inspector = memo(
  ({
    node,
    connectionsIn,
    connectionsOut,
    nodeTitles,
    onUpdate,
    onDelete,
    onDuplicate,
    onClose,
  }: InspectorProps) => {
    const category = CATEGORY_META[node.category];
    const fieldLabel =
      node.category === 'timing'
        ? 'Duration (ms)'
        : node.category === 'logic'
          ? 'Condition Expression'
          : node.category === 'end' || node.category === 'trigger'
            ? 'Note'
            : 'Parameter';

    return (
      <div className="absolute right-4 top-16 flex max-h-[calc(100%-8rem)] w-72 flex-col overflow-hidden rounded-xl border border-border bg-card-background shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: category.bg, color: category.color }}
          >
            {node.category.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[9px] font-bold uppercase tracking-wide"
              style={{ color: category.color }}
            >
              {category.label}
            </div>
            <div className="text-xs font-bold text-text-primary">Step Details</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3.5">
          {!node.pill && (
            <>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  {fieldLabel}
                </label>
                <input
                  value={node.subtitle}
                  onChange={(e) => onUpdate(node.id, { subtitle: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input-background px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  Note
                </label>
                <textarea
                  value={node.note || ''}
                  onChange={(e) => onUpdate(node.id, { note: e.target.value })}
                  rows={2}
                  placeholder="Internal note..."
                  className="w-full resize-none rounded-lg border border-border bg-input-background px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Enable this step</span>
                <button
                  onClick={() => onUpdate(node.id, { disabled: !node.disabled })}
                  className={cn(
                    'relative h-5 w-9 rounded-full transition-colors',
                    node.disabled ? 'bg-border' : 'bg-green',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all',
                      node.disabled ? 'left-0.5' : 'left-[18px]',
                    )}
                  />
                </button>
              </div>
            </>
          )}

          {/* Connections out */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Outgoing Connections
            </label>
            <div className="space-y-1">
              {connectionsOut.length > 0 ? (
                connectionsOut.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-text-secondary"
                  >
                    <ArrowRight className="h-3 w-3 shrink-0 text-text-secondary" />
                    <span className="truncate">→ {nodeTitles[conn.to] || '?'}</span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-text-secondary/50">No outgoing connections.</div>
              )}
            </div>
          </div>

          {/* Connections in */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Incoming Connections
            </label>
            <div className="space-y-1">
              {connectionsIn.length > 0 ? (
                connectionsIn.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-text-secondary"
                  >
                    <ArrowLeft className="h-3 w-3 shrink-0 text-text-secondary" />
                    <span className="truncate">← {nodeTitles[conn.from] || '?'}</span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-text-secondary/50">No incoming connections.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border px-3.5 py-2.5">
          <button
            onClick={() => onDuplicate(node.id)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-sidebar-item-hover hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
          <button
            onClick={() => onDelete(node.id)}
            disabled={node.id === 'start'}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red/30 px-2 py-1.5 text-xs font-semibold text-red transition-colors hover:bg-red/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>
    );
  },
);

Inspector.displayName = 'Inspector';
