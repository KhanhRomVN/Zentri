import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function setupEmailHandlers() {
  ipcMain.handle('email:open-login', async (_event, { provider }: { provider: string }) => {
    try {
      if (provider !== 'gmail') {
        throw new Error('Unsupported provider');
      }

      // Determine browser path (Linux priority: Chrome -> Chromium)
      let browserPath = '';
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          browserPath = p;
          break;
        }
      }

      if (!browserPath) {
        throw new Error('Browser not found. Please install Google Chrome or Chromium.');
      }

      // User data directory for persistence
      const userDataPath = app.getPath('userData');
      const sessionPath = path.join(userDataPath, 'browser_sessions', provider);

      // Create session directory if it doesn't exist
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      const args = [
        '--user-data-dir=' + sessionPath,
        '--no-first-run',
        '--no-default-browser-check',
        'https://accounts.google.com/ServiceLogin',
      ];

      console.log(`Spawning browser: ${browserPath} with args:`, args);

      const browserProcess = spawn(browserPath, args, {
        detached: true,
        stdio: 'ignore',
      });

      browserProcess.unref();

      return { success: true };
    } catch (error) {
      console.error('Error opening browser:', error);
      throw error;
    }
  });
}
