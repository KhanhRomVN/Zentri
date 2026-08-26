import { useCallback } from 'react';
import type { WorkflowNode } from '../types';
import type { RunConfig } from '../components/WorkflowEditor/modal/RunWorkflowModal';

interface UseWorkflowRecordingArgs {
  workflowId: string;
  currentNodes: WorkflowNode[];
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useWorkflowRecording = ({
  workflowId,
  currentNodes,
  setIsRecording,
}: UseWorkflowRecordingArgs) => {
  const handleLaunchBrowser = useCallback(async () => {
    console.log('[CanvasEditor] handleLaunchBrowser called');
    try {
      setIsRecording(true);
      console.log('[CanvasEditor] Calling window.api.workflow.startRecording...');

      const result = await window.api.workflow.startRecording(workflowId, 'https://www.google.com');

      console.log('[CanvasEditor] startRecording result:', result);

      if (!result.success) {
        console.error('[CanvasEditor] Failed to start recording:', result.error);
        setIsRecording(false);
        alert(`Failed to start recording: ${result.error}`);
      } else {
        console.log('[CanvasEditor] Recording started successfully');
      }
    } catch (error) {
      console.error('[CanvasEditor] Error launching browser:', error);
      setIsRecording(false);
      alert('Failed to launch browser');
    }
  }, [workflowId, setIsRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const result = await window.api.workflow.stopRecording(workflowId);

      if (!result.success) {
        console.error('[CanvasEditor] Failed to stop recording:', result.error);
      }

      setIsRecording(false);
    } catch (error) {
      console.error('[CanvasEditor] Error stopping recording:', error);
      setIsRecording(false);
    }
  }, [workflowId, setIsRecording]);

  const handleRunOnRecorder = useCallback(async () => {
    console.log('[CanvasEditor] handleRunOnRecorder called');
    try {
      console.log('[CanvasEditor] Calling window.api.workflow.runOnRecorder...');

      const result = await window.api.workflow.runOnRecorder(workflowId, currentNodes);

      console.log('[CanvasEditor] runOnRecorder result:', result);

      if (!result.success) {
        console.error('[CanvasEditor] Failed to run workflow on recorder:', result.error);
        alert(`Failed to run workflow on recorder: ${result.error}`);
      } else {
        console.log('[CanvasEditor] Workflow executed successfully on recorder browser');
      }
    } catch (error) {
      console.error('[CanvasEditor] Error running workflow on recorder:', error);
    }
  }, [workflowId, currentNodes]);

  const handleRunWorkflow = useCallback(
    async (config: RunConfig) => {
      try {
        let startUrl = 'https://google.com';
        const firstActionNode = currentNodes.find((n) => n.type !== 'start');
        if (firstActionNode?.note) {
          try {
            const parsed = JSON.parse(firstActionNode.note);
            if (parsed?.config?.action === 'go_to_url' && parsed?.config?.url) {
              startUrl = parsed.config.url;
            }
          } catch {
            // Keep default URL
          }
        }

        const runConfig = {
          method: config.method,
          ...(config.method === 'profile'
            ? { emailIds: config.emailIds }
            : { count: config.count }),
          nodes: currentNodes,
          startUrl,
        };

        const result = await window.api.workflow.runWorkflow(workflowId, runConfig);

        if (!result.success) {
          console.error('[CanvasEditor] Failed to run workflow:', result.error);
          alert(`Failed to run workflow: ${result.error}`);
          return;
        }
      } catch (error) {
        console.error('[CanvasEditor] Error running workflow:', error);
        alert(`Error running workflow: ${error}`);
      }
    },
    [workflowId, currentNodes],
  );

  return { handleLaunchBrowser, handleStopRecording, handleRunOnRecorder, handleRunWorkflow };
};
