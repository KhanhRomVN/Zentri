import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as net from 'net';

export interface DiagnosticIPInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  as: string;
}

export interface DiagnosticResult {
  success: boolean;
  proxy?: DiagnosticIPInfo;
  direct?: DiagnosticIPInfo;
  isBlacklisted?: boolean;
  isProxyDetected?: boolean;
  webrtcLeak?: boolean;
  latency?: number;
  error?: string;
}

export class ProxyDiagnosticService {
  private static getChromePath(): string {
    const commonPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }

    try {
      if (process.platform === 'linux') {
        return execSync('which google-chrome').toString().trim();
      }
    } catch (e) {}

    throw new Error('Chrome/Chromium executable not found. Please install Google Chrome.');
  }

  private static async getFullIPInfo(proxyData?: any): Promise<DiagnosticIPInfo | null> {
    try {
      let curlCmd = '';
      if (proxyData) {
        const { host, port, username, password } = proxyData;
        curlCmd = `curl --silent -m 15 --socks5-hostname "${username}:${password}@${host}:${port}" "http://ip-api.com/json"`;
      } else {
        curlCmd = `curl --silent -m 10 "http://ip-api.com/json"`;
      }

      const result = execSync(curlCmd).toString();
      const data = JSON.parse(result);

      if (data.status === 'success') {
        return {
          ip: data.query,
          country: data.country,
          region: data.regionName,
          city: data.city,
          isp: data.isp,
          org: data.org,
          as: data.as,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private static async checkTcp(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket
        .connect(port, host, () => {
          socket.destroy();
          resolve(true);
        })
        .on('error', () => {
          socket.destroy();
          resolve(false);
        })
        .on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
    });
  }

  static async checkProxy(proxyData: any): Promise<DiagnosticResult> {
    const { host, port, username, password, protocol } = proxyData;

    // Step 0: Symmetric IP discovery
    const directInfoPromise = this.getFullIPInfo();

    // Step 0.1: Check TCP connectivity
    const isReachable = await this.checkTcp(host, port);
    if (!isReachable) {
      return {
        success: false,
        error: `Proxy server unreachable at ${host}:${port}`,
        direct: (await directInfoPromise) || undefined,
      };
    }

    // Standard protocol prefix (Chromium CLI supports socks5://, but not socks5h://)
    const proxyServer = `${protocol}://${host}:${port}`;

    console.log(`[Diagnostic] Testing proxy: ${proxyServer} (Auth: ${!!username})`);

    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: this.getChromePath(),
        headless: true,
        args: [
          `--proxy-server=${proxyServer}`,
          '--ignore-certificate-errors',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--proxy-bypass-list=<-loopback>', // Force all traffic through proxy
        ],
      });

      const page = await browser.newPage();

      // Handle authentication if provided
      if (username && password) {
        await page.authenticate({ username, password });
      }

      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      );

      const result: DiagnosticResult = {
        success: true,
        direct: (await directInfoPromise) || undefined,
      };

      // Step 1: Check IP and basic info using curl (most reliable for SOCKS5)
      try {
        const stageStart = Date.now();
        console.log(`[Diagnostic] Executing curl for Stage 1...`);

        const proxyInfo = await this.getFullIPInfo(proxyData);
        result.latency = Date.now() - stageStart;

        if (proxyInfo) {
          result.proxy = proxyInfo;
          result.success = true;
        } else {
          throw new Error('Proxy returned invalid IP metadata');
        }
      } catch (err: any) {
        console.error('Diagnostic Stage 1 (curl) failed:', err.message);
        result.success = false;
        result.error = `Proxy Error: ${err.message}`;
        return result;
      }

      // Step 2: Anonymity and WebRTC (Best effort via browser)
      try {
        console.log(`[Diagnostic] Attempting Browser Stage for WebRTC/Anonymity...`);
        browser = await puppeteer.launch({
          executablePath: this.getChromePath(),
          headless: true,
          args: [
            `--proxy-server=${proxyServer}`,
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--proxy-bypass-list=<-loopback>',
          ],
        });

        const page = await browser.newPage();
        if (username && password) {
          await page.authenticate({ username, password });
        }

        await page.goto('https://browserleaks.com/webrtc', {
          waitUntil: 'networkidle2',
          timeout: 20000,
        });
        const content = await page.content();
        result.webrtcLeak = content.includes('Leak Detected') || !content.includes('No Leak');
        result.isProxyDetected = !content.includes('No Proxy Detected');
      } catch (err) {
        console.log(
          '[Diagnostic] Browser Stage failed (expected for some SOCKS5 proxies), using curl-only result.',
        );
        // Don't fail the whole diagnostic if only the browser stage fails
      }

      return result;
    } catch (error: any) {
      console.error('Diagnostic Critical error:', error);
      return {
        success: false,
        error: error.message,
        direct: (await directInfoPromise) || undefined,
      };
    } finally {
      if (browser) await browser.close();
    }
  }
}
