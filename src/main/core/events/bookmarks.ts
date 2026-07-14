import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { dbManager } from '../database';

export function registerBookmarkHandlers() {
  ipcMain.handle('email:get-bookmarks', async (_event, { email }: { email: string }) => {
    try {
      const dbDir = path.dirname(dbManager.dbPath);
      const profilePath = path.join(dbDir, 'profiles', email);
      const bookmarkPath = path.join(profilePath, 'Bookmarks');

      if (!fs.existsSync(bookmarkPath)) {
        return { success: true, bookmarks: null, message: 'No bookmarks found' };
      }

      const content = fs.readFileSync(bookmarkPath, 'utf-8');
      const data = JSON.parse(content);

      return { success: true, bookmarks: data };
    } catch (error: any) {
      console.error('Error reading bookmarks:', error);
      return { success: false, error: error.message };
    }
  });
}