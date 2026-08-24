import { chromium, type BrowserContext, type Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow } from 'electron';
import * as os from 'os';

/**
 * Service to launch Chrome with the workflow recorder extension pre-loaded using Playwright
 * Manages Chrome instances used for workflow recording with script execution capability
 */
export class ChromeRecorderLauncher {
  private static instance: ChromeRecorderLauncher;
  private activeBrowsers = new Map<
    string,
    { context: BrowserContext; page: Page; profileDir: string }
  >();

  private constructor() {}

  static getInstance(): ChromeRecorderLauncher {
    if (!ChromeRecorderLauncher.instance) {
      ChromeRecorderLauncher.instance = new ChromeRecorderLauncher();
    }
    return ChromeRecorderLauncher.instance;
  }

  /**
   * Get the permanent profile directory in ~/.zentri/profiles/recorder
   */
  private getRecorderProfileDir(): string {
    const homeDir = os.homedir();
    const zentriDir = path.join(homeDir, '.zentri', 'profiles', 'recorder');

    // Create directory if it doesn't exist
    if (!fs.existsSync(zentriDir)) {
      fs.mkdirSync(zentriDir, { recursive: true });
    }

    return zentriDir;
  }

  /**
   * Copy extension to profile directory for persistent loading
   */
  private copyExtensionToProfile(profileDir: string, extensionPath: string): void {
    const profileExtensionsDir = path.join(profileDir, 'Extensions');
    const targetExtensionDir = path.join(profileExtensionsDir, 'zentri-workflow-recorder');

    // Create Extensions directory if needed
    if (!fs.existsSync(profileExtensionsDir)) {
      fs.mkdirSync(profileExtensionsDir, { recursive: true });
    }

    // Remove old extension copy if exists
    if (fs.existsSync(targetExtensionDir)) {
      try {
        fs.rmSync(targetExtensionDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('[ChromeRecorderLauncher] ⚠️  Failed to remove old extension:', error);
      }
    }

    // Copy extension to profile
    try {
      this.copyDirectoryRecursive(extensionPath, targetExtensionDir);
      console.log(`[ChromeRecorderLauncher] ✓ Copied extension to profile`);
    } catch (error) {
      console.error('[ChromeRecorderLauncher] ❌ Failed to copy extension:', error);
      throw error;
    }
  }

  /**
   * Recursively copy directory
   */
  private copyDirectoryRecursive(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Setup Chrome Preferences file to enable Developer Mode for extensions
   */
  private setupChromePreferences(profileDir: string): void {
    const preferencesPath = path.join(profileDir, 'Default', 'Preferences');
    const preferencesDir = path.join(profileDir, 'Default');

    // Create Default directory if needed
    if (!fs.existsSync(preferencesDir)) {
      fs.mkdirSync(preferencesDir, { recursive: true });
    }

    // Check if Preferences already exists
    if (fs.existsSync(preferencesPath)) {
      try {
        // Read existing preferences
        const existingPrefs = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));

        // Update only the extensions.ui.developer_mode field
        if (!existingPrefs.extensions) {
          existingPrefs.extensions = {};
        }
        if (!existingPrefs.extensions.ui) {
          existingPrefs.extensions.ui = {};
        }
        existingPrefs.extensions.ui.developer_mode = true;

        // Write back
        fs.writeFileSync(preferencesPath, JSON.stringify(existingPrefs, null, 2));
        console.log('[ChromeRecorderLauncher] ✓ Updated existing Preferences file');
        return;
      } catch (error) {
        console.warn('[ChromeRecorderLauncher] ⚠️  Failed to update existing Preferences:', error);
        // Continue to create new preferences
      }
    }

    // Create new Preferences file
    const preferences = {
      browser: {
        custom_chrome_frame: false,
      },
      extensions: {
        ui: {
          developer_mode: true,
        },
        settings: {},
      },
    };

    try {
      fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
      console.log('[ChromeRecorderLauncher] ✓ Created Preferences file');
    } catch (error) {
      console.error('[ChromeRecorderLauncher] ⚠️  Failed to create Preferences:', error);
    }
  }

  /**
   * Launch Chrome with workflow recorder extension using Playwright
   * @param workflowId - Unique workflow ID for tracking
   * @param url - Initial URL to open (default: chrome://newtab)
   * @returns Promise with success status
   */
  async launchRecorderBrowser(
    workflowId: string,
    url: string = 'chrome://newtab',
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already launched for this workflow
      if (this.activeBrowsers.has(workflowId)) {
        return { success: true };
      }

      // Use permanent profile directory in ~/.zentri
      const profileDir = this.getRecorderProfileDir();

      // Setup Chrome Preferences to enable Developer Mode
      this.setupChromePreferences(profileDir);

      // ALWAYS delete extension cache to ensure latest version loads
      const extensionCachePath = path.join(profileDir, 'Default', 'Extensions');
      if (fs.existsSync(extensionCachePath)) {
        try {
          fs.rmSync(extensionCachePath, { recursive: true, force: true });
          console.log('[ChromeRecorderLauncher] ✓ Deleted extension cache');
        } catch (error) {
          console.warn('[ChromeRecorderLauncher] ⚠️  Failed to delete extension cache:', error);
        }
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

      console.log(`[ChromeRecorderLauncher] Launching with profile: ${profileDir}`);
      console.log(`[ChromeRecorderLauncher] Loading extension from: ${extensionPath}`);

      // Launch browser with Playwright + Extension
      const context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        args: [
          // CRITICAL: Use both --disable-extensions-except and --load-extension
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          // Disable extension verification
          `--disable-extensions-file-access-check`,
          `--disable-extensions-http-throttling`,
          // Enable extension developer mode
          `--enable-extension-activity-logging`,
          // Anti-detection (optional)
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });

      // Inject stealth scripts (optional - hide automation flags)
      await context.addInitScript(`
        // Override navigator.webdriver
        Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
          get: () => undefined,
        });

        // Override plugins
        Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Chrome object
        (window as any).chrome = {
          runtime: {},
        };
      `);

      // Get or create first page
      const pages = context.pages();
      const page = pages.length > 0 ? pages[0] : await context.newPage();

      // Navigate to URL
      if (url !== 'chrome://newtab') {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }

      // Store browser reference
      this.activeBrowsers.set(workflowId, { context, page, profileDir });

      // Handle context close
      context.on('close', () => {
        this.activeBrowsers.delete(workflowId);

        // Notify all renderer windows that recording has stopped
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('workflow:recording-stopped', workflowId);
          }
        }
      });

      console.log(`[ChromeRecorderLauncher] ✓ Browser launched successfully for ${workflowId}`);
      return { success: true };
    } catch (error: any) {
      console.error('[ChromeRecorderLauncher] Error launching Chrome:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute workflow on the recorder browser (similar to PlaywrightWorkflowExecutor)
   * @param workflowId - Workflow ID
   * @param nodes - Workflow nodes to execute
   * @param logCallback - Optional callback for logging
   * @returns Execution results
   */
  async executeWorkflow(
    workflowId: string,
    nodes: any[],
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const browser = this.activeBrowsers.get(workflowId);
      if (!browser) {
        return { success: false, error: 'No active browser found for this workflow' };
      }

      // Get current active page (might have changed since launch)
      const pages = browser.context.pages();
      if (pages.length === 0) {
        return { success: false, error: 'No pages found in browser context' };
      }

      // Use the first page or last active page
      const page = pages[pages.length - 1];

      // Update stored page reference
      this.activeBrowsers.set(workflowId, { ...browser, page });

      logCallback?.('info', `Starting workflow execution on recorder browser for ${workflowId}`);

      // Execute workflow nodes
      const results = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        logCallback?.(
          'node_start',
          `▶ Starting Node ${i + 1}/${nodes.length}: ${node.title || node.type}`,
          node.id,
          {
            nodeIndex: i + 1,
            totalNodes: nodes.length,
            nodeType: node.type,
          },
        );

        try {
          const result = await this.executeNode(page, node, logCallback);
          results.push({ node, result, success: true });

          logCallback?.(
            'node_end',
            `✓ Completed Node ${i + 1}/${nodes.length}: ${node.title || node.type}`,
            node.id,
            result,
          );
        } catch (error: any) {
          logCallback?.(
            'node_end',
            `✗ Failed Node ${i + 1}/${nodes.length}: ${error.message}`,
            node.id,
            { error: error.message },
          );
          console.error(`[ChromeRecorderLauncher] ✗ Node ${i + 1} failed:`, error.message);
          results.push({ node, error: error.message, success: false });

          // Check if we should skip or stop
          const config = this.parseNodeConfig(node);
          if (!config.skipNotFound) {
            throw error;
          }
        }

        // Delay between nodes
        const config = this.parseNodeConfig(node);
        if (config.delay) {
          logCallback?.('info', `Waiting ${config.delay}ms before next node`, node.id);
          await page.waitForTimeout(config.delay);
        }
      }

      logCallback?.('success', `Workflow completed successfully for ${workflowId}`);
      return { success: true, results };
    } catch (error: any) {
      logCallback?.('error', `Workflow execution failed: ${error.message}`);
      console.error(`[ChromeRecorderLauncher] Workflow execution failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a single workflow node (same logic as PlaywrightWorkflowExecutor)
   */
  private async executeNode(
    page: Page,
    node: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
  ): Promise<any> {
    const config = this.parseNodeConfig(node);
    const action = config.action || node.type;
    const selector = action === 'go_to_url' ? '' : node.subtitle || '';

    logCallback?.('info', `Action: ${action}`, node.id, { selector, config });

    switch (action) {
      case 'go_to_url':
        const url = config.url || node.subtitle || '';
        if (!url) throw new Error('No URL specified');
        logCallback?.('info', `Navigating to: ${url}`, node.id);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        logCallback?.('success', `Successfully navigated to: ${url}`, node.id);
        return { action: 'go_to_url', url };

      case 'click':
      case 'click_web':
        if (!selector) throw new Error('No selector specified for click');
        const timeout = config.timeout || 5000;
        await page.waitForSelector(selector, { timeout, state: 'visible' });
        await page.locator(selector).scrollIntoViewIfNeeded();
        const clickType = config.clickType || 'Left click';
        if (clickType === 'Double click') {
          await page.dblclick(selector);
        } else if (clickType === 'Right click') {
          await page.click(selector, { button: 'right' });
        } else {
          await page.click(selector);
        }
        logCallback?.('success', `Click completed: ${clickType}`, node.id);
        return { action: 'click', clickType };

      case 'type':
      case 'input_web':
        if (!selector) throw new Error('No selector specified for input');
        const text = config.text || config.textToEnter || '';
        const clearBefore = config.clearBefore !== false;
        await page.waitForSelector(selector, { timeout: config.timeout || 5000, state: 'visible' });
        if (clearBefore) await page.fill(selector, '');
        await page.locator(selector).pressSequentially(text, { delay: config.typingDelay || 50 });
        logCallback?.('success', `Text input completed`, node.id);
        return { action: 'input', text };

      case 'element_check':
        if (!selector) throw new Error('No selector specified for assert');
        const assertType = config.assertType || 'Is Visible';
        logCallback?.('info', `Assert: ${assertType} for ${selector}`, node.id);
        if (assertType === 'Is Visible') {
          await page.waitForSelector(selector, {
            timeout: config.timeout || 5000,
            state: 'visible',
          });
        } else if (assertType === 'Is Hidden') {
          await page.waitForSelector(selector, {
            timeout: config.timeout || 5000,
            state: 'hidden',
          });
        }
        logCallback?.('success', `Assert passed: ${assertType}`, node.id);
        return { action: 'assert', assertType };

      default:
        throw new Error(`Unknown action type: ${action}`);
    }
  }

  /**
   * Parse node configuration from note field
   */
  private parseNodeConfig(node: any): any {
    try {
      if (node.note) {
        const parsed = JSON.parse(node.note);
        return parsed.config || {};
      }
    } catch (e) {
      // Ignore parse errors
    }
    return {};
  }

  /**
   * Get the active page for a workflow (for external control)
   * @param workflowId - Workflow ID
   * @returns Playwright Page instance or undefined
   */
  getPage(workflowId: string): Page | undefined {
    return this.activeBrowsers.get(workflowId)?.page;
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

      await browser.context.close();
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

    // Check if context is still open
    try {
      return !browser.context.browser()?.isConnected() ? false : true;
    } catch {
      this.activeBrowsers.delete(workflowId);
      return false;
    }
  }

  /**
   * Close all active browsers
   */
  async closeAll(): Promise<void> {
    for (const [workflowId, browser] of this.activeBrowsers.entries()) {
      try {
        await browser.context.close();
      } catch (error) {
        console.error(`[ChromeRecorderLauncher] Error closing browser for ${workflowId}:`, error);
      }
    }
    this.activeBrowsers.clear();
  }
}
