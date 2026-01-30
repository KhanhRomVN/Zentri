import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import { setupEmailHandlers } from './email';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

let db: Database | null = null;

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
        const fileContent = fs.readFileSync(storagePath, 'utf8');
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
      fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
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

      const fileContent = fs.readFileSync(storagePath, 'utf8');
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

      const fileContent = fs.readFileSync(storagePath, 'utf8');
      try {
        const data = JSON.parse(fileContent);
        delete data[key];
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
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
      // Close existing database if open
      if (db) {
        await new Promise<void>((resolve, reject) => {
          db!.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        db = null;
      }

      // Create new database with callback to ensure it's ready
      return new Promise<void>((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
          if (err) {
            db = null;
            reject(err);
          } else {
            // Database is successfully created and ready
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error creating database:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:open', async (_event, dbPath: string) => {
    try {
      // Close existing database if open
      if (db) {
        await new Promise<void>((resolve) => {
          const dbToClose = db;
          db = null; // Clear reference before close

          dbToClose!.close((err) => {
            if (err) {
              console.warn('Warning: Error closing previous database:', err);
              resolve();
            } else {
              resolve();
            }
          });
        });
      }

      // Wait a bit after closing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Open new database
      return new Promise<void>((resolve, reject) => {
        const newDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
          if (err) {
            reject(err);
          } else {
            db = newDb;
            setTimeout(() => resolve(), 50);
          }
        });
      });
    } catch (error) {
      console.error('Error opening database:', error);
      db = null;
      throw error;
    }
  });

  ipcMain.handle('sqlite:close', async () => {
    try {
      if (db) {
        await new Promise<void>((resolve, reject) => {
          db!.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        db = null;
      }
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:run', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected');

      return new Promise((resolve, reject) => {
        db!.run(query, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes,
            });
          }
        });
      });
    } catch (error) {
      console.error('Error running query:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:all', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected');

      return new Promise((resolve, reject) => {
        db!.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (error) {
      console.error('Error running select query:', error);
      throw error;
    }
  });

  ipcMain.handle('sqlite:get', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected');

      return new Promise((resolve, reject) => {
        db!.get(query, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
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

  // Utility Fetch Handler to bypass CORS
  ipcMain.handle('util:fetch', async (_event, url: string) => {
    try {
      const response = await fetch(url);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      return {
        success: response.ok,
        status: response.status,
        data: isJson ? await response.json() : await response.text(),
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      console.error(`Fetch error for ${url}:`, error);
      return { success: false, error: error.message };
    }
  });

  // 1. Select Git Folder
  ipcMain.handle('git:select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (canceled) return null;
    return filePaths[0];
  });

  // 2. Read file data from git folder
  ipcMain.handle(
    'git:read-data',
    async (_event, folderPath: string, filename: string = 'emails.json') => {
      const filePath = path.join(folderPath, filename);
      if (!fs.existsSync(filePath)) return { success: true, data: null };
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data: JSON.parse(content) };
      } catch (e: any) {
        console.error(`Error reading ${filename}:`, e);
        return { success: false, error: e.message };
      }
    },
  );

  // 3. Write data to file in git folder
  ipcMain.handle(
    'git:write-data',
    async (
      _event,
      {
        folderPath,
        data,
        filename = 'emails.json',
      }: { folderPath: string; data: any; filename?: string },
    ) => {
      try {
        const filePath = path.join(folderPath, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
      } catch (e) {
        console.error(`Error writing ${filename}:`, e);
        return false;
      }
    },
  );

  // 4. Git Sync (Add, Commit, Push)
  ipcMain.handle('git:sync-repo', async (_event, folderPath: string) => {
    try {
      // Execute git commands sequentially
      // Use bash explicitly to handle shell aliases or path issues if any
      const commands = ['git add .', 'git commit -m "Zentri Sync: Updated data"', 'git push'];

      for (const cmd of commands) {
        try {
          const { stdout, stderr } = await execAsync(cmd, { cwd: folderPath });
          console.log(`[Git Stdout]: ${stdout}`);
          if (stderr) console.error(`[Git Stderr]: ${stderr}`);
        } catch (e: any) {
          // If already up-to-date or nothing to commit, commit might fail.
          // Check for 'nothing to commit' in message if needed, or just warn for commit.
          if (
            cmd.includes('commit') &&
            (e.message.includes('nothing to commit') || e.message.includes('up to date'))
          ) {
            console.log('Nothing to commit, skipping push might be better but we continue.');
            continue;
          }
          if (cmd.includes('push') && e.message.includes('Everything up-to-date')) {
            continue;
          }
          console.error(`Error executing git cmd: ${cmd}`, e);
          throw e;
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error('Git Sync Error:', error);
      return { success: false, error: error.message };
    }
  });
}

// Export for cleanup on app quit
export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database on app quit:', err);
    });
  }
}
