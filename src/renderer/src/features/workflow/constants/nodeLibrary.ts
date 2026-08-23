import type { NodeLibGroup, NodeLibItem, Platform } from '../types';

/**
 * Mobile interaction node library
 */
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

/**
 * Mobile system node library
 */
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

/**
 * Web interaction node library
 */
const WEB_INTERACT_GROUP: NodeLibGroup = {
  group: 'Web Interaction',
  items: [
    { type: 'click_web', category: 'interact', title: 'Click', subtitle: 'CSS selector' },
    { type: 'input_web', category: 'interact', title: 'Input Data', subtitle: 'selector : value' },
    { type: 'scroll_web', category: 'interact', title: 'Scroll Page', subtitle: 'down 800px' },
  ],
};

/**
 * Web system node library
 */
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

/**
 * Logic and flow control node library
 */
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

/**
 * Timing node library
 */
const TIMING_GROUP: NodeLibGroup = {
  group: 'Timing',
  items: [
    { type: 'wait', category: 'timing', title: 'Wait (ms)', subtitle: '1000ms' },
    { type: 'schedule', category: 'timing', title: 'Schedule', subtitle: '0 6 * * *' },
  ],
};

/**
 * Debug and recording node library
 */
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

/**
 * Get node library for a specific platform
 */
export function getNodeLibrary(platform: Platform): NodeLibGroup[] {
  return platform === 'website'
    ? [WEB_INTERACT_GROUP, WEB_SYSTEM_GROUP, LOGIC_GROUP, TIMING_GROUP, DEBUG_GROUP]
    : [MOBILE_INTERACT_GROUP, MOBILE_SYSTEM_GROUP, LOGIC_GROUP, TIMING_GROUP, DEBUG_GROUP];
}

/**
 * Find a node item by type in the library
 */
export function findNodeItem(platform: Platform, type: string): NodeLibItem | null {
  for (const group of getNodeLibrary(platform)) {
    const found = group.items.find((item) => item.type === type);
    if (found) return found;
  }
  return null;
}
