import { memo, useCallback } from 'react';
import { X, Play, Terminal, MousePointerClick, GitBranch, Clock, Flag } from 'lucide-react';
import type { WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';

interface RecordQueueProps {
  nodes: WorkflowNode[];
  onAddNode: (node: WorkflowNode) => void;
  onRemoveNode: (nodeId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger: Play,
  system: Terminal,
  interact: MousePointerClick,
  logic: GitBranch,
  timing: Clock,
  end: Flag,
};

export const RecordQueue = memo(({ nodes, onAddNode, onRemoveNode }: RecordQueueProps) => {
  const handleDragStart = useCallback((e: React.DragEvent, node: WorkflowNode) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'queue-node',
        node: node,
      }),
    );
  }, []);

  const handleDragEnd = useCallback(
    (e: React.DragEvent, node: WorkflowNode) => {
      // Check if drop was successful (dropEffect is not 'none')
      if (e.dataTransfer.dropEffect !== 'none') {
        // Node was successfully dropped, remove it from queue
        onRemoveNode(node.id);
      }
    },
    [onRemoveNode],
  );

  return (
    <div className="flex h-full w-80 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-bold text-text-primary">Record Queue</span>
        <span className="rounded bg-sidebar-item-hover px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
          {nodes.length}
        </span>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-2">
        {nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 rounded-lg bg-sidebar-item p-3">
              <MousePointerClick className="h-6 w-6 text-text-secondary" />
            </div>
            <p className="text-xs font-medium text-text-secondary">No recorded nodes</p>
            <p className="mt-1 text-[10px] text-text-tertiary">Start recording to add nodes</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {nodes.map((node) => {
              const category = CATEGORY_META[node.category];
              const Icon = CATEGORY_ICONS[node.category] || Terminal;

              // Extract action from node data
              let displayTitle = node.title;
              let displaySubtitle = node.subtitle || '\u00a0';

              // Parse config to get action type
              try {
                if (node.note) {
                  const parsed = JSON.parse(node.note);
                  const actionType = parsed?.config?.action;
                  const scrollType = parsed?.config?.scrollType;
                  const scrollPixels = parsed?.config?.scrollPixels;
                  const scrollWait = parsed?.config?.scrollWait;
                  const scrollRepeat = parsed?.config?.scrollRepeat;

                  // If title is empty, use action type as title
                  if ((!displayTitle || displayTitle.trim() === '') && actionType) {
                    const titleMap: Record<string, string> = {
                      click: 'Click',
                      type: 'Type Text',
                      hover: 'Hover',
                      scroll: 'Scroll To',
                      assert: 'Assert Visible',
                      go_to_url: 'Go to URL',
                      wait: 'Wait',
                      screenshot: 'Take Screenshot',
                      extract: 'Extract Text',
                      reload: 'Reload Page',
                      go_back: 'Go Back',
                      go_forward: 'Go Forward',
                      close_tab: 'Close Tab',
                      new_tab: 'New Tab',
                    };
                    displayTitle = titleMap[actionType] || actionType;
                  }

                  // Generate subtitle for scroll action
                  if (actionType === 'scroll' && scrollType === 'pixels') {
                    displaySubtitle = `${scrollRepeat || 1}x scroll ${scrollPixels || 500}px, chờ ${scrollWait || 1000}ms`;
                  }
                }
              } catch {
                // Keep original title if parsing fails
                const action = node.type.replace(/_web$/, '').replace(/_/g, ' ');
                displayTitle = action.charAt(0).toUpperCase() + action.slice(1);
              }

              return (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node)}
                  onDragEnd={(e) => handleDragEnd(e, node)}
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: category.bg, color: category.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-text-primary">
                        {displayTitle}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-text-secondary">
                        {displaySubtitle}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
    </div>
  );
});

RecordQueue.displayName = 'RecordQueue';
