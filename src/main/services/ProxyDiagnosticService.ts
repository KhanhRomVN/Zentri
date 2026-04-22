import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DiagnosticResult {
  success: boolean;
  ip?: string;
  country?: string;
  isp?: string;
  isBlacklisted?: boolean;
  isProxyDetected?: boolean;
  webrtcLeak?: boolean;
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

  static async checkProxy(proxyData: any): Promise<DiagnosticResult> {
    const { host, port, username, password, protocol } = proxyData;
    const proxyServer = `${protocol}://${host}:${port}`;

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

      const result: DiagnosticResult = { success: true };

      // Step 1: Check myip.ms
      try {
        await page.goto('https://myip.ms', { waitUntil: 'networkidle2', timeout: 30000 });
        const content = await page.content();

        // Extract IP
        const ipMatch = content.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
        if (ipMatch) result.ip = ipMatch[0];

        // Check Blacklist
        result.isBlacklisted =
          content.includes('Listed in Blacklist') && !content.includes('Not Listed in Blacklist');

        // Check Proxy Detection
        result.isProxyDetected = !content.includes('No Proxy Detected');

        // Extract ISP/Org
        const ispMatch = content.match(/Your Organisation\/ISP.*?<b>(.*?)<\/b>/s);
        if (ispMatch) result.isp = ispMatch[1].replace(/<.*?>/g, '');
      } catch (err) {
        console.error('Diagnostic Stage 1 (myip.ms) failed:', err);
      }

      // Step 2: Check BrowserLeaks WebRTC
      try {
        await page.goto('https://browserleaks.com/webrtc', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        const content = await page.content();

        // Check WebRTC Leak
        result.webrtcLeak = content.includes('Leak Detected') || !content.includes('No Leak');

        // Extract Country from WebRTC page (it usually shows flag/text)
        const countryMatch = content.match(/title=".*?\((.*?)\)"/); // e.g. title="Vietnam (VN)"
        if (countryMatch) result.country = countryMatch[1];

        // Fallback country detection
        if (!result.country) {
          const altCountryMatch = content.match(/alt="(.*?)"/);
          if (altCountryMatch) result.country = altCountryMatch[1];
        }
      } catch (err) {
        console.error('Diagnostic Stage 2 (browserleaks) failed:', err);
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }
}
