import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  sqlite: {
    createDatabase: (path: string) => ipcRenderer.invoke('sqlite:create', path),
    openDatabase: (path: string) => ipcRenderer.invoke('sqlite:open', path),
    closeDatabase: () => ipcRenderer.invoke('sqlite:close'),
    runQuery: (query: string, params?: any[]) => ipcRenderer.invoke('sqlite:run', query, params),
    getAllRows: (query: string, params?: any[]) => ipcRenderer.invoke('sqlite:all', query, params),
    getOneRow: (query: string, params?: any[]) => ipcRenderer.invoke('sqlite:get', query, params)
  },
  fileSystem: {
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:save', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:open', options),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path)
  },
  storage: {
    set: (key: string, value: any) => ipcRenderer.invoke('storage:set', key, value),
    get: (key: string) => ipcRenderer.invoke('storage:get', key),
    remove: (key: string) => ipcRenderer.invoke('storage:remove', key)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', api) // For compatibility
  } catch (error) {
    console.error(error)
  }
} else {
  // TypeScript now knows these properties exist on Window
  ;(window as any).electron = electronAPI
  ;(window as any).api = api
  ;(window as any).electronAPI = api
}
