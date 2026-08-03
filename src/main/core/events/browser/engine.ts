import { ipcMain } from 'electron';
import { dbManager } from '../../database';

export function setupEngineHandlers() {
  ipcMain.handle('browser:get-fingerprints', async () => {
    try {
      const fingerprints = await dbManager.all(
        'SELECT id, name, description FROM fingerprints ORDER BY updated_at DESC',
      );
      return fingerprints;
    } catch (error) {
      console.error('[DB] Failed to fetch fingerprints:', error);
      return [];
    }
  });
}