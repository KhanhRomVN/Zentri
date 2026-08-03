import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import { ProxyBridgeService } from '../../../services/ProxyBridgeService';
import { Proxy } from '../../../../renderer/src/types/db';
import * as puppeteer from 'puppeteer-core';
import { dbManager } from '../../database';
import { getExecutablePath, getChromeStablePath } from './utils';
import { buildFingerprintScript } from './fingerprint-injector';

const activeBrowsers = new Map<string, { port: number; process: ReturnType<typeof spawn> }>();

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
        fingerprintConfig,
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
        fingerprintConfig?: object;
        proxyId?: string;
        launchMode?: 'normal' | 'secure';
      },
    ) => {
      try {
        console.log('[BrowserLaunch] Launch request:', JSON.stringify({ provider, accountId, email, fingerprintId, proxyId, launchMode, url }));
        const userDataPath = app.getPath('userData');
        let executablePath = '';

        if (launchMode === 'normal') {
          executablePath = getChromeStablePath();
          if (!executablePath) {
             executablePath = getExecutablePath(browserPath);
          }
        } else {
          executablePath = getExecutablePath(browserPath);
        }

        if (!executablePath) {
          throw new Error('Browser (Chromium/Chrome) not found.');
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
        const isFingerprintChromium = executablePath.toLowerCase().includes('fingerprint-chromium') || executablePath.toLowerCase().includes('ungoogled-chromium');
        console.log('[BrowserLaunch] executablePath:', executablePath, 'isFingerprintChromium:', isFingerprintChromium);
        let proxyBridgePort: number | null = null;

        if (proxyId) {
          const px = await dbManager.get<Proxy>(
            'SELECT protocol, host, port, username, password FROM proxies WHERE id = ?',
            [proxyId],
          );
          if (px) {
            if (px.protocol?.toUpperCase() === 'SOCKS5' || px.protocol?.toUpperCase() === 'SOCKS') {
              try {
                proxyBridgePort = await ProxyBridgeService.startBridge(px);
                proxyServer = 'socks5://127.0.0.1:' + proxyBridgePort;
              } catch (err) {
                console.error('[BrowserLaunch] Failed to start proxy bridge:', err);
                proxyServer = 'socks5://' + px.host + ':' + px.port;
              }
            } else {
              proxyServer = px.protocol + '://' + px.host + ':' + px.port;
              if (px.username && px.password) {
                proxyAuth = { username: px.username, password: px.password };
              }
            }
            console.log('[BrowserLaunch] Using Proxy:', proxyServer);
          }
        }

        const args = [
          '--user-data-dir=' + browserProfileDir,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--ozone-platform=x11',
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

        const extensionPath = path.join(process.cwd(), 'zentri-extension', 'dist');
        if (fs.existsSync(extensionPath)) {
          args.push('--load-extension=' + extensionPath);
          args.push('--disable-extensions-except=' + extensionPath);
        }

        if (proxyServer) {
          args.push('--proxy-server=' + proxyServer);
        }

        const cdpPort = 9222 + Math.floor(Math.random() * 1000);
        args.push('--remote-debugging-port=' + cdpPort);
        args.push('--remote-debugging-address=127.0.0.1');

        if (url) {
          args.push(url);
        } else {
          args.push('chrome://newtab');
        }

        const chromeProcess = spawn(executablePath, args, { detached: true });

        if (accountId) {
          activeBrowsers.set(accountId, { port: cdpPort, process: chromeProcess });
          console.log('[BrowserLaunch] Tracked browser for', accountId, 'on port', cdpPort);
        }

        if (cdpPort) {
          console.log('[BrowserLaunch] Attempting to connect to CDP on port', cdpPort, '...');
          (async () => {
            try {
              for (let i = 0; i < 60; i++) {
                try {
                  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + cdpPort });
                  console.log('[BrowserLaunch] CDP Connected successfully!');

                  let wayfernConfig: any = null;

                  if (fingerprintConfig) {
                    console.log('[CDP] Using fingerprintConfig from frontend');
                    wayfernConfig = { ...fingerprintConfig as any };
                  } else if (fingerprintId) {
                    const fp = await dbManager.get<{ config_json: string }>(
                      'SELECT config_json FROM fingerprints WHERE id = ?',
                      [fingerprintId],
                    );
                    if (fp?.config_json) {
                      wayfernConfig = JSON.parse(fp.config_json);
                    }
                  }

                  if (wayfernConfig) {
                    let languages = wayfernConfig.languages;
                    if (typeof languages === 'string') {
                      try { languages = JSON.parse(languages); } catch (e) { languages = [languages]; }
                    }
                    wayfernConfig = {
                      ...wayfernConfig,
                      userAgent: wayfernConfig.userAgent || wayfernConfig.ua,
                      platformVersion: wayfernConfig.osVersion || wayfernConfig.os_version,
                      os_version: wayfernConfig.os_version || wayfernConfig.osVersion,
                      canvasNoiseSeed: wayfernConfig.canvasNoiseSeed?.toString(),
                      languages: Array.isArray(languages) ? languages : [],
                    };
                  }

                  // Store CDP sessions per target for reuse on navigation
                  const sessionMap = new Map<any, any>();

                  const evaluateScript = async (client: any, label: string) => {
                    if (!wayfernConfig || launchMode === 'normal') return;
                    const script = buildFingerprintScript(wayfernConfig);
                    try {
                      await client.send('Runtime.enable');
                      await client.send('Runtime.evaluate', { expression: script });
                      console.log('[CDP] Fingerprint injected:', label);
                    } catch (e: any) {
                      console.log('[CDP] Inject failed for', label, '-', e?.message?.split('\n')[0]);
                    }
                  };

                  const setupPageTarget = async (target: any, isNew: boolean) => {
                    const targetUrl = target.url();
                    const label = targetUrl || 'empty';

                    try {
                      let client = sessionMap.get(target);
                      if (!client) {
                        client = await target.createCDPSession();
                        sessionMap.set(target, client);
                      }

                      // Setup proxy auth
                      if (proxyAuth && isNew) {
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

                      // Inject script for future navigations (only once per target)
                      if (isNew && wayfernConfig && launchMode !== 'normal') {
                        const script = buildFingerprintScript(wayfernConfig);
                        await client.send('Page.addScriptToEvaluateOnNewDocument', { source: script });
                      }

                      // Run script immediately for current page
                      await evaluateScript(client, label);
                    } catch (err) {
                      console.error('[CDP] Setup error for', label, ':', err);
                    }
                  };

                  // Fire on every new target
                  browser.on('targetcreated', async (target: any) => {
                    if (target.type() === 'page') {
                      await setupPageTarget(target, true);
                    }
                  });

                  // Fire on URL change within same target (navigation)
                  browser.on('targetchanged', async (target: any) => {
                    if (target.type() === 'page') {
                      await setupPageTarget(target, false);
                    }
                  });

                  // Setup existing targets
                  for (const t of browser.targets()) {
                    if (t.type() === 'page') {
                      await setupPageTarget(t, true);
                    }
                  }

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

        if (!_event.sender.isDestroyed() && accountId) _event.sender.send('email:browser-opened', { accountId });

        chromeProcess.on('exit', async () => {
          if (accountId) {
            activeBrowsers.delete(accountId);
            console.log('[BrowserLaunch] Untracked browser for', accountId);
          }
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
              const tempCookieFile = path.join(userDataPath, 'temp_cookies_' + Date.now() + '.db');
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
        console.error('Error opening browser:', error);
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
        spawn(executablePath, ['--user-data-dir=' + realProfileDir, '--no-first-run', 'https://mail.google.com/mail/u/0/h/'], { detached: true });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle('email:is-profile-open', async (_event, accountId: string) => {
    const entry = activeBrowsers.get(accountId);
    if (!entry) return false;

    try {
      const res = await fetch('http://127.0.0.1:' + entry.port + '/json/version', {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return true;
    } catch {
      activeBrowsers.delete(accountId);
      return false;
    }

    activeBrowsers.delete(accountId);
    return false;
  });

  ipcMain.handle('email:close-profile', async (_event, accountId: string) => {
    const entry = activeBrowsers.get(accountId);
    if (!entry) return { success: false, error: 'No active browser found for this account' };

    try {
      entry.process.kill('SIGTERM');
      activeBrowsers.delete(accountId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}