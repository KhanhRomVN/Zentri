import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Play,
  Terminal,
  MousePointerClick,
  GitBranch,
  Clock,
  Flag,
  Copy,
  Trash2,
  Lock,
  Unlock,
  MoreHorizontal,
  Edit3,
} from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { CATEGORY_META } from '../../constants';
import { cn } from '../../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../../../../components/ui/Dropdown';
import { Kbd } from '../../../../components/ui/Kbd/Kbd';

type WorkflowNodeComponentProps = NodeProps & {
  data: WorkflowNode &
    Record<string, unknown> & {
      onDuplicate?: (id: string) => void;
      onDelete?: (id: string) => void;
      onLockToggle?: (id: string) => void;
      onClearContent?: (id: string) => void;
      onCopy?: (id: string) => void;
      onAddConnection?: (nodeId: string, direction: 'top' | 'right' | 'bottom' | 'left') => void;
      onOpenModal?: (id: string) => void;
      selectedNodesCount?: number;
      editModalOpen?: boolean;
      nodeContextMenuCloseSignal?: number;
      hasIncoming?: boolean;
      hasOutgoing?: boolean;
    };
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger: Play,
  system: Terminal,
  interact: MousePointerClick,
  logic: GitBranch,
  timing: Clock,
  end: Flag,
};

export const WorkflowNodeComponent = memo(({ data, selected }: WorkflowNodeComponentProps) => {
  const node = data as WorkflowNode & WorkflowNodeComponentProps['data'];
  const category = CATEGORY_META[node.category];
  const Icon = CATEGORY_ICONS[node.category] || Terminal;
  const needsWarning = !node.subtitle && node.type !== 'end';
  const selectedNodesCount = node.selectedNodesCount || 0;

  const [toolbarScreenPosition, setToolbarScreenPosition] = useState({ x: 0, y: 0 });
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  // Calculate toolbar position
  useEffect(() => {
    if (!selected || !nodeRef.current || selectedNodesCount > 1 || node.editModalOpen) return;

    const updateToolbarPosition = () => {
      const rect = nodeRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const position = spaceAbove > spaceBelow ? 'top' : 'bottom';
      const toolbarHeight = 56;
      const toolbarGap = 28;
      const centerX = rect.left + rect.width / 2;
      const y =
        position === 'top' ? rect.top - toolbarHeight - toolbarGap : rect.bottom + toolbarGap;
      setToolbarScreenPosition({ x: centerX, y });
    };

    updateToolbarPosition();
    const interval = setInterval(updateToolbarPosition, 100);
    return () => clearInterval(interval);
  }, [selected, selectedNodesCount, node.editModalOpen]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuOpen) setContextMenuOpen(false);
    };
    if (contextMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [contextMenuOpen]);

  // Close context menu when canvas context menu opens
  useEffect(() => {
    if (node.nodeContextMenuCloseSignal && node.nodeContextMenuCloseSignal > 0) {
      setContextMenuOpen(false);
    }
  }, [node.nodeContextMenuCloseSignal]);

  return (
    <div
      ref={nodeRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
        setContextMenuOpen(true);
      }}
      className={cn(
        'relative cursor-grab select-none border shadow-md transition-all hover:border-border-hover active:cursor-grabbing rounded-r-md min-w-[180px]',
        selected && 'ring-2 ring-primary',
        node.disabled && 'opacity-50',
        node.locked && 'cursor-not-allowed',
      )}
      style={{ background: 'rgb(var(--card-background))' }}
    >
      {/* Category bar */}
      <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: category.color }} />

      {/* Content */}
      <div className="flex items-center gap-2 pl-3 pr-2 pt-2 pb-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: category.bg, color: category.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-text-primary">{node.title}</div>
          <div className="mt-0.5 truncate text-[10px] text-text-secondary">
            {node.subtitle || '\u00a0'}
          </div>
        </div>
        {node.locked && <Lock className="h-3 w-3 text-text-secondary shrink-0 mt-0.5" />}
      </div>

      {/* Warning badge */}
      {needsWarning && (
        <div className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-sm bg-card-background border border-yellow">
          <AlertTriangle className="h-2.5 w-2.5 text-yellow" />
        </div>
      )}

      {/* Hidden handles for normal connections */}
      {/* Bar (target) - not connectable if already has incoming edge */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        isConnectable={!node.hasIncoming}
        style={{
          background: 'rgb(var(--card-background))',
          border: `2px solid ${category.color}`,
        }}
      />
      {/* Dot (source) - not connectable if already has outgoing edge */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        isConnectable={!node.hasOutgoing}
        style={{
          background: 'rgb(var(--card-background))',
          border: `2px solid ${category.color}`,
        }}
      />

      {/* Toolbar */}
      {selected &&
        !node.locked &&
        selectedNodesCount === 1 &&
        !node.editModalOpen &&
        createPortal(
          <div
            className="fixed flex items-center gap-1.5 bg-card-background border border-border rounded-lg p-1.5 shadow-lg z-[9999]"
            style={{
              left: `${toolbarScreenPosition.x}px`,
              top: `${toolbarScreenPosition.y}px`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                node.onOpenModal?.(node.id);
              }}
              className="p-2 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
              style={{ pointerEvents: 'auto' }}
              title="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-0.5" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                node.onDuplicate?.(node.id);
              }}
              className="p-2 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
              style={{ pointerEvents: 'auto' }}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                node.onDelete?.(node.id);
              }}
              className="p-2 rounded hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
              style={{ pointerEvents: 'auto' }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                node.onLockToggle?.(node.id);
              }}
              className="p-2 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
              style={{ pointerEvents: 'auto' }}
              title="Lock"
            >
              {node.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <div className="w-px h-5 bg-border mx-0.5" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuPosition({ top: e.clientY, left: e.clientX });
                setContextMenuOpen(true);
              }}
              className="p-2 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
              style={{ pointerEvents: 'auto' }}
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>,
          document.body,
        )}

      {/* Context menu */}
      {contextMenuOpen &&
        createPortal(
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
              <DropdownItem
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => node.onCopy?.(node.id)}
              >
                Copy <Kbd className="ml-auto">Ctrl+C</Kbd>
              </DropdownItem>
              <DropdownItem
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => node.onDuplicate?.(node.id)}
              >
                Duplicate <Kbd className="ml-auto">Ctrl+D</Kbd>
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => node.onDelete?.(node.id)}
                variant="error"
              >
                Delete <Kbd className="ml-auto">Del</Kbd>
              </DropdownItem>
              <DropdownItem
                icon={<Terminal className="h-3.5 w-3.5" />}
                onClick={() => node.onClearContent?.(node.id)}
              >
                Clear content <Kbd className="ml-auto">Ctrl+⌫</Kbd>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                icon={
                  node.locked ? (
                    <Unlock className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )
                }
                onClick={() => node.onLockToggle?.(node.id)}
              >
                {node.locked ? 'Unlock' : 'Lock'} <Kbd className="ml-auto">Ctrl+Shift+L</Kbd>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}
    </div>
  );
});

WorkflowNodeComponent.displayName = 'WorkflowNodeComponent';
