import { useCallback, useState, useEffect } from 'react';
import type { Platform, Workflow, WorkflowStatus } from '../types';
import {
  initWorkflowsTable,
  getAllWorkflows,
  createWorkflow as createWorkflowDb,
  updateWorkflow as updateWorkflowDb,
  deleteWorkflow as deleteWorkflowDb,
} from '../services/workflowDb';

let idCounter = 0;
function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${Date.now()}${idCounter}`;
}

export interface CreateWorkflowInput {
  name: string;
  platform: Platform;
  tags: string[];
  description: string;
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and load workflows
  useEffect(() => {
    const init = async () => {
      try {
        await initWorkflowsTable();
        const loaded = await getAllWorkflows();
        setWorkflows(loaded);
      } catch (err) {
        console.error('Failed to load workflows:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workflows');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const createWorkflow = useCallback(async (input: CreateWorkflowInput): Promise<Workflow> => {
    const now = new Date().toISOString();
    const newWf: Workflow = {
      id: generateId('wf'),
      name: input.name,
      platform: input.platform,
      status: 'draft',
      tags: input.tags,
      owner: { name: 'Le Chi', initials: 'LC' },
      description: input.description,
      createdAt: now,
      updatedAt: now,
      successRate: 0,
      lastRun: { status: 'none', time: '' },
      history: [],
      nodes: [
        {
          id: 'start',
          type: 'start',
          category: 'trigger',
          title: 'Start',
          subtitle: 'Manual trigger',
          note: '',
          x: 400,
          y: 250,
          w: 136,
          h: 46,
          pill: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      connections: [],
    };

    try {
      await createWorkflowDb(newWf);
      setWorkflows((prev) => [newWf, ...prev]);
      return newWf;
    } catch (err) {
      console.error('Failed to create workflow:', err);
      throw err;
    }
  }, []);

  const updateWorkflow = useCallback(async (id: string, updates: Partial<Workflow>) => {
    try {
      await updateWorkflowDb(id, updates);
      setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, ...updates } : wf)));
    } catch (err) {
      console.error('Failed to update workflow:', err);
      throw err;
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await deleteWorkflowDb(id);
      setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      throw err;
    }
  }, []);

  const duplicateWorkflow = useCallback(
    async (id: string): Promise<Workflow | null> => {
      const source = workflows.find((wf) => wf.id === id);
      if (!source) return null;

      const now = new Date().toISOString();
      const copy: Workflow = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateId('wf'),
        name: `${source.name} (copy)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await createWorkflowDb(copy);
        setWorkflows((prev) => [copy, ...prev]);
        return copy;
      } catch (err) {
        console.error('Failed to duplicate workflow:', err);
        throw err;
      }
    },
    [workflows],
  );

  const setWorkflowStatus = useCallback(async (id: string, status: WorkflowStatus) => {
    try {
      await updateWorkflowDb(id, { status });
      setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, status } : wf)));
    } catch (err) {
      console.error('Failed to update workflow status:', err);
      throw err;
    }
  }, []);

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    setWorkflowStatus,
  };
}
