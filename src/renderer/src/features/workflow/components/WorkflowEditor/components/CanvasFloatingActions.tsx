import { Video, RefreshCw, Play, History, ScrollText } from 'lucide-react';
import { Panel } from '@xyflow/react';
import { Tooltip } from '../../shared/Tooltip';

interface CanvasFloatingActionsProps {
  isRecording: boolean;
  workflowValid: boolean;
  nodeCount: number;
  logPanelOpen: boolean;
  setLogPanelOpen: (open: boolean) => void;
  setRunModalOpen: (open: boolean) => void;
  setHistoryModalOpen: (open: boolean) => void;
  onLaunchBrowser: () => void;
  onStopRecording: () => void;
  onRunOnRecorder: () => void;
}

export const CanvasFloatingActions = ({
  isRecording,
  workflowValid,
  nodeCount,
  logPanelOpen,
  setLogPanelOpen,
  setRunModalOpen,
  setHistoryModalOpen,
  onLaunchBrowser,
  onStopRecording,
  onRunOnRecorder,
}: CanvasFloatingActionsProps) => {
  return (
    <Panel position="bottom-right">
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-card-background/95 p-1.5 shadow-lg backdrop-blur">
        <Tooltip content={isRecording ? 'Stop recording' : 'Launch browser recorder'} side="left">
          <button
            onClick={isRecording ? onStopRecording : onLaunchBrowser}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              isRecording
                ? 'bg-error/10 text-error hover:bg-error/20'
                : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Video className="h-4 w-4" />
          </button>
        </Tooltip>

        {isRecording && (
          <Tooltip content="Run workflow on recorder browser" side="left">
            <button
              onClick={onRunOnRecorder}
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </Tooltip>
        )}

        <Tooltip
          content={
            !workflowValid
              ? 'Cannot run: workflow has errors'
              : nodeCount <= 1
                ? 'Add nodes to run workflow'
                : isRecording
                  ? 'Cannot run while recording'
                  : 'Run workflow'
          }
          side="left"
        >
          <button
            onClick={() => setRunModalOpen(true)}
            disabled={nodeCount <= 1 || isRecording || !workflowValid}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-success/10 hover:text-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip content="View run history" side="left">
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <History className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip content={logPanelOpen ? 'Hide logs' : 'Show execution logs'} side="left">
          <button
            onClick={() => setLogPanelOpen(!logPanelOpen)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              logPanelOpen
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <ScrollText className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
    </Panel>
  );
};