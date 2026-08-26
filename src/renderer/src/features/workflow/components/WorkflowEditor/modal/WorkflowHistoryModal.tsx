import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Timer,
  User,
  Play,
  Activity,
  Package,
} from 'lucide-react';
import Modal from '../../../../../components/ui/Modal/Modal';
import ModalHeader from '../../../../../components/ui/Modal/ModalHeader';
import ModalBody from '../../../../../components/ui/Modal/ModalBody';
import { formatDuration, formatTimestamp, getStatusColor } from '../../../utils';

interface WorkflowRun {
  id: string;
  workflowId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'running';
  duration?: number;
  method: 'profile' | 'guest';
  instanceCount: number;
  snapshot: {
    nodes: any[];
    connections: any[];
  };
  results?: any[];
}

interface WorkflowHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export const WorkflowHistoryModal = ({
  isOpen,
  onClose,
  workflowId,
}: WorkflowHistoryModalProps) => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);

  // Load workflow run history
  useEffect(() => {
    if (isOpen && workflowId) {
      loadHistory();
    }
  }, [isOpen, workflowId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await window.api.workflow.getRuns(workflowId, 50);

      if (result.success && result.runs) {
        // Parse snapshot from JSON string
        const parsedRuns = result.runs.map((run: any) => {
          let snapshot = run.snapshot;

          // Parse snapshot if it's a string
          if (typeof snapshot === 'string') {
            try {
              snapshot = JSON.parse(snapshot);
            } catch (e) {
              console.error('[WorkflowHistory] Failed to parse snapshot:', e);
              snapshot = { nodes: [], connections: [] };
            }
          }

          // Ensure snapshot has nodes and connections arrays
          if (!snapshot || typeof snapshot !== 'object') {
            snapshot = { nodes: [], connections: [] };
          }
          if (!Array.isArray(snapshot.nodes)) {
            snapshot.nodes = [];
          }
          if (!Array.isArray(snapshot.connections)) {
            snapshot.connections = [];
          }

          // Parse results if it's a string
          let results = run.results;
          if (results && typeof results === 'string') {
            try {
              results = JSON.parse(results);
            } catch (e) {
              console.error('[WorkflowHistory] Failed to parse results:', e);
              results = null;
            }
          }

          return {
            ...run,
            snapshot,
            results,
          };
        });
        setRuns(parsedRuns);
      }
    } catch (error) {
      console.error('[WorkflowHistory] Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl max-h-[80vh]">
      <ModalHeader
        title="Workflow Run History"
        description="View past workflow executions with saved snapshots"
        onClose={onClose}
      />

      <ModalBody>
        <div className="flex gap-6 h-[600px]">
          {/* Run List */}
          <div className="w-1/3 border-r border-border pr-6 overflow-y-auto">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Clock className="h-16 w-16 text-text-secondary/20 mb-4" />
                  <div className="text-sm font-medium text-text-secondary">
                    No workflow runs yet
                  </div>
                  <div className="text-xs text-text-secondary/70 mt-1">
                    Run a workflow to see history here
                  </div>
                </div>
              ) : (
                runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-md hover:scale-[1.02] ${
                      selectedRun?.id === run.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card-background hover:border-primary/40'
                    }`}
                  >
                    {/* Status Icon & Timestamp */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-text-secondary/70" />
                        <span className="text-xs text-text-secondary font-medium">
                          {formatTimestamp(run.timestamp)}
                        </span>
                      </div>
                      <div className={`${getStatusColor(run.status)} rounded-full p-1`}>
                        {getStatusIcon(run.status)}
                      </div>
                    </div>

                    {/* Status Badge & Duration */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(run.status)}`}
                      >
                        {getStatusIcon(run.status)}
                        <span className="capitalize">{run.status}</span>
                      </span>
                      {run.duration && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-sidebar-item-hover px-2 py-1 rounded-md">
                          <Timer className="h-3 w-3" />
                          {formatDuration(run.duration)}
                        </span>
                      )}
                    </div>

                    {/* Method & Instances */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-text-secondary">
                        {run.method === 'guest' ? (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            <span>Guest Mode</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3.5 w-3.5" />
                            <span>Profile Mode</span>
                          </>
                        )}
                      </span>
                      <span className="text-text-secondary/50">•</span>
                      <span className="text-text-secondary">
                        {run.instanceCount} {run.instanceCount === 1 ? 'instance' : 'instances'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Run Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedRun ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-card-background p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-text-secondary">Status</span>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border ${getStatusColor(selectedRun.status)}`}
                    >
                      {getStatusIcon(selectedRun.status)}
                      <span className="capitalize">{selectedRun.status}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card-background p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Timer className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-text-secondary">Duration</span>
                    </div>
                    <div className="text-xl font-bold text-text-primary">
                      {selectedRun.duration ? formatDuration(selectedRun.duration) : 'N/A'}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card-background p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-text-secondary">Started At</span>
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {formatTimestamp(selectedRun.timestamp)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card-background p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {selectedRun.method === 'guest' ? (
                          <Play className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-text-secondary">Method</span>
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {selectedRun.method === 'guest' ? 'Guest Mode' : 'Profile Mode'}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {selectedRun.instanceCount}{' '}
                      {selectedRun.instanceCount === 1 ? 'instance' : 'instances'}
                    </div>
                  </div>
                </div>

                {/* Workflow Snapshot */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-text-primary">Workflow Snapshot</h3>
                  </div>
                  <div className="rounded-lg border border-border bg-gradient-to-br from-sidebar-item-hover/50 to-sidebar-item-hover/20 p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card-background border border-border">
                        <span className="text-sm font-medium text-text-secondary">Nodes</span>
                        <span className="text-2xl font-bold text-primary">
                          {selectedRun.snapshot?.nodes?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card-background border border-border">
                        <span className="text-sm font-medium text-text-secondary">Connections</span>
                        <span className="text-2xl font-bold text-primary">
                          {selectedRun.snapshot?.connections?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {selectedRun.results &&
                  Array.isArray(selectedRun.results) &&
                  selectedRun.results.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-bold text-text-primary">Execution Results</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedRun.results.map((result, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-border bg-card-background p-4 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-text-primary">
                                Instance {index + 1}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                                  result.success
                                    ? 'text-success bg-success/10 border-success/30'
                                    : 'text-error bg-error/10 border-error/30'
                                }`}
                              >
                                {result.success ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Success</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Failed</span>
                                  </>
                                )}
                              </span>
                            </div>
                            {result.error && (
                              <div className="text-sm text-error bg-error/5 border border-error/20 rounded-md p-3 mt-2 font-mono">
                                {result.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Clock className="h-20 w-20 text-text-secondary/20 mx-auto mb-4" />
                  <div className="text-base font-semibold text-text-secondary mb-2">
                    Select a run to view details
                  </div>
                  <div className="text-sm text-text-secondary/70">
                    Click on any run from the list to see its details
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};
