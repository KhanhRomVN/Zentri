/**
 * Device type
 */
export type DeviceType = 'website' | 'mobile';

/**
 * Workflow status types
 */
export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'archived';

/**
 * Node category types
 */
export type NodeCategory = 'trigger' | 'system' | 'interact' | 'logic' | 'timing' | 'end';

/**
 * Execution mode for nodes
 */
export type ExecutionMode = 'sequential' | 'conditional';