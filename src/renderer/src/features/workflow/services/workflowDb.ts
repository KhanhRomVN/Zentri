import type { Workflow } from '../types';

/**
 * Database service for Workflow operations
 */

export interface WorkflowDbRecord {
  id: string;
  name: string;
  description: string;
  platform: 'website' | 'mobile';
  status: 'active' | 'paused' | 'draft' | 'archived';
  tags: string; // JSON array
  owner_name: string;
  owner_initials: string;
  nodes: string; // JSON array
  connections: string; // JSON array
  success_rate: number;
  last_run_status: 'passed' | 'failed' | 'none';
  last_run_time: string | null;
  history: string; // JSON array
  created_at: string;
  updated_at: string;
}

/**
 * Convert Workflow to DB record format
 */
function workflowToDb(workflow: Workflow): Omit<WorkflowDbRecord, 'created_at' | 'updated_at'> {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    platform: workflow.platform,
    status: workflow.status,
    tags: JSON.stringify(workflow.tags),
    owner_name: workflow.owner.name,
    owner_initials: workflow.owner.initials,
    nodes: JSON.stringify(workflow.nodes),
    connections: JSON.stringify(workflow.connections),
    success_rate: workflow.successRate,
    last_run_status: workflow.lastRun.status,
    last_run_time: workflow.lastRun.time || null,
    history: JSON.stringify(workflow.history),
  };
}

/**
 * Convert DB record to Workflow format
 */
function dbToWorkflow(record: WorkflowDbRecord): Workflow {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    platform: record.platform,
    status: record.status,
    tags: JSON.parse(record.tags),
    owner: {
      name: record.owner_name,
      initials: record.owner_initials,
    },
    nodes: JSON.parse(record.nodes),
    connections: JSON.parse(record.connections),
    successRate: record.success_rate,
    lastRun: {
      status: record.last_run_status,
      time: record.last_run_time || '',
    },
    history: JSON.parse(record.history),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * Create workflows table if not exists
 */
export async function initWorkflowsTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      platform TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      tags TEXT,
      owner_name TEXT,
      owner_initials TEXT,
      nodes TEXT NOT NULL,
      connections TEXT NOT NULL,
      success_rate REAL DEFAULT 0,
      last_run_status TEXT DEFAULT 'none',
      last_run_time DATETIME,
      history TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await window.api.sqlite.runQuery(sql);
}

/**
 * Get all workflows
 */
export async function getAllWorkflows(): Promise<Workflow[]> {
  const sql = 'SELECT * FROM workflows ORDER BY updated_at DESC';
  const records = await window.api.sqlite.getAllRows<WorkflowDbRecord>(sql);
  return records.map(dbToWorkflow);
}

/**
 * Get workflow by ID
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const sql = 'SELECT * FROM workflows WHERE id = ?';
  const record = await window.api.sqlite.getOneRow<WorkflowDbRecord>(sql, [id]);
  return record ? dbToWorkflow(record) : null;
}

/**
 * Create new workflow
 */
export async function createWorkflow(workflow: Workflow): Promise<void> {
  const data = workflowToDb(workflow);
  const sql = `
    INSERT INTO workflows (
      id, name, description, platform, status, tags,
      owner_name, owner_initials, nodes, connections,
      success_rate, last_run_status, last_run_time, history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await window.api.sqlite.runQuery(sql, [
    data.id,
    data.name,
    data.description,
    data.platform,
    data.status,
    data.tags,
    data.owner_name,
    data.owner_initials,
    data.nodes,
    data.connections,
    data.success_rate,
    data.last_run_status,
    data.last_run_time,
    data.history,
  ]);
}

/**
 * Update workflow
 */
export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
  // Get current workflow
  const current = await getWorkflowById(id);
  if (!current) throw new Error(`Workflow ${id} not found`);

  // Merge updates
  const updated: Workflow = { ...current, ...updates };
  const data = workflowToDb(updated);

  const sql = `
    UPDATE workflows SET
      name = ?,
      description = ?,
      platform = ?,
      status = ?,
      tags = ?,
      owner_name = ?,
      owner_initials = ?,
      nodes = ?,
      connections = ?,
      success_rate = ?,
      last_run_status = ?,
      last_run_time = ?,
      history = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await window.api.sqlite.runQuery(sql, [
    data.name,
    data.description,
    data.platform,
    data.status,
    data.tags,
    data.owner_name,
    data.owner_initials,
    data.nodes,
    data.connections,
    data.success_rate,
    data.last_run_status,
    data.last_run_time,
    data.history,
    id,
  ]);
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
  const sql = 'DELETE FROM workflows WHERE id = ?';
  await window.api.sqlite.runQuery(sql, [id]);
}

/**
 * Search workflows by name or tags
 */
export async function searchWorkflows(query: string): Promise<Workflow[]> {
  const sql = `
    SELECT * FROM workflows 
    WHERE name LIKE ? OR tags LIKE ?
    ORDER BY updated_at DESC
  `;
  const searchPattern = `%${query}%`;
  const records = await window.api.sqlite.getAllRows<WorkflowDbRecord>(sql, [
    searchPattern,
    searchPattern,
  ]);
  return records.map(dbToWorkflow);
}

/**
 * Get workflows by status
 */
export async function getWorkflowsByStatus(
  status: 'active' | 'paused' | 'draft' | 'archived',
): Promise<Workflow[]> {
  const sql = 'SELECT * FROM workflows WHERE status = ? ORDER BY updated_at DESC';
  const records = await window.api.sqlite.getAllRows<WorkflowDbRecord>(sql, [status]);
  return records.map(dbToWorkflow);
}

/**
 * Get workflows by platform
 */
export async function getWorkflowsByPlatform(platform: 'website' | 'mobile'): Promise<Workflow[]> {
  const sql = 'SELECT * FROM workflows WHERE platform = ? ORDER BY updated_at DESC';
  const records = await window.api.sqlite.getAllRows<WorkflowDbRecord>(sql, [platform]);
  return records.map(dbToWorkflow);
}
