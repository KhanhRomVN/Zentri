export const NODE_DEFAULTS = {
  // Selector defaults
  selectorType: 'id',

  // Execution mode defaults
  executionMode: 'sequential' as 'sequential' | 'conditional',
  maxRetries: 0,
  skipNotFound: false,
  retryCount: 2,

  // Timing defaults
  delay: 1000, // 1 second
  timeout: 3000, // 3 seconds
  typingDelay: 50, // 50ms

  // Action-specific defaults
  waitElement: true,
  clickType: 'Left click',
  clearBefore: true,
  assertType: 'Is Visible',

  // Node dimensions
  nodeWidth: 208,
  nodeHeight: 76,
  pillWidth: 136,
  pillHeight: 46,
} as const;

export const SELECTOR_TYPES = ['id', 'xpath', 'css', 'testid', 'class'] as const;
export type SelectorType = (typeof SELECTOR_TYPES)[number];

export const CLICK_TYPES = ['Left click', 'Double click', 'Right click'] as const;
export type ClickType = (typeof CLICK_TYPES)[number];

export const ASSERT_TYPES = ['Is Visible', 'Is Hidden', 'Contains Text', 'Has Attribute'] as const;
export type AssertType = (typeof ASSERT_TYPES)[number];

export const EXECUTION_MODES = ['sequential', 'conditional'] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];
