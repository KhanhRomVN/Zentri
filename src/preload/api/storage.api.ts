import { ipcRenderer } from 'electron';

export const storageAPI = {
  set: (key: string, value: any) => ipcRenderer.invoke('storage:set', key, value),
  get: (key: string) => ipcRenderer.invoke('storage:get', key),
  remove: (key: string) => ipcRenderer.invoke('storage:remove', key),
  /**
   * Mở hộp thoại Save As và copy file SQLite hiện tại tới vị trí người dùng chọn.
   * Trả về { success: true, path } hoặc { success: false, canceled: true }.
   */
  backupZentri: (sourcePath: string) =>
    ipcRenderer.invoke('storage:backup-zentri', sourcePath),
};