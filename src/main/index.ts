import * as dotenv from 'dotenv'
dotenv.config()
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as sqlite3 from 'sqlite3'
import { Database } from 'sqlite3'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null
let db: Database | null = null

// Storage file path
const getStorageFilePath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'email-manager-config.json')
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])

    // Enable auto-reload in development
    mainWindow.webContents.on('did-fail-load', () => {
      if (mainWindow) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] as string)
      }
    })

    if (is.dev && mainWindow) {
      mainWindow.webContents.on('did-finish-load', () => {
        if (mainWindow) {
          mainWindow.blur()
          mainWindow.webContents.openDevTools({ mode: 'detach' })
        }
      })
    }
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Setup IPC handlers for storage operations
function setupStorageHandlers() {
  // Set storage value
  ipcMain.handle('storage:set', async (_event, key: string, value: any) => {
    try {
      const storagePath = getStorageFilePath()
      let data = {}

      // Read existing data if file exists
      if (fs.existsSync(storagePath)) {
        const fileContent = fs.readFileSync(storagePath, 'utf8')
        try {
          data = JSON.parse(fileContent)
        } catch (parseError) {
          console.warn('Failed to parse storage file, creating new one')
          data = {}
        }
      }

      // Update data
      data[key] = value

      // Write back to file
      fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
      console.error('Error setting storage value:', error)
      throw error
    }
  })

  // Get storage value
  ipcMain.handle('storage:get', async (_event, key: string) => {
    try {
      const storagePath = getStorageFilePath()

      if (!fs.existsSync(storagePath)) {
        return null
      }

      const fileContent = fs.readFileSync(storagePath, 'utf8')
      try {
        const data = JSON.parse(fileContent)
        return data[key] || null
      } catch (parseError) {
        console.warn('Failed to parse storage file')
        return null
      }
    } catch (error) {
      console.error('Error getting storage value:', error)
      return null
    }
  })

  // Remove storage value
  ipcMain.handle('storage:remove', async (_event, key: string) => {
    try {
      const storagePath = getStorageFilePath()

      if (!fs.existsSync(storagePath)) {
        return
      }

      const fileContent = fs.readFileSync(storagePath, 'utf8')
      try {
        const data = JSON.parse(fileContent)
        delete data[key]
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8')
      } catch (parseError) {
        console.warn('Failed to parse storage file')
      }
    } catch (error) {
      console.error('Error removing storage value:', error)
      throw error
    }
  })
}

// Setup IPC handlers for database operations
function setupDatabaseHandlers() {
  // Dialog handlers
  ipcMain.handle('dialog:save', async (_event, options) => {
    if (!mainWindow) throw new Error('Main window not available')

    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath || 'database.db',
        filters: options.filters || [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      return {
        canceled: result.canceled,
        filePath: result.filePath
      }
    } catch (error) {
      console.error('Error in dialog:save:', error)
      throw error
    }
  })

  ipcMain.handle('dialog:open', async (_event, options) => {
    if (!mainWindow) throw new Error('Main window not available')

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || 'Open File',
        filters: options.filters || [
          { name: 'Database Files', extensions: ['db', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: options.properties || ['openFile']
      })

      return {
        canceled: result.canceled,
        filePaths: result.filePaths
      }
    } catch (error) {
      console.error('Error in dialog:open:', error)
      throw error
    }
  })

  // File system handlers
  ipcMain.handle('fs:exists', async (_event, path: string) => {
    try {
      return fs.existsSync(path)
    } catch (error) {
      console.error('Error checking file existence:', error)
      return false
    }
  })

  ipcMain.handle(
    'fs:createDirectory',
    async (_event, dirPath: string, options?: { recursive?: boolean }) => {
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: options?.recursive ?? true })
        }
      } catch (error) {
        console.error('Error creating directory:', error)
        throw error
      }
    }
  )

  // SQLite handlers
  ipcMain.handle('sqlite:create', async (_event, path: string) => {
    try {
      // Close existing database if open
      if (db) {
        await new Promise<void>((resolve, reject) => {
          db!.close((err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        db = null
      }

      // Create new database with callback to ensure it's ready
      return new Promise<void>((resolve, reject) => {
        db = new sqlite3.Database(path, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
          if (err) {
            db = null
            reject(err)
          } else {
            // Database is successfully created and ready
            resolve()
          }
        })
      })
    } catch (error) {
      console.error('Error creating database:', error)
      throw error
    }
  })

  ipcMain.handle('sqlite:open', async (_event, path: string) => {
    try {
      // Close existing database if open
      if (db) {
        await new Promise<void>((resolve, reject) => {
          db!.close((err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        db = null
      }

      // Open existing database with callback to ensure it's ready
      return new Promise<void>((resolve, reject) => {
        db = new sqlite3.Database(path, sqlite3.OPEN_READWRITE, (err) => {
          if (err) {
            db = null
            reject(err)
          } else {
            // Database is successfully opened and ready
            resolve()
          }
        })
      })
    } catch (error) {
      console.error('Error opening database:', error)
      throw error
    }
  })

  ipcMain.handle('sqlite:close', async () => {
    try {
      if (db) {
        await new Promise<void>((resolve, reject) => {
          db!.close((err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        db = null
      }
    } catch (error) {
      console.error('Error closing database:', error)
      throw error
    }
  })

  ipcMain.handle('sqlite:run', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected')

      return new Promise((resolve, reject) => {
        db!.run(query, params, function (err) {
          if (err) {
            reject(err)
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes
            })
          }
        })
      })
    } catch (error) {
      console.error('Error running query:', error)
      throw error
    }
  })

  ipcMain.handle('sqlite:all', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected')

      return new Promise((resolve, reject) => {
        db!.all(query, params, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    } catch (error) {
      console.error('Error running select query:', error)
      throw error
    }
  })

  ipcMain.handle('sqlite:get', async (_event, query: string, params: any[] = []) => {
    try {
      if (!db) throw new Error('Database not connected')

      return new Promise((resolve, reject) => {
        db!.get(query, params, (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        })
      })
    } catch (error) {
      console.error('Error running get query:', error)
      throw error
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Setup IPC handlers
  setupStorageHandlers()
  setupDatabaseHandlers()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Hot reload in development
  if (is.dev) {
    app.on('activate', () => {
      if (mainWindow === null) createWindow()
    })

    if (mainWindow) {
      mainWindow.webContents.on('destroyed', () => {
        mainWindow = null
      })
    }
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  // Close database connection when app is closing
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database on app quit:', err)
    })
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
