import type { NodeCategory, NodeLibGroup, NodeLibItem, Platform, WorkflowStatus } from '../types';

export const CATEGORY_META: Record<NodeCategory, { label: string; color: string; bg: string }> = {
  trigger: { label: 'Trigger', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  system: { label: 'System', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  interact: { label: 'Interaction', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  logic: { label: 'Logic', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  timing: { label: 'Timing', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  end: { label: 'End', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

export const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string }> = {
  website: { label: 'Website', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  mobile: { label: 'Mobile', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
};

export const STATUS_META: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  paused: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  draft: { label: 'Draft', color: '#71717a', bg: 'rgba(113, 113, 122, 0.12)' },
  archived: { label: 'Archived', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.12)' },
};

const MOBILE_INTERACT_GROUP: NodeLibGroup = {
  group: 'Mobile Interaction',
  items: [
    { type: 'tap', category: 'interact', title: 'Tap', subtitle: 'x,y coordinates' },
    {
      type: 'swipe',
      category: 'interact',
      title: 'Swipe / Scroll',
      subtitle: '500,1300 → 500,300',
    },
    { type: 'longpress', category: 'interact', title: 'Long Press', subtitle: 'hold 900ms' },
    {
      type: 'open_url',
      category: 'interact',
      title: 'Open App / Screen',
      subtitle: 'screen://... or URL',
    },
    { type: 'keyboard', category: 'interact', title: 'Keyboard', subtitle: 'input text' },
    {
      type: 'quick_phrase',
      category: 'interact',
      title: 'Quick Phrase',
      subtitle: 'saved phrase templates',
    },
  ],
};

const MOBILE_SYSTEM_GROUP: NodeLibGroup = {
  group: 'Device System',
  items: [
    { type: 'restart', category: 'system', title: 'Restart Device', subtitle: 'restart' },
    { type: 'install_apk', category: 'system', title: 'Install APK', subtitle: 'file.apk' },
    { type: 'get_clipboard', category: 'system', title: 'Get Clipboard', subtitle: '—' },
    { type: 'adb', category: 'system', title: 'Custom ADB Command', subtitle: 'adb shell ...' },
    { type: 'stop_app', category: 'system', title: 'Stop App', subtitle: 'com.facebook.katana' },
    {
      type: 'lock_screen',
      category: 'system',
      title: 'Lock Screen Read',
      subtitle: 'keep scroll position',
    },
  ],
};

const WEB_INTERACT_GROUP: NodeLibGroup = {
  group: 'Web Interaction',
  items: [
    { type: 'click_web', category: 'interact', title: 'Click', subtitle: 'CSS selector' },
    { type: 'input_web', category: 'interact', title: 'Input Data', subtitle: 'selector : value' },
    { type: 'scroll_web', category: 'interact', title: 'Scroll Page', subtitle: 'down 800px' },
  ],
};

const WEB_SYSTEM_GROUP: NodeLibGroup = {
  group: 'System & Browser',
  items: [
    { type: 'navigate', category: 'interact', title: 'Navigate', subtitle: 'https://...' },
    { type: 'reload', category: 'system', title: 'Reload Page', subtitle: '—' },
    {
      type: 'execute_js',
      category: 'system',
      title: 'Execute JavaScript',
      subtitle: 'document.querySelector...',
    },
    {
      type: 'http_request',
      category: 'system',
      title: 'HTTP Request',
      subtitle: 'GET https://api...',
    },
  ],
};

const LOGIC_GROUP: NodeLibGroup = {
  group: 'Logic & Flow',
  items: [
    { type: 'if', category: 'logic', title: 'If (Expression)', subtitle: 'variable.x == true' },
    {
      type: 'element_check',
      category: 'logic',
      title: 'Element Visible?',
      subtitle: 'selector = .el',
    },
    {
      type: 'run_workflow',
      category: 'logic',
      title: 'Run Child Workflow',
      subtitle: 'select workflow...',
    },
    { type: 'end', category: 'end', title: 'End', subtitle: '', pill: true },
  ],
};

const TIMING_GROUP: NodeLibGroup = {
  group: 'Timing',
  items: [
    { type: 'wait', category: 'timing', title: 'Wait (ms)', subtitle: '1000ms' },
    { type: 'schedule', category: 'timing', title: 'Schedule', subtitle: '0 6 * * *' },
  ],
};

const DEBUG_GROUP: NodeLibGroup = {
  group: 'Record & Debug',
  items: [
    { type: 'record', category: 'system', title: 'Record Action', subtitle: '—' },
    { type: 'screenshot', category: 'system', title: 'Screenshot', subtitle: '—' },
    {
      type: 'run_action',
      category: 'logic',
      title: 'Run Saved Action',
      subtitle: 'select action...',
    },
    { type: 'note', category: 'system', title: 'Sticky Note', subtitle: 'Add note...' },
  ],
};

export function getNodeLibrary(platform: Platform): NodeLibGroup[] {
  return platform === 'website'
    ? [WEB_INTERACT_GROUP, WEB_SYSTEM_GROUP, LOGIC_GROUP, TIMING_GROUP, DEBUG_GROUP]
    : [MOBILE_INTERACT_GROUP, MOBILE_SYSTEM_GROUP, LOGIC_GROUP, TIMING_GROUP, DEBUG_GROUP];
}

export function findNodeItem(platform: Platform, type: string): NodeLibItem | null {
  for (const group of getNodeLibrary(platform)) {
    const found = group.items.find((item) => item.type === type);
    if (found) return found;
  }
  return null;
}
