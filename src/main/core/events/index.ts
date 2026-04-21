import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as crypto from 'crypto';
import { setupEmailHandlers } from './email';
import { dbManager } from '../database';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Storage file path
const getStorageFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'email-manager-config.json');
};

function setupStorageHandlers() {
  // Set storage value
  ipcMain.handle('storage:set', async (_event, key: string, value: any) => {
    try {
      const storagePath = getStorageFilePath();
      let data: Record<string, any> = {};

      // Read existing data if file exists
      if (fs.existsSync(storagePath)) {
        const fileContent = await fs.promises.readFile(storagePath, 'utf8');
        try {
          data = JSON.parse(fileContent);
        } catch (parseError) {
          console.warn('Failed to parse storage file, creating new one');
          data = {};
        }
      }

      // Update data
      data[key] = value;

      // Write back to file
      await fs.promises.writeFile(storagePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error setting storage value:', error);
      throw error;
    }
  });

  // Get storage value
  ipcMain.handle('storage:get', async (_event, key: string) => {
    try {
      const storagePath = getStorageFilePath();

      if (!fs.existsSync(storagePath)) {
        return null;
      }

      const fileContent = await fs.promises.readFile(storagePath, 'utf8');
      try {
        const data = JSON.parse(fileContent);
        return data[key] || null;
      } catch (parseError) {
        console.warn('Failed to parse storage file');
        return null;
      }
    } catch (error) {
      console.error('Error getting storage value:', error);
      return null;
    }
  });

  // Remove storage value
  ipcMain.handle('storage:remove', async (_event, key: string) => {
    try {
      const storagePath = getStorageFilePath();

      if (!fs.existsSync(storagePath)) {
        return;
      }

      const fileContent = await fs.promises.readFile(storagePath, 'utf8');
      try {
        const data = JSON.parse(fileContent);
        delete data[key];
        await fs.promises.writeFile(storagePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (parseError) {
        console.warn('Failed to parse storage file');
      }
    } catch (error) {
      console.error('Error removing storage value:', error);
      throw error;
    }
  });
}

function setupDatabaseHandlers() {
  // Get main window for dialogs
  const getMainWindow = (): BrowserWindow | null => {
    const windows = BrowserWindow.getAllWindows();
    return windows.length > 0 ? windows[0] : null;
  };

  // Dialog handlers
  ipcMain.handle('dialog:save', async (_event, options) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) throw new Error('Main window not available');

    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath || 'database.db',
        filters: options.filters || [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      return {
        canceled: result.canceled,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('Error in dialog:save:', error);
      throw error;
    }
  });

  ipcMain.handle('dialog:open', async (_event, options) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) throw new Error('Main window not available');

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || 'Open File',
        filters: options.filters || [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: options.properties || ['openFile'],
      });

      return {
        canceled: result.canceled,
        filePaths: result.filePaths,
      };
    } catch (error) {
      console.error('Error in dialog:open:', error);
      throw error;
    }
  });

  // File system handlers
  ipcMain.handle('fs:exists', async (_event, filePath: string) => {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  });

  ipcMain.handle(
    'fs:createDirectory',
    async (_event, dirPath: string, options?: { recursive?: boolean }) => {
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: options?.recursive ?? true });
        }
      } catch (error) {
        console.error('Error creating directory:', error);
        throw error;
      }
    },
  );

  // SQLite handlers
  ipcMain.handle('sqlite:create', async (_event, dbPath: string) => {
    try {
      await dbManager.init(dbPath);
    } catch (error) {
      console.error('Error creating database:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:open', async (_event, dbPath: string) => {
    try {
      await dbManager.init(dbPath);
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:close', async () => {
    try {
      await dbManager.close();
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:run', async (_event, query: string, params: any[] = []) => {
    try {
      return await dbManager.run(query, params);
    } catch (error) {
      console.error('Error running query:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:all', async (_event, query: string, params: any[] = []) => {
    try {
      return await dbManager.all(query, params);
    } catch (error) {
      console.error('Error running select query:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:get', async (_event, query: string, params: any[] = []) => {
    try {
      return await dbManager.get(query, params);
    } catch (error) {
      console.error('Error running get query:', error);
      throw error;
    }
  });
}

export function setupEventHandlers() {
  ipcMain.handle('ping', () => 'pong');
  setupStorageHandlers();
  setupDatabaseHandlers();
  setupEmailHandlers();
  setupServiceHandlers();

  // Streaming Fetch Handler
  ipcMain.handle('util:fetch-stream', async (event, input: any) => {
    const webContents = event.sender;
    let url: string;
    let options: RequestInit = {};

    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input === 'object' && input.url) {
      url = input.url;
      options = input.options || {};
    } else {
      return { success: false, error: 'Invalid fetch input' };
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Accept: 'text/event-stream',
        },
      });

      if (!response.ok) {
        let errorBody = '';
        try {
          const text = await response.text();
          errorBody = text.length > 100 ? text.substring(0, 100) + '...' : text;
        } catch (e) {
          errorBody = `HTTP ${response.status}`;
        }
        return {
          success: false,
          status: response.status,
          error: errorBody || `HTTP ${response.status}`,
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'Response body is empty' };
      }

      const decoder = new TextDecoder();

      // We return immediately to acknowledge the stream started.
      // The actual data will come via webContents.send
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (!webContents.isDestroyed()) {
              webContents.send('util:fetch-chunk', { chunk });
            }
          }
          if (!webContents.isDestroyed()) {
            webContents.send('util:fetch-end', { success: true });
          }
        } catch (streamError: any) {
          console.error('[util:fetch-stream] Stream error:', streamError);
          if (!webContents.isDestroyed()) {
            webContents.send('util:fetch-end', { success: false, error: streamError.message });
          }
        } finally {
          reader.releaseLock();
        }
      })();

      return { success: true };
    } catch (error: any) {
      console.error('[util:fetch-stream] FAILED:', error.message);
      return { success: false, error: error.message };
    }
  });

  // Utility Fetch Handler to bypass CORS
  ipcMain.handle('util:fetch', async (_event, input: any) => {
    let url: string;
    let options: RequestInit = {};

    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input === 'object' && input.url) {
      url = input.url;
      options = input.options || {};
    } else {
      return { success: false, error: 'Invalid fetch input' };
    }

    try {
      const response = await fetch(url, options);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      return {
        success: response.ok,
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      console.error('[util:fetch] FAILED:', error.message);
      return { success: false, error: error.message };
    }
  });

  // 1. Select Storage Folder
  ipcMain.handle('storage:select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (canceled) return null;
    return filePaths[0];
  });

  // 2. Read file data from storage folder
  ipcMain.handle(
    'storage:read-data',
    async (_event, folderPath: string, filename: string = 'zentri-accounts.json') => {
      const filePath = path.join(folderPath, filename);
      if (!fs.existsSync(filePath)) return { success: true, data: null };
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return { success: true, data: JSON.parse(content) };
      } catch (e: any) {
        console.error(`Error reading ${filename}:`, e);
        return { success: false, error: e.message };
      }
    },
  );

  // 3. Write data to file in storage folder
  ipcMain.handle(
    'storage:write-data',
    async (
      _event,
      {
        folderPath,
        data,
        filename = 'zentri-accounts.json',
      }: { folderPath: string; data: any; filename?: string },
    ) => {
      try {
        const filePath = path.join(folderPath, filename);
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
      } catch (e) {
        console.error(`Error writing ${filename}:`, e);
        return false;
      }
    },
  );

  // 4. Rename folder (for profile migration/rename)
  ipcMain.handle(
    'storage:rename-folder',
    async (_event, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
      try {
        if (!fs.existsSync(oldPath)) return { success: false, error: 'Source folder not found' };
        if (fs.existsSync(newPath))
          return { success: false, error: 'Target folder already exists' };

        // Ensure parent directory of newPath exists
        const parentDir = path.dirname(newPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        await fs.promises.rename(oldPath, newPath);
        return { success: true };
      } catch (e: any) {
        console.error('Error renaming folder:', e);
        return { success: false, error: e.message };
      }
    },
  );
}

function setupServiceHandlers() {
  ipcMain.handle('service:get-all', async () => {
    try {
      const services = await dbManager.all('SELECT * FROM services ORDER BY name ASC');
      return services.map((s: any) => ({
        ...s,
        tags: s.tags ? JSON.parse(s.tags) : [],
        category: s.category ? JSON.parse(s.category) : [],
        metadata: s.metadata ? JSON.parse(s.metadata) : [],
      }));
    } catch (error) {
      console.error('[service:get-all] FAILED:', error);
      return [];
    }
  });

  ipcMain.handle('service:create', async (_event, data: any) => {
    try {
      const id = crypto.randomUUID();
      const query = `
        INSERT INTO services (id, name, url, tags, category, description, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        data.name,
        data.url || null,
        data.tags || '[]',
        data.category || '[]',
        data.description || null,
        data.metadata || '[]',
      ];
      await dbManager.run(query, params);
      const newService = await dbManager.get('SELECT * FROM services WHERE id = ?', [id]);
      return newService;
    } catch (error) {
      console.error('[service:create] FAILED:', error);
      throw error;
    }
  });
}

// Export for cleanup on app quit
export function closeDatabase() {
  dbManager.close().catch((err) => {
    console.error('Error closing database on app quit:', err);
  });
}
