import type { Platform, WorkflowStatus } from './common';
import type { WorkflowNode } from './node';
import type { NodeConnection } from './connection';

/**
 * Workflow history entry
 */
export interface WorkflowHistory {
  status: 'passed' | 'failed';
  duration: string;
  triggeredBy: string;
  time: string;
}

/**
 * Main workflow type
 */
export interface Workflow {
  id: string;
  name: string;
  platform: Platform;
  status: WorkflowStatus;
  tags: string[];
  owner: {
    name: string;
    initials: string;
  };
  description: string;
  createdAt: string;
  updatedAt: string;
  successRate: number;
  lastRun: {
    status: 'passed' | 'failed' | 'none';
    time: string;
  };
  history: WorkflowHistory[];
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}
