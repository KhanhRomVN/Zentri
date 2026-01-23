import { ElectronAPI } from '@electron-toolkit/preload'

// Define the API interface
interface API {
  sqlite: {
    createDatabase: (path: string) => Promise<any>
    openDatabase: (path: string) => Promise<any>
    closeDatabase: () => Promise<any>
    runQuery: (query: string, params?: any[]) => Promise<any>
    getAllRows: (query: string, params?: any[]) => Promise<any>
    getOneRow: (query: string, params?: any[]) => Promise<any>
  }
  fileSystem: {
    showSaveDialog: (options: any) => Promise<any>
    showOpenDialog: (options: any) => Promise<any>
    exists: (path: string) => Promise<boolean>
    createDirectory: (path: string, options?: { recursive?: boolean }) => Promise<void>
  }
  storage: {
    set: (key: string, value: any) => Promise<void>
    get: (key: string) => Promise<any>
    remove: (key: string) => Promise<void>
  }
}

// Extend the Window interface to include our APIs
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    electronAPI: API
  }
}
