import type { WorkflowNode } from '../types';
import { NODE_DEFAULTS } from '../constants/nodeDefaults';

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Format time from ISO string to readable format
 */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
}

/**
 * Format timestamp to localized date time
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Get display title for action type
 */
export function getActionTitle(actionType: string): string {
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
  return titleMap[actionType] || actionType;
}

/**
 * Create a duplicate node with new ID and position
 */
export function duplicateNode(node: WorkflowNode, offsetX = 34, offsetY = 34): WorkflowNode {
  return {
    ...JSON.parse(JSON.stringify(node)),
    id: generateId('n'),
    title: node.title ? `${node.title} (copy)` : '',
    x: node.x + offsetX,
    y: node.y + offsetY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new node at position
 */
export function createNodeAt(
  type: string,
  category: string,
  position: { x: number; y: number },
  isPill = false,
): WorkflowNode {
  const w = isPill ? NODE_DEFAULTS.pillWidth : NODE_DEFAULTS.nodeWidth;
  const h = isPill ? NODE_DEFAULTS.pillHeight : NODE_DEFAULTS.nodeHeight;

  return {
    id: generateId('n'),
    type,
    category,
    title: '',
    subtitle: '',
    note: '',
    x: Math.round(position.x - w / 2),
    y: Math.round(position.y - h / 2),
    w,
    h,
    pill: isPill,
    dual: type === 'if' || type === 'element_check',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
