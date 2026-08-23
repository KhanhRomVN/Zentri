import type { NodeCategory, ExecutionMode } from './common';

/**
 * Workflow node type
 */
export type WorkflowNode = {
  id: string;
  type: string;
  category: NodeCategory;
  title: string;
  subtitle: string;
  note?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pill?: boolean;
  dual?: boolean;
  disabled?: boolean;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Execution configuration
  executionMode?: ExecutionMode; // sequential: chạy tuần tự, conditional: có điều kiện
  maxRetries?: number; // Số lần retry tối đa khi conditional fail
};

/**
 * Node library item
 */
export interface NodeLibItem {
  type: string;
  category: NodeCategory;
  title: string;
  subtitle: string;
  pill?: boolean;
}

/**
 * Node library group
 */
export interface NodeLibGroup {
  group: string;
  items: NodeLibItem[];
}
