import type { NodeCategory, Platform, WorkflowStatus } from '../types';

/**
 * Metadata for node categories (colors, labels, backgrounds)
 */
export const CATEGORY_META: Record<NodeCategory, { label: string; color: string; bg: string }> = {
  trigger: { label: 'Trigger', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  system: { label: 'System', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  interact: { label: 'Interaction', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  logic: { label: 'Logic', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  timing: { label: 'Timing', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  end: { label: 'End', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

/**
 * Metadata for platforms (colors, labels, backgrounds)
 */
export const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string }> = {
  website: { label: 'Website', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  mobile: { label: 'Mobile', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
};

/**
 * Metadata for workflow statuses (colors, labels, backgrounds)
 */
export const STATUS_META: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  paused: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  draft: { label: 'Draft', color: '#71717a', bg: 'rgba(113, 113, 122, 0.12)' },
  archived: { label: 'Archived', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.12)' },
};
