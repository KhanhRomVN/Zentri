import React, { memo, useState, useRef, useEffect } from 'react';
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
import { Tooltip } from '../shared/Tooltip';

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
      onAddToQueue?: (id: string) => void;
      selectedNodesCount?: number;
      editModalOpen?: boolean;
      nodeContextMenuCloseSignal?: number;
      hasIncoming?: boolean;
      hasOutgoing?: boolean;
      isExecuting?: boolean; // New prop for execution animation
      isIsolated?: boolean; // New prop for isolated node validation
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

  // Parse config to get action type and determine icon/color
  let displayTitle = node.title;
  let displayIcon = Icon;
  let displayColor = category.color;
  let displayBg = category.bg;
  let displaySubtitle = node.subtitle || '\u00a0';
  let hasValidConfig = false; // Track if node has valid configuration

  try {
    if (node.note) {
      const parsed = JSON.parse(node.note);
      const actionType = parsed?.config?.action;
      const scrollType = parsed?.config?.scrollType;
      const scrollPixels = parsed?.config?.scrollPixels;
      const scrollWait = parsed?.config?.scrollWait;
      const scrollRepeat = parsed?.config?.scrollRepeat;

      console.log(`[WorkflowNode ${node.id}] Parsing config:`, {
        nodeId: node.id,
        nodeType: node.type,
        actionType,
        scrollType,
        subtitle: node.subtitle,
        hasNote: !!node.note,
      });

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

      // Override icon and color based on action type
      if (actionType === 'go_to_url') {
        displayIcon = () => (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        );
        displayColor = 'rgb(6, 182, 212)'; // cyan-500
        displayBg = 'rgba(6, 182, 212, 0.1)'; // cyan-500/10
        // go_to_url has subtitle (URL), so it's valid
        if (node.subtitle) {
          hasValidConfig = true;
          console.log(`[WorkflowNode ${node.id}] go_to_url with subtitle, hasValidConfig=true`);
        }
      } else if (actionType === 'scroll') {
        displayIcon = () => (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        );
        displayColor = 'rgb(249, 115, 22)'; // orange-500
        displayBg = 'rgba(249, 115, 22, 0.1)'; // orange-500/10

        // Generate subtitle for scroll action
        if (scrollType === 'pixels') {
          displaySubtitle = `${scrollRepeat || 1}x scroll ${scrollPixels || 500}px, chờ ${scrollWait || 1000}ms`;
          hasValidConfig = true; // Scroll by pixels doesn't need selector
          console.log(
            `[WorkflowNode ${node.id}] scroll by pixels, hasValidConfig=true, subtitle="${displaySubtitle}"`,
          );
        } else if (node.subtitle) {
          displaySubtitle = node.subtitle;
          hasValidConfig = true; // Has selector
          console.log(
            `[WorkflowNode ${node.id}] scroll to element with subtitle, hasValidConfig=true`,
          );
        }
      } else if (node.subtitle) {
        // Other actions with subtitle are valid
        hasValidConfig = true;
        console.log(`[WorkflowNode ${node.id}] other action with subtitle, hasValidConfig=true`);
      }
    } else if (node.subtitle) {
      // No config but has subtitle means it's valid
      hasValidConfig = true;
      console.log(`[WorkflowNode ${node.id}] no config but has subtitle, hasValidConfig=true`);
    }
  } catch (error) {
    console.log(`[WorkflowNode ${node.id}] Error parsing config:`, error);
    // If parsing fails but has subtitle, still valid
    if (node.subtitle) {
      hasValidConfig = true;
      console.log(`[WorkflowNode ${node.id}] parse error but has subtitle, hasValidConfig=true`);
    }
  }

  console.log(`[WorkflowNode ${node.id}] Final check:`, {
    nodeId: node.id,
    nodeType: node.type,
    hasValidConfig,
    isIsolated: node.isIsolated,
  });

  // Check if node needs warning badge
  // Show warning only if: no valid config AND not start/end node, OR is isolated
  const needsWarning =
    (!hasValidConfig && node.type !== 'end' && node.type !== 'start') || node.isIsolated;

  // Generate warning message for tooltip
  const getWarningMessage = () => {
    if (node.isIsolated) {
      return 'Not connected to any edge in the workflow';
    }
    if (!hasValidConfig) {
      return 'Missing configuration (title or action data)';
    }
    return '';
  };

  console.log(`[WorkflowNode ${node.id}] Warning badge decision:`, {
    nodeId: node.id,
    needsWarning,
    reason: needsWarning
      ? node.isIsolated
        ? 'isolated node'
        : 'no valid config and not start/end'
      : 'all good',
  });

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
      const toolbarGap = 14;
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
      <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: displayColor }} />

      {/* Execution animation border (top, right, bottom - exclude left) */}
      {node.isExecuting && (
        <div
          className="absolute inset-0 pointer-events-none rounded-r-md"
          style={{
            borderTop: `2px dashed ${displayColor}`,
            borderRight: `2px dashed ${displayColor}`,
            borderBottom: `2px dashed ${displayColor}`,
            borderLeft: 'none',
            strokeDasharray: '5 5',
            animation: 'dash-flow 1s linear infinite',
          }}
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-2 pl-3 pr-2 pt-2 pb-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: displayBg, color: displayColor }}
        >
          {React.createElement(displayIcon, { className: 'h-3.5 w-3.5' })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-text-primary">{displayTitle}</div>
          <div className="mt-0.5 truncate text-[10px] text-text-secondary">{displaySubtitle}</div>
        </div>
        {node.locked && <Lock className="h-3 w-3 text-text-secondary shrink-0 mt-0.5" />}
      </div>

      {/* Warning badge */}
      {needsWarning && (
        <div className="absolute -right-1 -top-1 z-10">
          <Tooltip content={getWarningMessage()} side="right">
            <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-card-background border border-yellow">
              <AlertTriangle className="h-2.5 w-2.5 text-yellow" />
            </div>
          </Tooltip>
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
          border: `2px solid ${displayColor}`,
        }}
      />

      {/* Source handles - conditional or sequential */}
      {node.executionMode === 'conditional' ? (
        <>
          {/* Success handle (green dot on left - 1/3 position) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="success"
            isConnectable={!node.hasOutgoing}
            style={{
              left: 'calc(33.33%)',
              background: 'rgb(var(--card-background))',
              border: '2px solid rgb(var(--success))',
            }}
          />
          {/* Error handle (red dot on right - 2/3 position) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="error"
            isConnectable={!node.hasOutgoing}
            style={{
              left: 'calc(66.66%)',
              background: 'rgb(var(--card-background))',
              border: '2px solid rgb(var(--error))',
            }}
          />
        </>
      ) : (
        /* Sequential handle (single dot) */
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          isConnectable={!node.hasOutgoing}
          style={{
            background: 'rgb(var(--card-background))',
            border: `2px solid ${displayColor}`,
          }}
        />
      )}

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
            {/* Edit button - hide for start node */}
            {node.type !== 'start' && node.id !== 'start' && (
              <>
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
                    node.onAddToQueue?.(node.id);
                  }}
                  className="p-2 rounded hover:bg-sidebar-item-hover text-text-secondary hover:text-text-primary transition-colors"
                  style={{ pointerEvents: 'auto' }}
                  title="Move to Queue"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 7h18M3 12h18M3 17h18" />
                    <path d="M14 3l7 7-7 7" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-border mx-0.5" />
              </>
            )}
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
