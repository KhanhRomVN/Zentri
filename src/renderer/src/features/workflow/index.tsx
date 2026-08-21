import { useCallback, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Upload,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';
import { useWorkflows } from './hooks/useWorkflows';
import type { Workflow } from './types';
import StatsStrip from './components/StatsStrip';
import { FilterBar, type PlatformFilter, type StatusFilter } from './components/FilterBar';
import { WorkflowCard } from './components/WorkflowCard';
import CanvasEditor from './components/editor';
import { ReactFlowProvider } from '@xyflow/react';
import { CreateWorkflowModal, type CreateWorkflowInput } from './components/CreateWorkflowModal';
import { Button } from '../../components/ui/Button';

const WorkflowPage = () => {
  const { workflows, createWorkflow, updateWorkflow } = useWorkflows();
  const [view, setView] = useState<'list' | 'canvas'>('list');
  const [currentWfId, setCurrentWfId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // List state
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const currentWorkflow = currentWfId ? workflows.find((wf) => wf.id === currentWfId) || null : null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workflows.filter((wf) => {
      const matchPlatform = platformFilter === 'all' || wf.platform === platformFilter;
      const matchStatus = statusFilter === 'all' || wf.status === statusFilter;
      const matchQuery =
        !query || wf.name.toLowerCase().includes(query) || wf.tags.some((t) => t.toLowerCase().includes(query));
      return matchPlatform && matchStatus && matchQuery;
    });
  }, [workflows, search, platformFilter, statusFilter]);

  const handleOpenWorkflow = useCallback((id: string) => {
    setCurrentWfId(id);
    setView('canvas');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
    setCurrentWfId(null);
  }, []);

  const handleCreateWorkflow = useCallback(
    (input: CreateWorkflowInput) => {
      const newWf = createWorkflow(input);
      setCurrentWfId(newWf.id);
      setView('canvas');
    },
    [createWorkflow],
  );

  const handleQuickRun = useCallback(
    (id: string) => {
      const wf = workflows.find((w) => w.id === id);
      if (!wf) return;

      const success = Math.random() > 0.15;
      const newRate = success ? Math.min(100, wf.successRate + 1) : Math.max(0, wf.successRate - 4);

      updateWorkflow(id, {
        successRate: newRate,
        lastRun: { status: success ? 'passed' : 'failed', time: 'Just now' },
        history: [
          {
            status: success ? 'passed' : 'failed',
            duration: `${(wf.nodes.length * 1.4).toFixed(1)}s`,
            triggeredBy: 'Quick Run',
            time: 'Just now',
          },
          ...wf.history,
        ],
      });
    },
    [workflows, updateWorkflow],
  );

  const handleUpdateWorkflow = useCallback(
    (updates: Partial<Workflow>) => {
      if (currentWfId) {
        updateWorkflow(currentWfId, updates);
      }
    },
    [currentWfId, updateWorkflow],
  );

  const handleRefresh = useCallback(() => {
    // Placeholder — re-fetch from backend when available
  }, []);

  // ─── Canvas view ────────────────────────────────────────────────────────
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

  // ─── List view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-10 shrink-0 border-b border-t border-r border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button className="text-text-primary hover:text-teal transition-colors">
            <LayoutDashboard className="size-5" />
          </button>
          <ChevronRight className="size-4 text-text-secondary" />
          <span className="text-text-primary text-sm font-semibold">Workflow</span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden px-5 pt-5 border-r border-b border-border">
        {/* Hero section */}
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
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
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

        {/* Stats strip */}
        <StatsStrip workflows={workflows} />

        {/* Filter bar */}
        <FilterBar
          platformFilter={platformFilter}
          statusFilter={statusFilter}
          search={search}
          onPlatformChange={setPlatformFilter}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
        />

        {/* Card grid */}
        {filtered.length > 0 ? (
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  onOpen={handleOpenWorkflow}
                  onQuickRun={handleQuickRun}
                  onMenu={() => {}}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-text-secondary">
            <Search className="mb-3 h-10 w-10 text-text-secondary/50" />
            <h3 className="mb-1 text-sm font-semibold">No workflows found</h3>
            <p className="max-w-xs text-xs leading-relaxed">
              {workflows.length === 0
                ? 'Create your first workflow to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateWorkflowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
};

export default WorkflowPage;