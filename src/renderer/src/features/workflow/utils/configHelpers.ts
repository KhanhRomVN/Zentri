import { NODE_DEFAULTS } from '../constants/nodeDefaults';

export interface NodeConfig {
  url?: string;
  element?: string;
  selectorType?: string;
  screenshot?: string;
  elementBounds?: any;
  config?: {
    action?: string;
    executionMode?: 'sequential' | 'conditional';
    maxRetries?: number;
    skipNotFound?: boolean;
    retryCount?: number;
    delay?: number;
    screenshot?: boolean;
    timeout?: number;
    waitElement?: boolean;
    clickType?: string;
    clearBefore?: boolean;
    typingDelay?: number;
    assertType?: string;
    url?: string;
    scrollType?: 'element' | 'pixels';
    scrollPixels?: number;
    scrollWait?: number;
    scrollRepeat?: number;
  };
}

/**
 * Parse node config from JSON note
 */
export function parseNodeConfig(note: string): NodeConfig | null {
  try {
    return JSON.parse(note || '{}');
  } catch {
    return null;
  }
}

/**
 * Build updated node config
 */
export function buildNodeConfig(
  existingConfig: NodeConfig | null,
  updates: Partial<NodeConfig>,
): NodeConfig {
  return {
    ...existingConfig,
    ...updates,
    config: {
      ...existingConfig?.config,
      ...updates.config,
    },
  };
}

/**
 * Convert node config to JSON string
 */
export function stringifyNodeConfig(config: NodeConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Get default config values for a specific action type
 */
export function getDefaultConfigForAction(actionType: string): Partial<NodeConfig['config']> {
  const defaults: Partial<NodeConfig['config']> = {
    action: actionType,
    executionMode: NODE_DEFAULTS.executionMode,
    maxRetries: NODE_DEFAULTS.maxRetries,
    skipNotFound: NODE_DEFAULTS.skipNotFound,
    retryCount: NODE_DEFAULTS.retryCount,
    delay: NODE_DEFAULTS.delay,
    timeout: NODE_DEFAULTS.timeout,
  };

  // Action-specific defaults
  if (actionType === 'click') {
    defaults.waitElement = NODE_DEFAULTS.waitElement;
    defaults.clickType = NODE_DEFAULTS.clickType;
  } else if (actionType === 'type') {
    defaults.clearBefore = NODE_DEFAULTS.clearBefore;
    defaults.typingDelay = NODE_DEFAULTS.typingDelay;
  } else if (actionType === 'assert') {
    defaults.assertType = NODE_DEFAULTS.assertType;
  } else if (actionType === 'scroll') {
    defaults.scrollType = NODE_DEFAULTS.scrollType;
    defaults.scrollPixels = NODE_DEFAULTS.scrollPixels;
    defaults.scrollWait = NODE_DEFAULTS.scrollWait;
    defaults.scrollRepeat = NODE_DEFAULTS.scrollRepeat;
  }

  return defaults;
}

/**
 * Check if config has any non-default values
 */
export function hasConfiguredValues(
  subtitle: string,
  config: Partial<NodeConfig['config']>,
  selectorType: string,
): boolean {
  // Check if selector has value
  if (subtitle && subtitle.trim() !== '') return true;

  // Check if any config has been changed from defaults
  if (selectorType !== NODE_DEFAULTS.selectorType) return true;
  if (config.executionMode !== NODE_DEFAULTS.executionMode) return true;
  if (config.maxRetries !== NODE_DEFAULTS.maxRetries) return true;
  if (config.skipNotFound !== NODE_DEFAULTS.skipNotFound) return true;
  if (config.retryCount !== NODE_DEFAULTS.retryCount) return true;
  if (config.delay !== NODE_DEFAULTS.delay) return true;
  if (config.timeout !== NODE_DEFAULTS.timeout) return true;
  if (config.waitElement !== NODE_DEFAULTS.waitElement) return true;
  if (config.clickType !== NODE_DEFAULTS.clickType) return true;
  if (config.clearBefore !== NODE_DEFAULTS.clearBefore) return true;
  if (config.typingDelay !== NODE_DEFAULTS.typingDelay) return true;
  if (config.assertType !== NODE_DEFAULTS.assertType) return true;
  if (config.scrollType !== NODE_DEFAULTS.scrollType) return true;
  if (config.scrollPixels !== NODE_DEFAULTS.scrollPixels) return true;
  if (config.scrollWait !== NODE_DEFAULTS.scrollWait) return true;
  if (config.scrollRepeat !== NODE_DEFAULTS.scrollRepeat) return true;

  return false;
}
