export type Platform = 'website' | 'mobile';
export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'archived';
export type NodeCategory = 'trigger' | 'system' | 'interact' | 'logic' | 'timing' | 'end';

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
  // New condition system
  executionMode?: 'sequential' | 'conditional'; // sequential: chạy tuần tự, conditional: có điều kiện
  maxRetries?: number; // Số lần retry tối đa khi conditional fail
};

export interface NodeConnection {
  id: string;
  from: string;
  fromSide: 'out' | 'success' | 'error'; // out: sequential, success: conditional success, error: conditional error
  to: string;
  toSide: 'in';
  label?: string;
  color?: string;
  route?: 'loop';
  isError?: boolean; // true nếu 1 dot kết nối tới 2 node (invalid state)
}

export interface WorkflowHistory {
  status: 'passed' | 'failed';
  duration: string;
  triggeredBy: string;
  time: string;
}

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

export interface NodeLibItem {
  type: string;
  category: NodeCategory;
  title: string;
  subtitle: string;
  pill?: boolean;
}

export interface NodeLibGroup {
  group: string;
  items: NodeLibItem[];
}
