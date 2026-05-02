import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import { ProxyBridgeService } from '../../../services/ProxyBridgeService';
import { Proxy } from '../../../../shared/types';
import * as puppeteer from 'puppeteer-core';
import { dbManager } from '../../database';
import { getExecutablePath, getChromeStablePath } from './utils';

export function setupLaunchHandlers() {
  ipcMain.handle(
    'email:open-login',
    async (
      _event,
      {
        provider,
        accountId,
        url,
        profilePath,
        email,
        browserPath,
        fingerprintId,
        proxyId,
        launchMode,
      }: {
        provider: string;
        accountId: string;
        url?: string;
        profilePath?: string;
        email?: string;
        browserPath?: string;
        fingerprintId?: string;
        proxyId?: string;
        launchMode?: 'normal' | 'secure';
      },
    ) => {
      try {
        const userDataPath = app.getPath('userData');
        let executablePath = '';

        if (launchMode === 'normal') {
          executablePath = getChromeStablePath();
          if (!executablePath) {
             // Fallback to default if chrome stable not found
             executablePath = getExecutablePath(browserPath);
          }
        } else {
          executablePath = getExecutablePath(browserPath);
        }

        if (!executablePath) {
          throw new Error('Browser (Donut/Chrome/Chromium) not found.');
        }

        let browserProfileDir = '';
        if (profilePath) {
          browserProfileDir = profilePath;
        } else {
          try {
            if (dbManager.dbPath && email) {
              browserProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
            } else {
              browserProfileDir = path.join(userDataPath, 'browser_profiles', email || accountId || provider);
            }
          } catch (e) {
            browserProfileDir = path.join(userDataPath, 'browser_profiles', email || accountId || provider);
          }
        }

        if (!fs.existsSync(browserProfileDir)) {
          fs.mkdirSync(browserProfileDir, { recursive: true });
        }

        let proxyServer = '';
        let proxyAuth: { username?: string; password?: string } | null = null;
        let isWayfern = executablePath.toLowerCase().includes('wayfern');
        let proxyBridgePort: number | null = null;

        if (proxyId) {
          const px = await dbManager.get<Proxy>(
            'SELECT protocol, host, port, username, password FROM proxies WHERE id = ?',
            [proxyId],
          );
          if (px) {
            if (px.protocol?.toUpperCase() === 'SOCKS5' || px.protocol?.toUpperCase() === 'SOCKS') {
              // Start a local bridge for SOCKS5 proxies to ensure compatibility and speed
              try {
                proxyBridgePort = await ProxyBridgeService.startBridge(px);
                proxyServer = `socks5://127.0.0.1:${proxyBridgePort}`;
              } catch (err) {
                console.error('[BrowserLaunch] Failed to start proxy bridge:', err);
                // Fallback to direct connection (might fail auth)
                proxyServer = `socks5://${px.host}:${px.port}`;
              }
            } else {
              // For HTTP/HTTPS, direct is usually fine, or we could bridge them too
              proxyServer = `${px.protocol}://${px.host}:${px.port}`;
              if (px.username && px.password) {
                proxyAuth = { username: px.username, password: px.password };
              }
            }
            console.log(`[BrowserLaunch] Using Proxy: ${proxyServer} (Bridge: ${!!proxyBridgePort}, Auth: ${!!proxyAuth})`);
          }
        }

        const extensionPath = path.join(process.cwd(), 'zentri-extension', 'dist');

        const args = [
          `--user-data-dir=${browserProfileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          `--load-extension=${extensionPath}`,
          `--disable-extensions-except=${extensionPath}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--disable-notifications',
          '--disable-quic',
          '--disable-features=DialMediaRouteProvider,DnsOverHttps,AsyncDns',
          '--dns-prefetch-disable',
          '--enable-features=NetworkServiceInProcess',
          '--proxy-bypass-list=<-loopback>',
          '--password-store=basic',
          '--use-mock-keychain',
        ];

        if (proxyServer) {
          args.push(`--proxy-server=${proxyServer}`);
        }

        // Always enable CDP port to manage fingerprinting and proxy auth
        const cdpPort = 9222 + Math.floor(Math.random() * 1000);
        args.push(`--remote-debugging-port=${cdpPort}`);
        args.push('--remote-debugging-address=127.0.0.1');

        // Add diagnostic tabs to open on startup
        if (launchMode !== 'normal') {
          args.push('https://pixelscan.net/fingerprint-check#what_website_see');
          args.push('https://pixelscan.net/ip');
          args.push('https://pixelscan.net/vpn-check');
          args.push('https://pixelscan.net/ip-blacklist-check');
          args.push('https://pixelscan.net/bot-check');
          args.push('https://pixelscan.net/dns-check');
          args.push('https://pixelscan.net/webrtc-check');
        } else {
          args.push('chrome://newtab');
        }

        const chromeProcess = spawn(executablePath, args, { detached: true });

        if (cdpPort) {
          console.log(`[BrowserLaunch] Attempting to connect to CDP on port ${cdpPort}...`);
          (async () => {
            try {
              let connected = false;
              for (let i = 0; i < 60; i++) {
                try {
                  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${cdpPort}` });
                  connected = true;
                  console.log('[BrowserLaunch] CDP Connected successfully!');

                  let wayfernConfig: any = null;
                  if (fingerprintId) {
                    const fp = await dbManager.get<{ config_json: string }>('SELECT config_json FROM fingerprints WHERE id = ?', [fingerprintId]);
                    if (fp?.config_json) {
                      const zentriConfig = JSON.parse(fp.config_json);
                      let languages = zentriConfig.languages;
                      if (typeof languages === 'string') {
                        try { languages = JSON.parse(languages); } catch (e) { languages = [languages]; }
                      }
                      wayfernConfig = {
                        ...zentriConfig,
                        userAgent: zentriConfig.userAgent || zentriConfig.ua,
                        platformVersion: zentriConfig.osVersion || zentriConfig.os_version,
                        os_version: zentriConfig.os_version || zentriConfig.osVersion,
                        canvasNoiseSeed: zentriConfig.canvasNoiseSeed?.toString(),
                        languages: Array.isArray(languages) ? languages : [],
                      };
                      if (isWayfern) {
                        ['fonts', 'plugins', 'mimeTypes', 'voices', 'webglParameters', 'webgl2Parameters', 'mediaDevices', 'screen', 'navigator'].forEach(field => {
                          if (wayfernConfig[field] && typeof wayfernConfig[field] === 'object') wayfernConfig[field] = JSON.stringify(wayfernConfig[field]);
                        });
                      }
                    }
                  }

                  const setupSession = async (target: any) => {
                    try {
                      const client = await target.createCDPSession();

                      if (proxyAuth) {
                        await client.send('Fetch.enable', { handleAuthRequests: true });
                        client.on('Fetch.authRequired', async (event: any) => {
                          try {
                            await client.send('Fetch.continueWithAuth', {
                              requestId: event.requestId,
                              authChallengeResponse: { 
                                response: 'ProvideCredentials', 
                                username: proxyAuth!.username!, 
                                password: proxyAuth!.password! 
                              }
                            });
                          } catch (err) {
                            console.error('[CDP] Proxy Auth Error:', err);
                          }
                        });
                      }

                      if (wayfernConfig && launchMode !== 'normal') {
                        await client.send('Wayfern.setFingerprint', wayfernConfig).catch((err: { message: any; }) => {
                           console.warn('[CDP] Wayfern.setFingerprint failed (Normal Chrome?):', err.message);
                        });
                      }
                    } catch (err) {
                      console.error('[BrowserLaunch] CDP Error in setupSession:', err);
                    }
                  };

                  // Initial setup for all current targets
                  const currentTargets = browser.targets();
                  for (const t of currentTargets) {
                    await setupSession(t);
                  }

                  // Listen for future targets
                  browser.on('targetcreated', setupSession);
                  break;
                } catch (e) {
                  await new Promise((r) => setTimeout(r, 500));
                }
              }
            } catch (err) {
              console.error('[BrowserLaunch] CDP Connection loop failed:', err);
            }
          })();
        }

        if (!_event.sender.isDestroyed()) _event.sender.send('email:browser-opened', { accountId });

        chromeProcess.on('exit', async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          let cookieCount = 0;
          try {
            const possibleCookiePaths = [
              path.join(browserProfileDir, 'Default', 'Cookies'),
              path.join(browserProfileDir, 'Default', 'Network', 'Cookies'),
              path.join(browserProfileDir, 'Cookies'),
            ];
            const foundPath = possibleCookiePaths.find((p) => fs.existsSync(p));
            if (foundPath) {
              const tempCookieFile = path.join(userDataPath, `temp_cookies_${Date.now()}.db`);
              fs.copyFileSync(foundPath, tempCookieFile);
              const db = new sqlite3.Database(tempCookieFile);
              cookieCount = await new Promise<number>((resolve) => {
                db.get('SELECT COUNT(*) as count FROM cookies', (err, row: any) => {
                  db.close();
                  resolve(err ? 0 : row?.count || 0);
                });
              });
              fs.unlinkSync(tempCookieFile);
            }
          } catch (e) {}

          if (!_event.sender.isDestroyed()) {
            _event.sender.send('email:browser-closed', { accountId, stats: { cookies: cookieCount, localStorage: -1, sessionStorage: -1 } });
          }
        });

        return { success: true };
      } catch (error) {
        console.error('Error opening Real Chrome:', error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    'email:open-inbox-debug',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      try {
        const userDataPath = app.getPath('userData');
        const executablePath = getExecutablePath(browserPath);
        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }
        spawn(executablePath, [`--user-data-dir=${realProfileDir}`, '--no-first-run', 'https://mail.google.com/mail/u/0/h/'], { detached: true });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );
}
