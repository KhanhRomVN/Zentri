import { spawn, type ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Service to launch CloakBrowser (stealth Chromium with 87 C++ patches)
 * Manages browser instances for anti-detection browsing
 */
export class CloakBrowserLauncher {
  private static instance: CloakBrowserLauncher;
  private activeBrowsers = new Map<string, { process: ChildProcess; profileDir: string }>();

  private constructor() {}

  static getInstance(): CloakBrowserLauncher {
    if (!CloakBrowserLauncher.instance) {
      CloakBrowserLauncher.instance = new CloakBrowserLauncher();
    }
    return CloakBrowserLauncher.instance;
  }

  /**
   * Get profile directory for CloakBrowser
   */
  private getCloakProfileDir(accountId: string): string {
    const homeDir = os.homedir();
    const profileDir = path.join(homeDir, '.zentri', 'profiles', 'cloakbrowser', accountId);

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    return profileDir;
  }

  /**
   * Launch CloakBrowser with Python
   */
  async launchBrowser(
    accountId: string,
    config: {
      url?: string;
      proxy?: string;
      fingerprint?: any;
      headless?: boolean;
      humanize?: boolean;
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[CloakBrowser] ═══════════════════════════════════════════════════════`);
      console.log(`[CloakBrowser] 🚀 Launch Request for Account: ${accountId}`);
      console.log(`[CloakBrowser] ═══════════════════════════════════════════════════════`);

      // Check if already launched
      if (this.activeBrowsers.has(accountId)) {
        console.log(`[CloakBrowser] ⚠️  Browser already running for ${accountId}`);
        return { success: true };
      }

      const profileDir = this.getCloakProfileDir(accountId);
      console.log(`[CloakBrowser] 📂 Profile Directory: ${profileDir}`);

      // Log configuration details
      console.log(`[CloakBrowser] ⚙️  Configuration:`);
      console.log(`[CloakBrowser]    • URL: ${config.url || 'https://google.com'}`);
      console.log(`[CloakBrowser]    • Headless: ${config.headless ?? false}`);
      console.log(`[CloakBrowser]    • Humanize: ${config.humanize ?? true}`);

      if (config.proxy) {
        console.log(`[CloakBrowser]    • Proxy: ${config.proxy}`);
      } else {
        console.log(`[CloakBrowser]    • Proxy: ❌ NOT PROVIDED`);
      }

      if (config.fingerprint) {
        console.log(`[CloakBrowser]    • Fingerprint: ✅ PROVIDED`);
        console.log(`[CloakBrowser]      - userAgent: ${config.fingerprint.userAgent || 'N/A'}`);
        console.log(`[CloakBrowser]      - platform: ${config.fingerprint.platform || 'N/A'}`);
        console.log(
          `[CloakBrowser]      - languages: ${JSON.stringify(config.fingerprint.languages) || 'N/A'}`,
        );
        console.log(`[CloakBrowser]      - timezone: ${config.fingerprint.timezone || 'N/A'}`);
        console.log(
          `[CloakBrowser]      - webglVendor: ${config.fingerprint.webglVendor || 'N/A'}`,
        );
        console.log(
          `[CloakBrowser]      - webglRenderer: ${config.fingerprint.webglRenderer || 'N/A'}`,
        );
      } else {
        console.log(`[CloakBrowser]    • Fingerprint: ❌ NOT PROVIDED`);
      }

      // Create Python script dynamically
      const scriptPath = path.join(os.tmpdir(), `cloakbrowser_${accountId}.py`);
      console.log(`[CloakBrowser] 📝 Generating Python script: ${scriptPath}`);

      const pythonScript = this.generateLaunchScript(config, profileDir);

      fs.writeFileSync(scriptPath, pythonScript);
      console.log(`[CloakBrowser] ✅ Python script written successfully`);

      // Launch Python process
      console.log(`[CloakBrowser] 🐍 Spawning Python3 process...`);
      const pythonProcess = spawn('python3', [scriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      console.log(`[CloakBrowser] ✅ Python process spawned (PID: ${pythonProcess.pid})`);

      // Store process
      this.activeBrowsers.set(accountId, {
        process: pythonProcess,
        profileDir,
      });

      // Handle process events
      pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`[CloakBrowser:${accountId}] STDOUT: ${output}`);
      });

      pythonProcess.stderr?.on('data', (data) => {
        const error = data.toString().trim();
        console.error(`[CloakBrowser:${accountId}] STDERR: ${error}`);
      });

      pythonProcess.on('error', (err) => {
        console.error(`[CloakBrowser:${accountId}] ❌ Process Error:`, err);
      });

      pythonProcess.on('close', (code) => {
        console.log(`[CloakBrowser:${accountId}] 🛑 Process exited with code ${code}`);
        this.activeBrowsers.delete(accountId);
        // Cleanup temp script
        try {
          fs.unlinkSync(scriptPath);
          console.log(`[CloakBrowser:${accountId}] 🗑️  Cleaned up Python script`);
        } catch (err) {
          console.warn(`[CloakBrowser:${accountId}] ⚠️  Failed to cleanup script:`, err);
        }
      });

      console.log(`[CloakBrowser] ═══════════════════════════════════════════════════════`);
      console.log(`[CloakBrowser] ✅ Launch initiated successfully`);
      console.log(`[CloakBrowser] ═══════════════════════════════════════════════════════`);

      return { success: true };
    } catch (error: any) {
      console.error(`[CloakBrowser] ═══════════════════════════════════════════════════════`);
      console.error(`[CloakBrowser] ❌ LAUNCH FAILED`);
      console.error(`[CloakBrowser] ═══════════════════════════════════════════════════════`);
      console.error('[CloakBrowserLauncher] Error launching:', error);
      console.error('[CloakBrowserLauncher] Stack:', error.stack);
      console.error(`[CloakBrowser] ═══════════════════════════════════════════════════════`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate Python launch script
   */
  private generateLaunchScript(
    config: {
      url?: string;
      proxy?: string;
      fingerprint?: any;
      headless?: boolean;
      humanize?: boolean;
    },
    profileDir: string,
  ): string {
    const url = config.url || 'https://google.com';
    const headless = config.headless ?? false;
    const humanize = config.humanize ?? true;
    const proxy = config.proxy ? `"${config.proxy}"` : 'None';

    // Python boolean values must be capitalized
    const pyHeadless = headless ? 'True' : 'False';
    const pyHumanize = humanize ? 'True' : 'False';

    console.log(`[CloakBrowser] 🔧 Python Script Configuration:`);
    console.log(`[CloakBrowser]    • Profile: ${profileDir}`);
    console.log(`[CloakBrowser]    • URL: ${url}`);
    console.log(`[CloakBrowser]    • Headless: ${pyHeadless}`);
    console.log(`[CloakBrowser]    • Humanize: ${pyHumanize}`);
    console.log(`[CloakBrowser]    • Proxy: ${proxy}`);

    if (config.fingerprint) {
      console.log(
        `[CloakBrowser] ⚠️  WARNING: Fingerprint config received but NOT applied to Python script!`,
      );
      console.log(
        `[CloakBrowser]    CloakBrowser's Python API may not support fingerprint injection.`,
      );
      console.log(
        `[CloakBrowser]    Fingerprint data:`,
        JSON.stringify(config.fingerprint, null, 2),
      );
    }

    return `#!/usr/bin/env python3
"""
CloakBrowser Launch Script
Auto-generated by Zentri
"""

from cloakbrowser import launch_persistent_context
import time

def main():
    print("🚀 Launching CloakBrowser...")
    print(f"📂 Profile: ${profileDir}")
    print(f"🌐 URL: ${url}")
    print(f"🎭 Headless: ${pyHeadless}")
    print(f"🤖 Humanize: ${pyHumanize}")
    print(f"🔌 Proxy: ${proxy}")
    
    # Launch configuration
    ctx = launch_persistent_context(
        "${profileDir}",
        headless=${pyHeadless},
        humanize=${pyHumanize},
        proxy=${proxy},
    )
    
    print("✅ Browser launched successfully!")
    print(f"📂 Profile: ${profileDir}")
    print(f"🌐 Opening: ${url}")
    
    # Open URL
    page = ctx.new_page()
    page.goto("${url}")
    
    print("✅ Page loaded!")
    print("⏳ Browser will stay open. Press Ctrl+C to close.")
    
    # Keep browser open
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\n🛑 Closing browser...")
        ctx.close()
        print("✅ Browser closed!")

if __name__ == "__main__":
    main()
`;
  }

  /**
   * Close browser instance
   */
  async closeBrowser(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[CloakBrowser] 🛑 Close request for: ${accountId}`);

      const browser = this.activeBrowsers.get(accountId);

      if (!browser) {
        console.log(`[CloakBrowser] ⚠️  Browser not found for: ${accountId}`);
        return { success: false, error: 'Browser not found' };
      }

      console.log(`[CloakBrowser] 📤 Sending SIGTERM to process...`);
      // Kill process
      browser.process.kill('SIGTERM');

      // Wait for process to exit
      await new Promise((resolve) => {
        browser.process.on('close', resolve);
        setTimeout(resolve, 5000); // Timeout after 5s
      });

      this.activeBrowsers.delete(accountId);
      console.log(`[CloakBrowser] ✅ Browser closed successfully: ${accountId}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[CloakBrowser] ❌ Error closing browser for ${accountId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if browser is active
   */
  isBrowserActive(accountId: string): boolean {
    const isActive = this.activeBrowsers.has(accountId);
    console.log(
      `[CloakBrowser] Status check for ${accountId}: ${isActive ? '✅ Active' : '❌ Inactive'}`,
    );
    return isActive;
  }

  /**
   * Close all active browsers
   */
  async closeAllBrowsers(): Promise<void> {
    const accountIds = Array.from(this.activeBrowsers.keys());
    console.log(`[CloakBrowser] 🛑 Closing all browsers (${accountIds.length} active)...`);

    for (const accountId of accountIds) {
      await this.closeBrowser(accountId);
    }

    console.log(`[CloakBrowser] ✅ All browsers closed`);
  }
}
