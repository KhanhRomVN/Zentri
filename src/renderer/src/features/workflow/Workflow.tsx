import { useCallback, useMemo, useState } from 'react';
import { Plus, Upload, Search, List, LayoutGrid } from 'lucide-react';
import { useWorkflows } from './hooks/useWorkflows';
import type { Workflow } from './types';
import CanvasEditor from './components/WorkflowEditor/CanvasEditor';
import { ReactFlowProvider } from '@xyflow/react';
import {
  CreateWorkflowModal,
  type CreateWorkflowInput,
} from './components/WorkflowManager/modal/CreateWorkflowModal';
import { Button } from '../../components/ui/Button';
import { WorkflowTabs, type WorkflowTab } from './components/WorkflowManager/WorkflowTabs';
import { WorkflowTable } from './components/WorkflowManager/Workflows/WorkflowTable';
import { WorkflowGrid } from './components/WorkflowManager/Workflows/WorkflowGrid';
import { AnalyticsTab } from './components/WorkflowManager/Analytics/AnalyticsTab';
import { ScheduleTab } from './components/WorkflowManager/Schedule/ScheduleTab';
import { WorkflowDetailModal } from './components/WorkflowManager/modal/WorkflowDetailModal';

const Workflow = () => {
  const { workflows, createWorkflow, updateWorkflow } = useWorkflows();
  const [view, setView] = useState<'list' | 'canvas'>('list');
  const [currentWfId, setCurrentWfId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkflowTab>('list');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailWfId, setDetailWfId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const currentWorkflow = currentWfId
    ? workflows.find((wf) => wf.id === currentWfId) || null
    : null;

  const filteredWorkflows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workflows.filter((wf) => {
      const matchPlatform = platformFilter === 'all' || wf.deviceType === platformFilter;
      const matchStatus = statusFilter === 'all' || wf.status === statusFilter;
      const matchQuery =
        !query ||
        wf.name.toLowerCase().includes(query) ||
        wf.tags.some((t) => t.toLowerCase().includes(query));
      return matchPlatform && matchStatus && matchQuery;
    });
  }, [workflows, search, platformFilter, statusFilter]);

  const handleOpenDetail = useCallback((id: string) => {
    setDetailWfId(id);
    setDetailOpen(true);
  }, []);

  const handleOpenInEditor = useCallback((id: string) => {
    setDetailOpen(false);
    setCurrentWfId(id);
    setView('canvas');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
    setCurrentWfId(null);
  }, []);

  const handleCreateWorkflow = useCallback(
    async (input: CreateWorkflowInput) => {
      const newWf = await createWorkflow(input);
      setCurrentWfId(newWf.id);
      setView('canvas');
    },
    [createWorkflow],
  );

  const handleUpdateWorkflow = useCallback(
    (updates: Partial<Workflow>) => {
      if (currentWfId) {
        updateWorkflow(currentWfId, updates);
      }
    },
    [currentWfId, updateWorkflow],
  );

  if (view === 'canvas' && currentWorkflow) {
    return (
      <ReactFlowProvider>
        <CanvasEditor
          workflow={currentWorkflow}
          onUpdateWorkflow={handleUpdateWorkflow}
          onBack={handleBackToList}
        />
      </ReactFlowProvider>
    );
  }

  const detailWorkflow = detailWfId ? workflows.find((wf) => wf.id === detailWfId) || null : null;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-5 pt-5 border-r border-b border-border">
        <div className="flex items-end justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-text-primary tracking-tight">
              Workflow Registry
            </h1>
            <p className="text-[12.5px] text-text-secondary/60 mt-1">
              Design and orchestrate automated flows — monitor success rate, platform coverage, and
              execution health in real time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              <Upload className="size-3.5" />
              Import
            </Button>
            <Button variant="solid" onClick={() => setModalOpen(true)}>
              <Plus className="size-3.5" />
              Create Workflow
            </Button>
          </div>
        </div>

        <WorkflowTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto pt-4 pb-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search workflows..."
                    className="pl-8 pr-3 h-[38px] rounded-md text-xs outline-none w-64 bg-background border border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-2 h-[38px] rounded-md text-xs bg-background border border-border text-text-secondary outline-none"
                >
                  <option value="all">All Platforms</option>
                  <option value="website">Website</option>
                  <option value="mobile">Mobile</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 h-[38px] rounded-md text-xs bg-background border border-border text-text-secondary outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-md bg-background border border-border">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-sidebar-item-hover text-text-primary' : 'text-text-secondary'}`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-sidebar-item-hover text-text-primary' : 'text-text-secondary'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
            {viewMode === 'table' ? (
              <WorkflowTable workflows={filteredWorkflows} onOpen={handleOpenDetail} />
            ) : (
              <WorkflowGrid workflows={filteredWorkflows} onOpen={handleOpenDetail} />
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto pt-4 pb-4">
            <AnalyticsTab workflows={workflows} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="flex-1 overflow-y-auto pt-4 pb-4">
            <ScheduleTab workflows={workflows} onOpen={handleOpenDetail} />
          </div>
        )}
      </div>

      <CreateWorkflowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />

      {detailWorkflow && (
        <WorkflowDetailModal
          workflow={detailWorkflow}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onOpenEditor={() => handleOpenInEditor(detailWorkflow.id)}
        />
      )}
    </div>
  );
};

export default Workflow;
