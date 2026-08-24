import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow } from 'electron';
import { getChromeStablePath } from '../core/events/browser/utils';

/**
 * Service to launch Chrome with the workflow recorder extension pre-loaded
 * Manages Chrome instances used for workflow recording
 */
export class ChromeRecorderLauncher {
  private static instance: ChromeRecorderLauncher;
  private activeBrowsers = new Map<string, { process: ChildProcess; port: number }>();

  private constructor() {}

  static getInstance(): ChromeRecorderLauncher {
    if (!ChromeRecorderLauncher.instance) {
      ChromeRecorderLauncher.instance = new ChromeRecorderLauncher();
    }
    return ChromeRecorderLauncher.instance;
  }

  /**
   * Launch Chrome with workflow recorder extension
   * @param workflowId - Unique workflow ID for tracking
   * @param url - Initial URL to open (default: chrome://newtab)
   * @returns Promise with success status and CDP port
   */
  async launchRecorderBrowser(
    workflowId: string,
    url: string = 'chrome://newtab',
  ): Promise<{ success: boolean; port?: number; error?: string }> {
    try {
      // Check if already launched for this workflow
      if (this.activeBrowsers.has(workflowId)) {
        const existing = this.activeBrowsers.get(workflowId)!;
        return { success: true, port: existing.port };
      }

      // Get Chrome executable path
      const executablePath = getChromeStablePath();
      if (!executablePath) {
        throw new Error('Chrome browser not found. Please install Google Chrome.');
      }

      // Create profile directory for this workflow recording session
      const userDataPath = app.getPath('userData');
      // Use a SINGLE shared profile for all recordings instead of per-workflow
      const profileDir = path.join(userDataPath, 'recorder_profile_shared');

      // ALWAYS delete extension cache to ensure latest version loads
      const extensionCachePath = path.join(profileDir, 'Default', 'Extensions');
      if (fs.existsSync(extensionCachePath)) {
        try {
          fs.rmSync(extensionCachePath, { recursive: true, force: true });
        } catch (error) {
          console.warn('[ChromeRecorderLauncher] ⚠️  Failed to delete extension cache:', error);
        }
      }

      // Only delete profile if it doesn't exist yet (first time setup)
      // This allows extension to persist across browser launches
      const isFirstTimeSetup = !fs.existsSync(profileDir);

      // Create profile directory if needed
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }

      // Path to the workflow recorder extension
      const extensionPath = path.join(process.cwd(), 'extensions', 'workflow-recorder');

      // Verify extension exists
      if (!fs.existsSync(extensionPath)) {
        throw new Error(`Extension not found at: ${extensionPath}`);
      }

      const manifestPath = path.join(extensionPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Extension manifest.json not found at: ${manifestPath}`);
      }

      // Setup Preferences file ONLY on first time setup
      if (isFirstTimeSetup) {
        const preferencesPath = path.join(profileDir, 'Default', 'Preferences');
        const preferencesDir = path.join(profileDir, 'Default');

        if (!fs.existsSync(preferencesDir)) {
          fs.mkdirSync(preferencesDir, { recursive: true });
        }

        const preferences = {
          browser: {
            custom_chrome_frame: false,
          },
          extensions: {
            // Enable Developer Mode - CRITICAL for unpacked extensions
            ui: {
              developer_mode: true,
            },
            settings: {},
          },
        };

        try {
          fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
        } catch (error) {
          console.error('[ChromeRecorderLauncher] ⚠️  Failed to create Preferences:', error);
        }
      }

      // Generate unique CDP port for this instance
      const cdpPort = 9222 + Math.floor(Math.random() * 1000);

      // Chrome launch arguments - USE --load-extension with absolute path
      const args = [
        // User data directory
        `--user-data-dir=${profileDir}`,
        // CRITICAL: Load extension with absolute path
        `--load-extension=${extensionPath}`,
        // Disable extension verification (allows unpacked extensions)
        '--disable-extensions-file-access-check',
        '--disable-extensions-http-throttling',
        // Basic flags
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
        // Security
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Remote debugging
        `--remote-debugging-port=${cdpPort}`,
      ];

      // Add URLs at the end (after all flags)
      args.push('chrome://extensions/');
      args.push(url);

      // Spawn Chrome process
      const chromeProcess = spawn(executablePath, args, {
        detached: false, // Keep attached to see output
        stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr
      });

      // Log Chrome output for debugging
      if (chromeProcess.stdout) {
        chromeProcess.stdout.on('data', () => {});
      }

      if (chromeProcess.stderr) {
        chromeProcess.stderr.on('data', (data) => {
          const message = data.toString().trim();
          // Only log extension-related errors
          if (
            message.includes('extension') ||
            message.includes('Extension') ||
            message.includes('manifest')
          ) {
            console.error(`[Chrome stderr] ${message}`);
          }
        });
      }

      // Store process reference
      this.activeBrowsers.set(workflowId, { process: chromeProcess, port: cdpPort });

      // Handle process exit
      chromeProcess.on('exit', () => {
        this.activeBrowsers.delete(workflowId);

        // Notify all renderer windows that recording has stopped
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('workflow:recording-stopped', workflowId);
          }
        }
      });

      chromeProcess.on('error', (error) => {
        console.error(
          `[ChromeRecorderLauncher] Chrome process error for workflow ${workflowId}:`,
          error,
        );
        this.activeBrowsers.delete(workflowId);

        // Notify all renderer windows that recording has stopped due to error
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('workflow:recording-stopped', workflowId);
          }
        }
      });

      // Unref to allow parent process to exit
      // chromeProcess.unref(); // Comment out to keep process attached and see logs
      return { success: true, port: cdpPort };
    } catch (error: any) {
      console.error('[ChromeRecorderLauncher] Error launching Chrome:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close Chrome browser for a specific workflow
   * @param workflowId - Workflow ID
   * @returns Success status
   */
  async closeBrowser(workflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const browser = this.activeBrowsers.get(workflowId);
      if (!browser) {
        return { success: false, error: 'No active browser found for this workflow' };
      }

      browser.process.kill('SIGTERM');
      this.activeBrowsers.delete(workflowId);

      return { success: true };
    } catch (error: any) {
      console.error('[ChromeRecorderLauncher] Error closing Chrome:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if browser is running for a workflow
   * @param workflowId - Workflow ID
   * @returns True if browser is active
   */
  isBrowserActive(workflowId: string): boolean {
    const browser = this.activeBrowsers.get(workflowId);
    if (!browser) return false;

    // Check if process is still alive
    try {
      process.kill(browser.process.pid!, 0);
      return true;
    } catch {
      this.activeBrowsers.delete(workflowId);
      return false;
    }
  }

  /**
   * Close all active browsers
   */
  closeAll(): void {
    for (const [workflowId, browser] of this.activeBrowsers.entries()) {
      try {
        browser.process.kill('SIGTERM');
      } catch (error) {
        console.error(`[ChromeRecorderLauncher] Error closing browser for ${workflowId}:`, error);
      }
    }
    this.activeBrowsers.clear();
  }
}
