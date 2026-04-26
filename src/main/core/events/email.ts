import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import * as puppeteer from 'puppeteer-core';
import * as os from 'os';
import { dbManager } from '../database';

const POSSIBLE_BROWSER_PATHS = [
  '/usr/bin/donutbrowser',
  '/usr/bin/donut',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/snap/bin/google-chrome',
];

const getDonutCorePath = () => {
  const homeDir = os.homedir();
  const basePath = path.join(homeDir, '.local/share/DonutBrowser/binaries/wayfern');
  if (!fs.existsSync(basePath)) return null;

  try {
    const versions = fs.readdirSync(basePath);
    if (!versions || versions.length === 0) return null;

    // Sort versions descending (simple string sort for now, usually enough for these version strings)
    versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

    const latestVersion = versions[0];
    const executablePath = path.join(basePath, latestVersion, 'chrome');
    if (fs.existsSync(executablePath)) {
      console.log(`[Donut] Found internal core: ${executablePath}`);
      return executablePath;
    }
  } catch (e) {
    console.error('Failed to find Donut Core:', e);
  }
  return null;
};

function getExecutablePath(customPath?: string) {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Primary: Try to find Donut's internal Wayfern core
  const donutCore = getDonutCorePath();
  if (donutCore) return donutCore;

  // Fallback: System paths
  for (const p of POSSIBLE_BROWSER_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

export function setupEmailHandlers() {
  console.log('✅ Setting up Email Handlers...');
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
      }: {
        provider: string;
        accountId: string;
        url?: string;
        profilePath?: string;
        email?: string;
        browserPath?: string;
      },
    ) => {
      try {
        const userDataPath = app.getPath('userData');

        const executablePath = getExecutablePath(browserPath);
        console.log(`[BrowserLaunch] CustomPath: ${browserPath || 'NONE'}`);
        console.log(`[BrowserLaunch] Final Executable: ${executablePath}`);

        if (!executablePath) {
          throw new Error('Browser (Donut/Chromium) not found.');
        }

        // 2. Setup Browser Profile Path
        let browserProfileDir = '';
        if (profilePath) {
          browserProfileDir = profilePath;
        } else {
          try {
            // Get DB path to find profiles dir if we have an email
            if (dbManager.dbPath && email) {
              const dbDir = path.dirname(dbManager.dbPath);
              browserProfileDir = path.join(dbDir, 'profiles', email);
            } else {
              browserProfileDir = path.join(
                userDataPath,
                'browser_profiles',
                email || accountId || provider,
              );
            }
          } catch (e) {
            browserProfileDir = path.join(
              userDataPath,
              'browser_profiles',
              email || accountId || provider,
            );
          }
        }

        if (!fs.existsSync(browserProfileDir)) {
          fs.mkdirSync(browserProfileDir, { recursive: true });
        }

        // 3. Spawn "Clean" Donut Browser (No automation flags)

        const args = [
          `--user-data-dir=${browserProfileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--no-sandbox',
          '--password-store=basic',
          '--ozone-platform=x11',
          '--disable-gpu-vulkan',
          '--disable-gpu',
        ];

        if (url) {
          args.push(url);
        } else {
          args.push('https://accounts.google.com/ServiceLogin');
        }

        const chromeProcess = spawn(executablePath, args, {
          detached: true,
        });

        // Notify Renderer that browser is opened
        if (!_event.sender.isDestroyed()) {
          _event.sender.send('email:browser-opened', { accountId });
        }

        // 4. Handle Exit & Data Extraction
        chromeProcess.on('exit', async () => {
          console.log('Chrome process exited. Extracting stats...');

          // Wait a bit for Chrome to release file locks
          await new Promise((resolve) => setTimeout(resolve, 1000));

          let cookieCount = 0;
          try {
            // Find Cookies file. Paths vary by Chrome version.
            const possibleCookiePaths = [
              path.join(browserProfileDir, 'Default', 'Cookies'),
              path.join(browserProfileDir, 'Default', 'Network', 'Cookies'),
              path.join(browserProfileDir, 'Cookies'),
            ];

            const foundPath = possibleCookiePaths.find((p) => fs.existsSync(p));

            if (foundPath) {
              // Copy to temp file to avoid "Source file is busy" errors
              const tempCookieFile = path.join(userDataPath, `temp_cookies_${Date.now()}.db`);
              fs.copyFileSync(foundPath, tempCookieFile);

              const db = new sqlite3.Database(tempCookieFile);
              cookieCount = await new Promise<number>((resolve) => {
                db.get('SELECT COUNT(*) as count FROM cookies', (err, row: any) => {
                  db.close();
                  if (err) {
                    console.error('SQLite Error:', err);
                    resolve(0);
                  } else {
                    resolve(row?.count || 0);
                  }
                });
              });

              // Cleanup temp file
              fs.unlinkSync(tempCookieFile);
            }
          } catch (e) {
            console.error('Failed to extract cookie stats:', e);
          }

          // Notify Renderer with results
          if (!_event.sender.isDestroyed()) {
            _event.sender.send('email:browser-closed', {
              accountId: accountId,
              stats: {
                cookies: cookieCount,
                localStorage: -1, // We can't easily read LocalStorage via SQLite (it's LevelDB)
                sessionStorage: -1,
              },
            });
          }
        });

        // We don't wait for Chrome to close to return success to the button
        return { success: true };
      } catch (error) {
        console.error('Error opening Real Chrome:', error);
        throw error;
      }
    },
  );
  ipcMain.handle(
    'email:get-profile-cookies',
    async (_event, { profilePath }: { profilePath: string }) => {
      try {
        if (!fs.existsSync(profilePath)) {
          return '';
        }

        const userDataPath = app.getPath('userData');
        const possibleCookiePaths = [
          path.join(profilePath, 'Default', 'Cookies'),
          path.join(profilePath, 'Default', 'Network', 'Cookies'),
          path.join(profilePath, 'Cookies'),
        ];

        const foundPath = possibleCookiePaths.find((p) => fs.existsSync(p));
        if (!foundPath) return '';

        const tempCookieFile = path.join(userDataPath, `read_cookies_${Date.now()}.db`);
        fs.copyFileSync(foundPath, tempCookieFile);

        const db = new sqlite3.Database(tempCookieFile);
        const cookies: any[] = await new Promise((resolve) => {
          db.all(
            'SELECT name, value, host_key FROM cookies WHERE host_key LIKE "%google.com%" OR host_key LIKE "%gmail.com%"',
            (err, rows) => {
              db.close();
              if (err) {
                console.error('SQLite Error:', err);
                resolve([]);
              } else {
                resolve(rows || []);
              }
            },
          );
        });

        fs.unlinkSync(tempCookieFile);

        // Filter and join. Note: value might be empty if encrypted.
        // On Linux, Chromium cookies are encrypted usually.
        // We only join those that have a direct 'value'.
        // For encrypted ones, we would need the system keyring key.
        return cookies
          .filter((c) => c.value && c.value.length > 0)
          .map((c) => `${c.name}=${c.value}`)
          .join('; ');
      } catch (error) {
        console.error('Error reading profile cookies:', error);
        return '';
      }
    },
  );

  ipcMain.handle('email:create-profile', async (_event, { email }: { email: string }) => {
    try {
      const dbDir = path.dirname(dbManager.dbPath);
      const profileDir = path.join(dbDir, 'profiles', email);

      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }
      return { success: true, path: profileDir };
    } catch (error: any) {
      console.error('Error creating profile directory:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('email:get-avatar', async (_event, { email }: { email: string }) => {
    try {
      if (!dbManager.dbPath) return null;

      const dbDir = path.dirname(dbManager.dbPath);
      const avatarPath = path.join(
        dbDir,
        'profiles',
        email,
        'Default',
        'Google Profile Picture.png',
      );

      if (fs.existsSync(avatarPath)) {
        const imageBuffer = fs.readFileSync(avatarPath);
        return `data:image/png;base64,${imageBuffer.toString('base64')}`;
      }
      return null;
    } catch (error) {
      console.error('Error reading avatar:', error);
      return null;
    }
  });

  ipcMain.handle('email:get-services', async (_event, { email }: { email: string }) => {
    try {
      if (!dbManager.dbPath) return [];

      const dbDir = path.dirname(dbManager.dbPath);
      const possiblePaths = [
        path.join(dbDir, 'profiles', email, 'Default', 'Login Data For Account'),
        path.join(dbDir, 'profiles', email, 'Default', 'Login Data'),
      ];

      const loginDataPath = possiblePaths.find((p) => fs.existsSync(p));
      if (!loginDataPath) return [];

      // Copy to temp file
      const userDataPath = app.getPath('userData');
      const tempPath = path.join(userDataPath, `temp_logins_${Date.now()}.db`);
      fs.copyFileSync(loginDataPath, tempPath);

      const db = new sqlite3.Database(tempPath);
      const logins: any[] = await new Promise((resolve) => {
        db.all(
          'SELECT origin_url, action_url, username_value FROM logins WHERE blacklisted_by_user = 0',
          (err, rows) => {
            db.close();
            if (err) resolve([]);
            else resolve(rows || []);
          },
        );
      });

      fs.unlinkSync(tempPath);

      // Unique by origin_url
      const services = logins.map((l) => {
        try {
          return {
            url: l.origin_url,
            name: new URL(l.origin_url).hostname.replace('www.', ''),
            username: l.username_value,
          };
        } catch (e) {
          return {
            url: l.origin_url,
            name: l.origin_url,
            username: l.username_value,
          };
        }
      });

      // Filter uniques
      const uniqueServices = Array.from(new Map(services.map((s) => [s.url, s])).values());
      console.log(`[Email] Extracted ${uniqueServices.length} services for ${email}`);

      return uniqueServices;
    } catch (error) {
      console.error('Error extracting services:', error);
      return [];
    }
  });

  ipcMain.handle(
    'email:add-service-link',
    async (
      _event,
      {
        emailId,
        serviceId,
        username,
        password,
        notes,
        metadata,
      }: {
        emailId: string;
        serviceId: string;
        username?: string;
        password?: string;
        notes?: string;
        metadata?: any;
      },
    ) => {
      try {
        const crypto = await import('crypto');
        const id = crypto.randomUUID();
        const query = `
          INSERT INTO service_emails (id, email_id, service_id, username, password, notes, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          id,
          emailId,
          serviceId,
          username || null,
          password || null,
          notes || null,
          metadata ? JSON.stringify(metadata) : null,
        ];
        await dbManager.run(query, params);
        return { success: true, id };
      } catch (error: any) {
        console.error('Error adding service link:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Global sets to track active fetches and prevent race conditions
  const activeInboxFetches = new Set<string>();
  const activeFingerprintFetches = new Set<string>();

  ipcMain.handle(
    'email:get-inbox',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      if (activeInboxFetches.has(email)) {
        console.log(`[email:get-inbox] Fetch already in progress for ${email}, skipping...`);
        return { success: false, error: 'FETCH_IN_PROGRESS' };
      }
      activeInboxFetches.add(email);

      let browser;
      try {
        const userDataPath = app.getPath('userData');

        const executablePath = getExecutablePath(browserPath);
        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          const dbDir = path.dirname(dbManager.dbPath);
          realProfileDir = path.join(dbDir, 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        console.log(`[email:get-inbox] Executable: ${executablePath}, Profile: ${realProfileDir}`);
        const { execSync } = await import('child_process');
        try {
          execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
          await new Promise((r) => setTimeout(r, 2000));
        } catch (e) {}

        // Remove stale lock files
        const lockFile = path.join(realProfileDir, 'SingletonLock');
        const stalefiles = [
          lockFile,
          path.join(realProfileDir, 'DevToolsActivePort'),
          path.join(realProfileDir, 'SingletonCookie'),
          path.join(realProfileDir, 'SingletonSocket'),
        ];
        stalefiles.forEach((f) => {
          if (fs.existsSync(f)) {
            try {
              fs.unlinkSync(f);
            } catch (e) {}
          }
        });

        // 4. Launch Puppeteer on Real Profile
        browser = await puppeteer.launch({
          executablePath,
          userDataDir: realProfileDir,
          headless: true,
          dumpio: true,
          env: { ...process.env },
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-vulkan',
            '--disable-gpu-rasterization',
            '--disable-software-rasterizer',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-dev-shm-usage',
            '--disable-features=LockProfile',
            '--password-store=gnome-libsecret',
            '--window-size=1280,720',
            '--disable-breakpad',
            '--disable-crash-reporter',
            '--no-zygote',
            '--ozone-platform=x11',
          ],
        });

        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // Verify session data access
        const cookies = await page.cookies();
        console.log(`[email:get-inbox] Profile accessed. Cookies found: ${cookies.length}`);

        // 5. Navigate to Gmail
        console.log(`[email:get-inbox] Fetching inbox for ${email}...`);
        await page.goto('https://mail.google.com/mail/u/0/h/', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // 6. Check for Login Redirection
        const currentUrl = page.url();
        const pageTitle = await page.title();
        console.log(`[email:get-inbox] Current URL: ${currentUrl}, Title: ${pageTitle}`);

        if (
          currentUrl.includes('accounts.google.com') ||
          pageTitle.includes('Sign in') ||
          pageTitle.includes('Đăng nhập')
        ) {
          console.warn(
            `[email:get-inbox] Session invalid for ${email}. Please login via Open Browser.`,
          );
          return { success: false, error: 'NOT_LOGGED_IN' };
        }

        await new Promise((r) => setTimeout(r, 2000));

        // 7. Parse Inbox Table
        const messages: any[] = await page.evaluate(() => {
          const modernRows = Array.from(
            // @ts-ignore
            document.querySelectorAll('tr.zA, div[role="main"] tr[role="row"]'),
          );
          if (modernRows.length > 5) {
            return modernRows
              .slice(0, 15)
              .map((row: any) => {
                try {
                  const senderSpan = row.querySelector('.zF, .bA4, .vY');
                  const subjectSpan = row.querySelector('.bog');
                  const snippetSpan = row.querySelector('.y2');
                  const timeSpan = row.querySelector('.xW, .bq3');

                  if (!subjectSpan) return null;

                  const sender = senderSpan ? senderSpan.innerText.trim() : 'Unknown';
                  const subject = subjectSpan.innerText.trim();
                  const preview = snippetSpan
                    ? snippetSpan.innerText.trim().replace(/^[\s\u00a0-]+/, '')
                    : '';
                  const time = timeSpan ? timeSpan.innerText.trim() : '';
                  const isUnread = row.classList.contains('zE');

                  return {
                    id: Math.random().toString(36).substring(7),
                    sender,
                    subject,
                    preview,
                    time,
                    isUnread,
                  };
                } catch (e) {
                  return null;
                }
              })
              .filter((m: any) => m !== null);
          }

          // 7.2 Mobile UI
          // @ts-ignore
          const mobileItems = Array.from(document.querySelectorAll('div[role="listitem"], .v'));
          if (mobileItems.length > 5) {
            return mobileItems
              .slice(0, 15)
              .map((item: any) => {
                const text = item.innerText || '';
                const lines = text
                  .split('\n')
                  .map((l: string) => l.trim())
                  .filter((l: string) => l.length > 0);
                if (lines.length < 2) return null;
                const sender = lines[0] || 'Unknown';
                const subject = lines[1] || 'No Subject';
                const isUnread = item.querySelector('b') !== null;
                return {
                  id: Math.random().toString(36).substring(7),
                  sender,
                  subject,
                  preview: lines.slice(2).join(' ').substring(0, 100),
                  time: '',
                  isUnread,
                };
              })
              .filter((m) => m !== null);
          }

          // 7.3 Basic HTML
          const rows = Array.from(
            // @ts-ignore
            document.querySelectorAll('table.m tr, table[bgcolor="#ffffff"] tr'),
          );
          return rows
            .map((row: any) => {
              const cells = row.querySelectorAll('td');
              if (cells.length < 3) return null;
              const sender = cells[1]?.innerText.trim();
              const subject = cells[2]?.innerText.trim();
              return {
                id: Math.random().toString(36).substring(7),
                sender: sender || 'Unknown',
                subject: subject || 'No Subject',
                preview: '',
                time: cells[3]?.innerText.trim() || '',
                isUnread: row.querySelector('b') !== null,
              };
            })
            .filter((m) => m !== null)
            .slice(0, 10);
        });

        console.log(`[email:get-inbox] Found ${messages.length} messages for ${email}`);

        // Detect OTPs
        const finalMessages = messages.map((m: any) => {
          const otpRegex = /\b\d{4,8}\b|\b[A-Z0-9]{5,8}\b/;
          const match = (m.subject + ' ' + m.preview).match(otpRegex);
          return {
            ...m,
            hasOtp: !!match,
            otpCode: match ? match[0] : undefined,
          };
        });

        // Save to cache
        await dbManager.run(
          'UPDATE emails SET inbox_cache = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
          [JSON.stringify(finalMessages), email],
        );

        return { success: true, messages: finalMessages };
      } catch (error: any) {
        console.error('[email:get-inbox] FAILED:', error);
        return { success: false, error: error.message };
      } finally {
        activeInboxFetches.delete(email);
        if (browser) await browser.close();
      }
    },
  );

  ipcMain.handle('email:get-inbox-cache', async (_event, { email }: { email: string }) => {
    try {
      const row = await dbManager.get<{ inbox_cache: string }>(
        'SELECT inbox_cache FROM emails WHERE email = ?',
        [email],
      );
      if (row && row.inbox_cache) {
        return { success: true, messages: JSON.parse(row.inbox_cache) };
      }
      return { success: true, messages: [] };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle(
    'email:open-inbox-debug',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      try {
        const userDataPath = app.getPath('userData');
        const executablePath = getExecutablePath(browserPath);
        console.log(`[InboxDebug] CustomPath: ${browserPath || 'NONE'}`);
        console.log(`[InboxDebug] Final Executable: ${executablePath}`);

        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        await spawn(
          executablePath,
          [
            `--user-data-dir=${realProfileDir}`,
            '--no-first-run',
            'https://mail.google.com/mail/u/0/h/',
          ],
          { detached: true },
        );

        return { success: true };
      } catch (error: any) {
        console.error('[email:open-inbox-debug] FAILED:', error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'email:get-fingerprint',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      if (activeFingerprintFetches.has(email))
        return { success: false, error: 'FETCH_IN_PROGRESS' };
      activeFingerprintFetches.add(email);
      let browser;
      try {
        const userDataPath = app.getPath('userData');

        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        const executablePath = getExecutablePath(browserPath);
        console.log(`[GetFingerprint] CustomPath: ${browserPath || 'NONE'}`);
        console.log(`[GetFingerprint] Final Executable: ${executablePath}`);
        browser = await puppeteer.launch({
          executablePath,
          userDataDir: realProfileDir,
          headless: true,
          args: ['--no-sandbox', '--disable-gpu', '--ozone-platform=x11'],
        });

        const page = await browser.newPage();

        // 1. IP & GeoData
        await page.goto('https://browserleaks.com/ip', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        const ipData = await page.evaluate(() => {
          const data: any = {};
          const documentAny = (globalThis as any).document;
          documentAny.querySelectorAll('table.wb tr').forEach((row: any) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) data[cells[0].innerText.trim()] = cells[1].innerText.trim();
          });
          return {
            ip: documentAny.getElementById('client-ipv4')?.innerText.trim() || 'N/A',
            city: data['City'] || 'N/A',
            country: data['Country'] || 'N/A',
            isp: data['ISP'] || 'N/A',
            usageType: data['Usage Type'] || 'Residential',
            os: data['OS'] || 'N/A',
          };
        });

        // 2. WebRTC
        await page.goto('https://browserleaks.com/webrtc', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        const webrtcData = await page.evaluate(() => {
          const data: any = {};
          const documentAny = (globalThis as any).document;
          documentAny.querySelectorAll('table.wb tr').forEach((row: any) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) data[cells[0].innerText.trim()] = cells[1].innerText.trim();
          });
          return {
            public: documentAny.getElementById('webrtc-ipv4')?.innerText.trim() || 'No Leak',
            local: data['Local IP Address'] || 'N/A',
            leak: data['WebRTC Leak Test'] || 'Secure',
          };
        });

        // 3. Health Score Logic
        let score = 100;
        const reasons: string[] = [];

        if (webrtcData.public !== 'No Leak' && webrtcData.public !== ipData.ip) {
          score -= 20;
          reasons.push('WebRTC IP Leak detected');
        }
        if (ipData.usageType.toLowerCase().includes('data center')) {
          score -= 15;
          reasons.push('Data Center IP detected');
        }

        return {
          success: true,
          geoData: {
            query: ipData.ip,
            city: ipData.city,
            country: ipData.country,
            usageType: ipData.usageType,
            isp: ipData.isp,
          },
          fingerprint: {
            os: ipData.os,
          },
          webrtc: webrtcData,
          health: {
            val: score,
            reasons,
          },
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      } finally {
        activeFingerprintFetches.delete(email);
        if (browser) await browser.close();
      }
    },
  );

  ipcMain.handle(
    'email:get-sessions',
    async (_event, { email, browserPath }: { email: string; browserPath?: string }) => {
      try {
        const userDataPath = app.getPath('userData');

        let realProfileDir = '';
        if (dbManager.dbPath && email) {
          realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        } else {
          realProfileDir = path.join(userDataPath, 'browser_profiles', email);
        }

        const candidates = [
          path.join(realProfileDir, 'Default', 'Network', 'Cookies'),
          path.join(realProfileDir, 'Default', 'Cookies'),
          path.join(realProfileDir, 'Network', 'Cookies'),
          path.join(realProfileDir, 'Cookies'),
        ];

        let cookiesPath = '';
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            cookiesPath = p;
            break;
          }
        }

        console.log(`[Sessions] Profile: ${realProfileDir}`);
        console.log(`[Sessions] Found Cookies at: ${cookiesPath || 'NONE'}`);

        if (!cookiesPath) {
          return { success: true, sessions: [] };
        }

        const tempPath = path.join(userDataPath, `temp_sess_${Date.now()}.db`);
        try {
          fs.copyFileSync(cookiesPath, tempPath);
        } catch (copyErr: any) {
          console.error(`[Sessions] Copy failed: ${copyErr.message}`);
          return { success: false, error: `Failed to copy cookies: ${copyErr.message}` };
        }

        const db = new sqlite3.Database(tempPath);
        const rows: any[] = await new Promise((resolve, reject) => {
          db.all(
            'SELECT host_key, count(*) as count, max(expires_utc) as exp FROM cookies GROUP BY host_key',
            (err, rows) => {
              db.close();
              if (err) {
                console.error(`[Sessions] DB Query error: ${err.message}`);
                reject(err);
              } else {
                resolve(rows || []);
              }
            },
          );
        });

        try {
          fs.unlinkSync(tempPath);
        } catch (unlinkErr) {
          console.warn(`[Sessions] Failed to delete temp DB: ${unlinkErr}`);
        }

        console.log(`[Sessions] Successfully fetched ${rows.length} domain groups.`);

        return {
          success: true,
          sessions: rows.map((r) => ({
            domain: r.host_key,
            count: r.count,
            expiryDate: new Date((r.exp / 1000000 - 11644473600) * 1000).toISOString(),
          })),
        };
      } catch (e: any) {
        console.error(`[Sessions] FATAL ERROR: ${e.message}`);
        return { success: false, error: e.message };
      }
    },
  );

  ipcMain.handle(
    'email:get-history',
    async (_event, { email, date }: { email: string; date?: string }) => {
      try {
        const dbDir = path.dirname(dbManager.dbPath);
        const userDataPath = app.getPath('userData');
        const profileDir = path.join(dbDir, 'profiles', email);
        const historyPath = path.join(profileDir, 'Default', 'History');

        if (!fs.existsSync(historyPath))
          return { success: true, history: [], stats: { topWebsites: [], intervals: [] } };

        const tempPath = path.join(userDataPath, `temp_hist_${Date.now()}.db`);
        fs.copyFileSync(historyPath, tempPath);
        const db = new sqlite3.Database(tempPath);

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const startTime = (targetDate.getTime() + 11644473600000) * 1000;
        const endTime = startTime + 24 * 60 * 60 * 1000 * 1000;

        const query = `
          SELECT urls.url, urls.title, visits.visit_time, visits.visit_duration
          FROM visits JOIN urls ON visits.url = urls.id 
          WHERE visits.visit_time >= ? AND visits.visit_time < ? 
          ORDER BY visits.visit_time ASC
        `;

        const rows: any[] = await new Promise((resolve) => {
          db.all(query, [startTime, endTime], (_err, rows) => {
            db.close();
            resolve(rows || []);
          });
        });
        fs.unlinkSync(tempPath);

        const history = rows.map((r) => ({
          url: r.url,
          title: r.title,
          time: Math.floor(r.visit_time / 1000 - 11644473600000),
        }));

        const domainCounts: Record<string, { count: number; duration: number; iconUrl: string }> =
          {};
        history.forEach((h, index) => {
          try {
            const urlObj = new URL(h.url);
            const d = urlObj.hostname.replace('www.', '');
            if (!domainCounts[d]) {
              domainCounts[d] = { count: 0, duration: 0, iconUrl: h.url };
            }
            domainCounts[d].count++;
            // visit_duration is in microseconds in Chrome
            const duration = rows[index].visit_duration || 0;
            domainCounts[d].duration += Math.floor(duration / 1000000); // convert to seconds
          } catch {}
        });

        const topWebsites = Object.entries(domainCounts)
          .map(([domain, data]) => ({
            domain,
            count: data.count,
            duration: data.duration,
            url: data.iconUrl,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // 4. Calculate Hourly Intervals
        const intervals = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
        history.forEach((h) => {
          const hour = new Date(h.time).getHours();
          if (hour >= 0 && hour < 24) {
            intervals[hour].count++;
          }
        });

        return {
          success: true,
          history: history.reverse(),
          stats: { topWebsites, intervals, totalVisits: history.length },
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  );

  ipcMain.handle(
    'email:get-history-dates',
    async (_event, { email, month, year }: { email: string; month: number; year: number }) => {
      try {
        const profileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
        const historyPath = path.join(profileDir, 'Default', 'History');
        if (!fs.existsSync(historyPath)) return { success: true, activity: {} };

        const tempPath = path.join(app.getPath('userData'), `temp_hdates_${Date.now()}.db`);
        fs.copyFileSync(historyPath, tempPath);
        const db = new sqlite3.Database(tempPath);

        const start = new Date(year, month, 1).getTime();
        const end = new Date(year, month + 1, 1).getTime();
        const startTime = (start + 11644473600000) * 1000;
        const endTime = (end + 11644473600000) * 1000;

        const query = `
          SELECT 
            CAST(((visit_time/1000000)-11644473600)/86400 AS INTEGER)*86400 as day,
            urls.url
          FROM visits
          JOIN urls ON visits.url = urls.id
          WHERE visit_time >= ? AND visit_time < ?
        `;

        const rows: any[] = await new Promise((resolve) => {
          db.all(query, [startTime, endTime], (_err, rows) => {
            db.close();
            resolve(rows || []);
          });
        });
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (e) {}

        const activity: Record<string, { domainCount: number }> = {};
        rows.forEach((row) => {
          const dateStr = new Date(row.day * 1000).toISOString().split('T')[0];
          if (!activity[dateStr]) {
            activity[dateStr] = { domains: new Set<string>() } as any;
          }
          try {
            const hostname = new URL(row.url).hostname.replace('www.', '');
            // Simple sub-domain stripping (one level)
            const parts = hostname.split('.');
            const domain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
            (activity[dateStr] as any).domains.add(domain);
          } catch (e) {}
        });

        const finalActivity: Record<string, { domainCount: number }> = {};
        Object.entries(activity).forEach(([date, data]: [string, any]) => {
          finalActivity[date] = { domainCount: data.domains.size };
        });

        return { success: true, activity: finalActivity };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  );
}
