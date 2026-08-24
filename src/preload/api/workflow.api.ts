import { ipcRenderer } from 'electron';

/**
 * Workflow recording API for renderer process
 * Provides methods to start/stop recording and receive recorded nodes
 */

export const workflowAPI = {
  /**
   * Start workflow recording session
   * Launches browser with recorder extension
   */
  startRecording: (
    workflowId: string,
    url?: string,
  ): Promise<{
    success: boolean;
    workflowId?: string;
    url?: string;
    port?: number;
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:start-recording', workflowId, url);
  },

  /**
   * Stop workflow recording session
   * Closes the recorder browser
   */
  stopRecording: (
    workflowId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:stop-recording', workflowId);
  },

  /**
   * Listen for recorded nodes from extension
   */
  onNodeRecorded: (callback: (nodeData: any) => void) => {
    const listener = (_event: any, nodeData: any) => callback(nodeData);
    ipcRenderer.on('workflow:node-recorded', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('workflow:node-recorded', listener);
    };
  },

  /**
   * Listen for recording stopped event
   */
  onRecordingStopped: (callback: (workflowId: string) => void) => {
    const listener = (_event: any, workflowId: string) => callback(workflowId);
    ipcRenderer.on('workflow:recording-stopped', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('workflow:recording-stopped', listener);
    };
  },

  /**
   * Run workflow with specified configuration
   * Launches multiple browser instances based on config
   */
  runWorkflow: (
    workflowId: string,
    config: {
      method: 'profile' | 'guest';
      emailIds?: string[];
      count?: number;
      nodes: any[];
      startUrl?: string;
    },
  ): Promise<{
    success: boolean;
    runId?: string;
    instances?: any[];
    duration?: number;
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:run', workflowId, config);
  },

  /**
   * Run workflow on the active recorder browser (NEW)
   * Executes workflow on the currently open recorder browser
   */
  runOnRecorder: (
    workflowId: string,
    nodes: any[],
  ): Promise<{
    success: boolean;
    runId?: string;
    results?: any[];
    duration?: number;
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:run-on-recorder', workflowId, nodes);
  },

  /**
   * Get workflow run history
   */
  getRuns: (
    workflowId: string,
    limit?: number,
  ): Promise<{
    success: boolean;
    runs?: any[];
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:get-runs', workflowId, limit);
  },

  /**
   * Get logs for a specific workflow run
   */
  getLogs: (
    runId: string,
    limit?: number,
  ): Promise<{
    success: boolean;
    logs?: any[];
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:get-logs', runId, limit);
  },

  /**
   * Get live logs for a workflow (for LogPanel)
   */
  getLiveLogs: (
    workflowId: string,
    limit?: number,
  ): Promise<{
    success: boolean;
    logs?: any[];
    error?: string;
  }> => {
    return ipcRenderer.invoke('workflow:get-live-logs', workflowId, limit);
  },

  /**
   * Listen for live log events
   */
  onLog: (callback: (logEntry: any) => void) => {
    const listener = (_event: any, logEntry: any) => callback(logEntry);
    ipcRenderer.on('workflow:log', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('workflow:log', listener);
    };
  },
};
