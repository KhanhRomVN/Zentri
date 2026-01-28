import { ipcRenderer } from 'electron';

export const fileSystemAPI = {
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:save', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:open', options),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path)
};
