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
};
