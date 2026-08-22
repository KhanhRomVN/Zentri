import { ElectronAPI } from '@electron-toolkit/preload';

interface WorkflowAPI {
  startRecording: (
    workflowId: string,
    url?: string,
  ) => Promise<{
    success: boolean;
    workflowId?: string;
    url?: string;
    port?: number;
    error?: string;
  }>;
  stopRecording: (workflowId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onNodeRecorded: (callback: (nodeData: any) => void) => () => void;
  onRecordingStopped: (callback: (workflowId: string) => void) => () => void;
}

interface API {
  workflow: WorkflowAPI;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ElectronIpcRenderer {}

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: ElectronIpcRenderer;
    };
    api: API;
    electronAPI: API;
  }
}
