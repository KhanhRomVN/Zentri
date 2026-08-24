import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { app } from 'electron';
import * as path from 'path';

/**
 * Service to execute workflows using Playwright (CDP)
 * Provides better control, anti-detection, and reliability than extensions
 */
export class PlaywrightWorkflowExecutor {
  private static instance: PlaywrightWorkflowExecutor;
  private activeSessions = new Map<
    string,
    { browser: Browser; context: BrowserContext; page: Page }
  >();

  private constructor() {}

  static getInstance(): PlaywrightWorkflowExecutor {
    if (!PlaywrightWorkflowExecutor.instance) {
      PlaywrightWorkflowExecutor.instance = new PlaywrightWorkflowExecutor();
    }
    return PlaywrightWorkflowExecutor.instance;
  }

  /**
   * Launch browser and execute workflow
   * @param logCallback Optional callback to emit logs (level, message, nodeId, metadata)
   */
  async executeWorkflow(
    instanceId: string,
    nodes: any[],
    options: {
      startUrl?: string;
      headless?: boolean;
      userDataDir?: string;
      proxy?: {
        server: string;
        username?: string;
        password?: string;
      };
    } = {},
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      logCallback?.('info', `Starting workflow execution for ${instanceId}`);
      // Determine user data directory
      const userDataDir =
        options.userDataDir || path.join(app.getPath('userData'), 'browser_profiles', instanceId);

      logCallback?.('info', `Launching browser with profile: ${userDataDir}`);

      // Launch browser with anti-detection settings
      const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: options.headless || false,
        args: [
          '--disable-blink-features=AutomationControlled', // Critical for anti-detection
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Ho_Chi_Minh',
        permissions: ['geolocation', 'notifications'],
        proxy: options.proxy,
        // Stealth settings
        javaScriptEnabled: true,
        bypassCSP: true,
      });

      // Inject stealth scripts to bypass detection
      await browser.addInitScript(`
        // Override navigator.webdriver
        Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
          get: () => undefined,
        });

        // Override plugins
        Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(Object.getPrototypeOf(navigator), 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Chrome object
        (window as any).chrome = {
          runtime: {},
        };

        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: 'denied' } as PermissionStatus)
            : originalQuery(parameters);
      `);

      const page = browser.pages()[0] || (await browser.newPage());

      // Store session - browser context is used as both browser and context
      this.activeSessions.set(instanceId, {
        browser: browser as any as Browser,
        context: browser,
        page,
      });

      logCallback?.('success', `Browser launched successfully`);
      // Navigate to start URL
      const startUrl = options.startUrl || 'https://google.com';
      logCallback?.('info', `Navigating to: ${startUrl}`);
      await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
      logCallback?.('success', `Navigation successful`);

      // Execute workflow nodes
      const results = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Log NODE START (with special marker)
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

          // Log NODE END (with special marker)
          logCallback?.(
            'node_end',
            `✓ Completed Node ${i + 1}/${nodes.length}: ${node.title || node.type}`,
            node.id,
            result,
          );
        } catch (error: any) {
          // Log NODE END with error (with special marker)
          logCallback?.(
            'node_end',
            `✗ Failed Node ${i + 1}/${nodes.length}: ${error.message}`,
            node.id,
            { error: error.message },
          );
          console.error(`[PlaywrightExecutor] ✗ Node ${i + 1} failed:`, error.message);
          results.push({ node, error: error.message, success: false });

          // Check if we should skip or stop
          const config = this.parseNodeConfig(node);
          if (!config.skipNotFound) {
            // Stop workflow on error
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

      logCallback?.('success', `Workflow completed successfully for ${instanceId}`);
      return { success: true, results };
    } catch (error: any) {
      logCallback?.('error', `Workflow execution failed: ${error.message}`);
      console.error(`[PlaywrightExecutor] Workflow execution failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a single workflow node
   */
  private async executeNode(
    page: Page,
    node: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
  ): Promise<any> {
    const config = this.parseNodeConfig(node);

    // Check if action is specified in config (overrides node type)
    const action = config.action || node.type;

    // For go_to_url action, subtitle or config.url contains the URL (not a selector)
    // For scroll with pixels mode, no selector is needed
    let selector = '';
    if (action === 'go_to_url') {
      selector = '';
    } else if (action === 'scroll' && config.scrollType === 'pixels') {
      selector = ''; // No selector needed for pixel-based scroll
    } else {
      selector = node.subtitle || '';
    }

    // DEBUG: Log action determination
    logCallback?.(
      'info',
      `[DEBUG] executeNode: node.type="${node.type}", config.action="${config.action || 'undefined'}", final action="${action}", selector="${selector}"`,
      node.id,
    );

    logCallback?.('info', `Action: ${action}`, node.id, { selector, config });

    switch (action) {
      case 'go_to_url':
        return await this.executeGoToUrl(page, config, node.subtitle, logCallback, node.id);

      case 'click':
      case 'click_web':
        return await this.executeClick(page, selector, config, logCallback, node.id);

      case 'type':
      case 'input_web':
        return await this.executeInput(page, selector, config, logCallback, node.id);

      case 'element_check':
        return await this.executeAssert(page, selector, config, logCallback, node.id);

      case 'hover':
      case 'hover_web':
        return await this.executeHover(page, selector, config, logCallback, node.id);

      case 'extract':
      case 'extract_web':
        return await this.executeExtract(page, selector, config, logCallback, node.id);

      case 'scroll':
      case 'scroll_web':
        return await this.executeScroll(page, selector, config, logCallback, node.id);

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
   * Execute go to URL action
   */
  private async executeGoToUrl(
    page: Page,
    config: any,
    subtitle?: string,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // URL can be in config.url OR in subtitle (for nodes created from UI)
    const url = config.url || subtitle || '';
    if (!url) {
      throw new Error('No URL specified');
    }

    logCallback?.('info', `Navigating to: ${url}`, nodeId);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    logCallback?.('success', `Successfully navigated to: ${url}`, nodeId);
    return { action: 'go_to_url', url };
  }

  /**
   * Execute click action
   */
  private async executeClick(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // Validate selector
    if (!selector || selector.trim() === '') {
      const error =
        'No selector specified for click action. Please add a CSS selector in the node subtitle.';
      logCallback?.('error', error, nodeId);
      throw new Error(error);
    }

    const timeout = config.timeout || 5000;

    logCallback?.('info', `Waiting for element: ${selector}`, nodeId);
    // Wait for element
    await page.waitForSelector(selector, { timeout, state: 'visible' });

    logCallback?.('info', `Scrolling element into view`, nodeId);
    // Scroll into view
    await page.locator(selector).scrollIntoViewIfNeeded();

    // Click based on type
    const clickType = config.clickType || 'Left click';
    logCallback?.('info', `Performing ${clickType}`, nodeId);
    if (clickType === 'Double click') {
      await page.dblclick(selector);
    } else if (clickType === 'Right click') {
      await page.click(selector, { button: 'right' });
    } else {
      await page.click(selector);
    }

    logCallback?.('success', `Click completed: ${clickType}`, nodeId);
    return { action: 'click', clickType };
  }

  /**
   * Execute input/type action
   */
  private async executeInput(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // Validate selector
    if (!selector || selector.trim() === '') {
      const error =
        'No selector specified for input action. Please add a CSS selector in the node subtitle.';
      logCallback?.('error', error, nodeId);
      throw new Error(error);
    }

    const text = config.text || config.textToEnter || '';
    const clearBefore = config.clearBefore !== false;
    const typingDelay = config.typingDelay || 50;
    const timeout = config.timeout || 5000;

    logCallback?.('info', `Waiting for input element: ${selector}`, nodeId);
    // Wait for element
    await page.waitForSelector(selector, { timeout, state: 'visible' });

    // Clear if needed
    if (clearBefore) {
      logCallback?.('info', `Clearing existing text`, nodeId);
      await page.fill(selector, '');
    }

    logCallback?.('info', `Typing text (${text.length} characters)`, nodeId);
    // Type with human-like delay using locator.pressSequentially
    await page.locator(selector).pressSequentially(text, { delay: typingDelay });

    logCallback?.('success', `Text input completed`, nodeId);
    return { action: 'input', text };
  }

  /**
   * Execute assert/check action
   */
  private async executeAssert(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // Validate selector
    if (!selector || selector.trim() === '') {
      const error =
        'No selector specified for assert action. Please add a CSS selector in the node subtitle.';
      logCallback?.('error', error, nodeId);
      throw new Error(error);
    }

    const assertType = config.assertType || 'Is Visible';
    const timeout = config.timeout || 5000;

    logCallback?.('info', `Assert: ${assertType} for ${selector}`, nodeId);

    if (assertType === 'Is Visible') {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
    } else if (assertType === 'Is Hidden') {
      await page.waitForSelector(selector, { timeout, state: 'hidden' });
    } else if (assertType === 'Contains Text') {
      const expectedText = config.expectedText || '';
      const element = await page.waitForSelector(selector, { timeout });
      const text = await element?.textContent();
      if (!text?.includes(expectedText)) {
        throw new Error(`Text "${expectedText}" not found in element`);
      }
    } else if (assertType === 'Has Attribute') {
      const attrName = config.attributeName || '';
      const element = await page.waitForSelector(selector, { timeout });
      const attrValue = await element?.getAttribute(attrName);
      if (attrValue === null) {
        throw new Error(`Attribute "${attrName}" not found`);
      }
    }

    logCallback?.('success', `Assert passed: ${assertType}`, nodeId);
    return { action: 'assert', assertType };
  }

  /**
   * Execute hover action
   */
  private async executeHover(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // Validate selector
    if (!selector || selector.trim() === '') {
      const error =
        'No selector specified for hover action. Please add a CSS selector in the node subtitle.';
      logCallback?.('error', error, nodeId);
      throw new Error(error);
    }

    const timeout = config.timeout || 5000;

    logCallback?.('info', `Hovering over: ${selector}`, nodeId);
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    await page.hover(selector);

    logCallback?.('success', `Hover completed`, nodeId);
    return { action: 'hover' };
  }

  /**
   * Execute extract text action
   */
  private async executeExtract(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    // Validate selector
    if (!selector || selector.trim() === '') {
      const error =
        'No selector specified for extract action. Please add a CSS selector in the node subtitle.';
      logCallback?.('error', error, nodeId);
      throw new Error(error);
    }

    const timeout = config.timeout || 5000;

    logCallback?.('info', `Extracting text from: ${selector}`, nodeId);
    const element = await page.waitForSelector(selector, { timeout });
    const text = await element?.textContent();

    logCallback?.('success', `Extracted text: ${text?.substring(0, 50)}...`, nodeId, { text });
    return { action: 'extract', text };
  }

  /**
   * Execute scroll action
   */
  private async executeScroll(
    page: Page,
    selector: string,
    config: any,
    logCallback?: (level: string, message: string, nodeId?: string, metadata?: any) => void,
    nodeId?: string,
  ): Promise<any> {
    const timeout = config.timeout || 5000;
    const scrollType = config.scrollType || 'element';

    if (scrollType === 'pixels') {
      // Scroll by pixels
      const scrollPixels = config.scrollPixels || 500;
      const scrollWait = config.scrollWait || 1000;
      const scrollRepeat = config.scrollRepeat || 1;

      logCallback?.('info', `Scrolling down ${scrollPixels}px, ${scrollRepeat} time(s)`, nodeId);

      // Repeat scroll
      for (let i = 0; i < scrollRepeat; i++) {
        logCallback?.(
          'info',
          `Scroll ${i + 1}/${scrollRepeat}: scrolling ${scrollPixels}px`,
          nodeId,
        );

        await page.evaluate((pixels) => {
          window.scrollBy(0, pixels);
        }, scrollPixels);

        // Wait after each scroll for content to load (except for the last one, it will use delay after execution)
        if (i < scrollRepeat - 1) {
          logCallback?.('info', `Waiting ${scrollWait}ms before next scroll`, nodeId);
          await page.waitForTimeout(scrollWait);
        }
      }

      // Final wait after all scrolls
      logCallback?.('info', `Waiting ${scrollWait}ms for final content to load`, nodeId);
      await page.waitForTimeout(scrollWait);

      logCallback?.(
        'success',
        `Scroll by ${scrollPixels}px completed (${scrollRepeat} time(s))`,
        nodeId,
      );
      return { action: 'scroll', scrollType: 'pixels', scrollPixels, scrollWait, scrollRepeat };
    } else {
      // Scroll to element (default behavior)
      logCallback?.('info', `Scrolling to element: ${selector}`, nodeId);
      await page.waitForSelector(selector, { timeout });
      await page.locator(selector).scrollIntoViewIfNeeded();

      logCallback?.('success', `Scroll to element completed`, nodeId);
      return { action: 'scroll', scrollType: 'element' };
    }
  }

  /**
   * Close browser session
   */
  async closeSession(instanceId: string): Promise<void> {
    const session = this.activeSessions.get(instanceId);
    if (session) {
      await session.browser.close();
      this.activeSessions.delete(instanceId);
    }
  }

  /**
   * Close all active sessions
   */
  async closeAll(): Promise<void> {
    for (const [instanceId, session] of this.activeSessions.entries()) {
      try {
        await session.browser.close();
      } catch (error) {
        console.error(`[PlaywrightExecutor] Error closing session ${instanceId}:`, error);
      }
    }
    this.activeSessions.clear();
  }

  /**
   * Check if session is active
   */
  isSessionActive(instanceId: string): boolean {
    return this.activeSessions.has(instanceId);
  }

  /**
   * Get active page for manual control
   */
  getPage(instanceId: string): Page | undefined {
    return this.activeSessions.get(instanceId)?.page;
  }
}
