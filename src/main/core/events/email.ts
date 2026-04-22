import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import * as puppeteer from 'puppeteer-core';

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
      }: {
        provider: string;
        accountId: string;
        url?: string;
        profilePath?: string;
        email?: string;
      },
    ) => {
      try {
        const userDataPath = app.getPath('userData');

        // 1. Determine executable path
        let executablePath = '';
        const possiblePaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/snap/bin/chromium',
          '/usr/bin/google-chrome-stable',
        ];

        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            executablePath = p;
            break;
          }
        }

        if (!executablePath) {
          throw new Error('Browser (Chrome/Chromium) not found.');
        }

        // 2. Setup Browser Profile Path
        let browserProfileDir = '';
        if (profilePath) {
          browserProfileDir = profilePath;
        } else {
          try {
            // Get DB path to find profiles dir if we have an email
            const { dbManager } = await import('../database');
            if (dbManager.dbPath && email) {
              const dbDir = path.dirname(dbManager.dbPath);
              browserProfileDir = path.join(dbDir, 'profiles', email);
            } else {
              browserProfileDir = path.join(
                userDataPath,
                'browser_profiles',
                accountId || provider,
              );
            }
          } catch (e) {
            browserProfileDir = path.join(userDataPath, 'browser_profiles', accountId || provider);
          }
        }

        console.log(`[Chrome] Launching with profile: ${browserProfileDir}`);

        if (!fs.existsSync(browserProfileDir)) {
          fs.mkdirSync(browserProfileDir, { recursive: true });
        }

        // 3. Spawn "Clean" Chrome (No automation flags)
        console.log(`Spawning CLEAN Chrome with: ${executablePath}`);

        const args = [
          `--user-data-dir=${browserProfileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--no-sandbox', // Sometimes needed in Linux environments
        ];

        if (url) {
          args.push(url);
        } else {
          args.push('https://accounts.google.com/ServiceLogin');
        }

        const chromeProcess = spawn(executablePath, args, {
          detached: true, // Allow it to live independently if needed
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
      const { dbManager } = await import('../database');
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
      const { dbManager } = await import('../database');
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
      const { dbManager } = await import('../database');
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
        const { dbManager } = await import('../database');
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

  ipcMain.handle('email:get-inbox', async (_event, { email }: { email: string }) => {
    if (activeInboxFetches.has(email)) {
      console.log(`[email:get-inbox] Fetch already in progress for ${email}, skipping...`);
      return { success: false, error: 'FETCH_IN_PROGRESS' };
    }
    activeInboxFetches.add(email);

    let browser;
    try {
      const userDataPath = app.getPath('userData');

      // 1. Determine executable path
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/snap/bin/google-chrome',
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
      if (!executablePath) {
        throw new Error(
          'Chromium/Chrome binary not found. Please install google-chrome-stable or chromium-browser.',
        );
      }

      // 2. Setup Real Profile Path
      const { dbManager } = await import('../database');
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
      if (cookies.length > 0) {
        console.log(
          `[email:get-inbox] Cookie names: ${cookies
            .slice(0, 5)
            .map((c) => c.name)
            .join(', ')}`,
        );
      }

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

      // Wait for at least one message row to appear
      try {
        await page.waitForSelector('tr.zA, table.m tr, div[role="listitem"]', { timeout: 10000 });
        console.log('[email:get-inbox] Confirmed rows found via waitForSelector.');
      } catch (e) {
        console.warn('[email:get-inbox] Wait for rows timed out.');
      }

      // 7. Parse Inbox Table
      const messages: any[] = await page.evaluate(() => {
        // 7.1 Detect and Parse Modern Gmail (Desktop UI) - Refined with user HTML
        const modernRows = Array.from(
          document.querySelectorAll('tr.zA, div[role="main"] tr[role="row"]'),
        );
        if (modernRows.length > 5) {
          return modernRows
            .slice(0, 15)
            .map((row: any) => {
              try {
                // Selectors for Modern Gmail based on user HTML
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

                // 'zE' class = unread in Modern Gmail
                const isUnread =
                  row.classList.contains('zE') || row.innerText.toLowerCase().includes('chưa đọc');

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

        // 7.2 Detect and Parse Gmail Mobile / Basic Touch
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
              const preview = lines.slice(2).join(' ').substring(0, 100);
              const timeMatch = text.match(
                /\d{1,2}:\d{2}\s?(?:AM|PM)?|\d+\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
              );
              const time = timeMatch ? timeMatch[0] : '';
              const isUnread =
                item.style?.fontWeight === 'bold' || item.querySelector('b') !== null;

              return {
                id: Math.random().toString(36).substring(7),
                sender,
                subject,
                preview,
                time,
                isUnread,
              };
            })
            .filter((m) => m !== null);
        }

        // 7.3 Detect and Parse Basic HTML Gmail
        // @ts-ignore
        const selectors = ['table.m tr', 'table[bgcolor="#ffffff"] tr', 'form[name="f"] table tr'];
        let rows: any[] = [];
        for (const selector of selectors) {
          // @ts-ignore
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length > 5) {
            rows = found;
            break;
          }
        }

        return rows
          .map((row: any) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return null;
            const senderCell = cells[1];
            const subjectCell = cells[2];
            if (!senderCell || !subjectCell) return null;
            const sender = senderCell.innerText.trim();
            const subjectLink = subjectCell.querySelector('a');
            if (!subjectLink) return null;
            const subject = subjectLink.innerText.trim();
            const snippet = subjectCell.innerText.replace(subject, '').trim();
            const time = cells[3]?.innerText.trim() || '';
            const isUnread = row.querySelector('b') !== null;
            return {
              id: Math.random().toString(36).substring(7),
              sender,
              subject,
              preview: snippet,
              time,
              isUnread,
            };
          })
          .filter((m) => m !== null)
          .slice(0, 10);
      });

      console.log(`[email:get-inbox] Found ${messages.length} messages for ${email}`);

      // Detect OTPs in results
      const finalMessages = messages.map((m: any) => {
        const otpRegex = /\b\d{4,8}\b|\b[A-Z0-9]{5,8}\b/;
        const match = (m.subject + ' ' + m.preview).match(otpRegex);
        return {
          ...m,
          hasOtp: !!match,
          otpCode: match ? match[0] : undefined,
        };
      });
      console.log(`[email:get-inbox] Final return count: ${finalMessages.length} for ${email}`);

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
  });

  ipcMain.handle('email:get-inbox-cache', async (_event, { email }: { email: string }) => {
    try {
      const { dbManager } = await import('../database');
      const row = await dbManager.get<{ inbox_cache: string }>(
        'SELECT inbox_cache FROM emails WHERE email = ?',
        [email],
      );

      if (row && row.inbox_cache) {
        return { success: true, messages: JSON.parse(row.inbox_cache) };
      }
      return { success: true, messages: [] };
    } catch (e: any) {
      console.error('[email:get-inbox-cache] FAILED:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('email:open-inbox-debug', async (_event, { email }: { email: string }) => {
    let browser;
    try {
      const userDataPath = app.getPath('userData');

      let executablePath = '';
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }

      const { dbManager } = await import('../database');
      let realProfileDir = '';
      if (dbManager.dbPath && email) {
        realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
      } else {
        realProfileDir = path.join(userDataPath, 'browser_profiles', email);
      }

      console.log(
        `[email:open-inbox-debug] Executable: ${executablePath}, Profile: ${realProfileDir}`,
      );
      const { execSync } = await import('child_process');
      try {
        execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {}

      browser = await puppeteer.launch({
        executablePath,
        userDataDir: realProfileDir,
        headless: false, // Visible for debug
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
      await page.goto('https://mail.google.com/mail/u/0/h/', { waitUntil: 'networkidle2' });

      // Keep open for user to inspect
      return { success: true };
    } catch (error: any) {
      console.error('[email:open-inbox-debug] FAILED:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('email:get-fingerprint', async (_event, { email }: { email: string }) => {
    if (activeFingerprintFetches.has(email)) {
      console.log(`[email:get-fingerprint] Fetch already in progress for ${email}, skipping...`);
      return { success: false, error: 'FETCH_IN_PROGRESS' };
    }
    activeFingerprintFetches.add(email);

    let browser;
    try {
      const userDataPath = app.getPath('userData');
      const { dbManager } = await import('../database');
      let realProfileDir = '';
      if (dbManager.dbPath && email) {
        realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
      } else {
        realProfileDir = path.join(userDataPath, 'browser_profiles', email);
      }

      let executablePath = '';
      const possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }

      console.log(
        `[email:get-fingerprint] Executable: ${executablePath}, Profile: ${realProfileDir}`,
      );
      try {
        const { execSync } = await import('child_process');
        execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {}

      // Remove stale lock files
      const stalefiles = [
        path.join(realProfileDir, 'SingletonLock'),
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

      browser = await puppeteer.launch({
        executablePath,
        userDataDir: realProfileDir,
        headless: true,
        dumpio: true, // PIPE BROWSER LOGS TO TERMINAL
        env: { ...process.env },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-vulkan', // EXPLICIT
          '--disable-gpu-rasterization', // EXPLICIT
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

      // 1. Probe BrowserLeaks
      await page.goto('https://browserleaks.com/ip', { waitUntil: 'networkidle2', timeout: 30000 });

      const leaksData = await page.evaluate(() => {
        const results: any = {
          ip: {},
          location: {},
          connectivity: {},
          webrtc: {},
          dns: {},
          fingerprint: {},
          headers: {},
        };

        const tables = Array.from(document.querySelectorAll('table.wb'));

        const getDataFromTable = (table: HTMLTableElement) => {
          const rows = Array.from(table.querySelectorAll('tr'));
          const tableData: any = {};
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const key = cells[0].innerText.trim();
              const value = cells[1].innerText.trim();
              if (key) tableData[key] = value;
            }
          });
          return tableData;
        };

        // Extract using specific IDs first (most reliable)
        const getById = (id: string) => document.getElementById(id)?.innerText.trim() || 'N/A';

        results.ip = {
          address: getById('client-ipv4'),
          hostname: getById('hostname'),
          ipv6: getById('client-ipv6'),
        };

        results.webrtc = {
          local: getById('rtc-local'),
          public: getById('rtc-public'),
        };

        // Map all tables for general info
        const allData: any = {};
        tables.forEach((t) => {
          Object.assign(allData, getDataFromTable(t as HTMLTableElement));
        });

        results.location = {
          country: allData['Country'] || 'N/A',
          region: allData['State/Region'] || 'N/A',
          city: allData['City'] || 'N/A',
          isp: allData['ISP'] || 'N/A',
          organization: allData['Organization'] || 'N/A',
          usageType: allData['Usage Type'] || 'N/A',
          network: allData['Network'] || 'N/A',
        };

        results.connectivity = {
          timezone: allData['Timezone'] || 'N/A',
          localTime: allData['Local Time'] || 'N/A',
          coords: document.getElementById('coords-data')?.getAttribute('data-lat')
            ? {
                lat: document.getElementById('coords-data')?.getAttribute('data-lat'),
                lon: document.getElementById('coords-data')?.getAttribute('data-lon'),
              }
            : null,
        };

        results.fingerprint = {
          tcp: allData['OS'] || 'N/A',
          mtu: allData['MTU'] || 'N/A',
          linkType: allData['Link Type'] || 'N/A',
          ja4: getById('ja4'),
          ja3: getById('ja3-hash'),
          akamai: getById('akamai-hash'),
        };

        // Headers
        const headerRows = Array.from(document.querySelectorAll('#headers tr'));
        headerRows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length === 2) {
            results.headers[cells[0].innerText.trim()] = cells[1].innerText.trim();
          }
        });

        return results;
      });

      // 1.1 Probe WebRTC Detailed
      try {
        await page.goto('https://browserleaks.com/webrtc', {
          waitUntil: 'networkidle2',
          timeout: 15000,
        });

        const webrtcDetails = await page.evaluate(() => {
          const getById = (id: string) => document.getElementById(id)?.innerText.trim() || 'N/A';
          const getValById = (id: string) =>
            (document.getElementById(id) as HTMLTextAreaElement)?.value?.trim() || 'N/A';

          return {
            support: {
              peerConnection: getById('rtc-peerconnection'),
              dataChannel: getById('rtc-datachannel'),
            },
            leak: getById('rtc-leak'),
            publicIp: getById('rtc-public'),
            localIp: getById('rtc-local'),
            sdp: getValById('rtc-sdp'),
            devices: getById('rtc-device-ids'),
          };
        });

        leaksData.webrtc = {
          ...leaksData.webrtc,
          ...webrtcDetails,
        };
      } catch (e) {
        console.warn('[email:get-fingerprint] WebRTC probe failed, skipping detailed report');
      }

      // 1.2 Probe JavaScript Detailed
      try {
        await page.goto('https://browserleaks.com/javascript', {
          waitUntil: 'networkidle2',
          timeout: 15000,
        });

        const jsDetails = await page.evaluate(() => {
          const getById = (id: string) => document.getElementById(id)?.innerText.trim() || 'N/A';

          return {
            screen: {
              resolution: getById('screen-more'),
              width: getById('js-width'),
              height: getById('js-height'),
              availWidth: getById('js-availWidth'),
              availHeight: getById('js-availHeight'),
              colorDepth: getById('js-colorDepth'),
              pixelRatio: getById('js-devicePixelRatio'),
              viewport: `${getById('js-innerWidth')}x${getById('js-innerHeight')}`,
            },
            navigator: {
              platform: getById('js-platform'),
              hardwareConcurrency: getById('js-hardwareConcurrency'),
              deviceMemory: getById('js-deviceMemory'),
              language: getById('js-language'),
              languages: getById('js-languages'),
              webdriver: getById('js-webdriver'),
              pdfViewer: getById('js-pdfViewerEnabled'),
            },
            clientHints: {
              brands: getById('js-uadata-brands'),
              platform: getById('js-uadata-platform'),
              architecture: getById('js-uadata-architecture'),
              bitness: getById('js-uadata-bitness'),
              fullVersion: getById('js-uadata-uaFullVersion'),
            },
            battery: {
              status: getById('js-battery'),
              level: getById('js-level'),
              charging: getById('js-charging'),
            },
            network: {
              type: getById('js-effectiveType'),
              downlink: getById('js-downlink'),
              rtt: getById('js-rtt'),
            },
            plugins: getById('js-plugins'),
          };
        });

        leaksData.fingerprint = {
          ...leaksData.fingerprint,
          ...jsDetails,
        };
      } catch (e) {
        console.warn('[email:get-fingerprint] JS probe failed, skipping detailed report');
      }

      // 2. Probe Local Fingerprint (Hardware)
      await page.goto('about:blank');
      const localFp = await page.evaluate(() => {
        const getCanvasFP = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return 'not supported';
          ctx.textBaseline = 'top';
          ctx.font = "14px 'Arial'";
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('Hello World', 2, 15);
          return canvas.toDataURL();
        };

        const gl = document.createElement('canvas').getContext('webgl');
        const debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';

        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          languages: navigator.languages,
          webdriver: navigator.webdriver,
          hardwareConcurrency: navigator.hardwareConcurrency,
          canvasHash: getCanvasFP().substring(0, 100),
          webglVendor: vendor,
          webglRenderer: renderer,
          screen: `${window.screen.width}x${window.screen.height}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      });

      // 3. Calculate Health Score
      const calculateScore = () => {
        let score = 100;
        const reasons: string[] = [];

        if (leaksData.location.usageType?.toLowerCase().includes('data center')) {
          score -= 40;
          reasons.push('Data Center IP detected');
        }

        if (leaksData.webrtc.local && leaksData.webrtc.local !== 'n/a') {
          score -= 15;
          reasons.push('Internal IP leak (WebRTC)');
        }

        return { val: Math.max(0, score), reasons };
      };

      const health = calculateScore();

      return {
        success: true,
        fingerprint: { ...localFp, ...leaksData.fingerprint },
        geoData: {
          ...leaksData.location,
          query: leaksData.ip.address,
          lat: leaksData.connectivity.coords?.lat,
          lon: leaksData.connectivity.coords?.lon,
          timezone: leaksData.connectivity.timezone,
          localTime: leaksData.connectivity.localTime,
          hostname: leaksData.ip.hostname,
          ipv6: leaksData.ip.ipv6,
        },
        webrtc: leaksData.webrtc,
        headers: leaksData.headers,
        health: health,
        rawLeakData: leaksData, // Keep for debugging if needed
      };
    } catch (e: any) {
      console.error('[email:get-fingerprint] FAILED:', e);
      return { success: false, error: e.message };
    } finally {
      activeFingerprintFetches.delete(email);
      if (browser) await browser.close();
    }
  });

  ipcMain.handle('email:get-sessions', async (_event, { email }: { email: string }) => {
    try {
      const userDataPath = app.getPath('userData');
      const { dbManager } = await import('../database');
      let realProfileDir = '';
      if (dbManager.dbPath && email) {
        realProfileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
      } else {
        realProfileDir = path.join(userDataPath, 'browser_profiles', email);
      }

      const possibleCookiePaths = [
        path.join(realProfileDir, 'Default', 'Network', 'Cookies'),
        path.join(realProfileDir, 'Default', 'Cookies'),
        path.join(realProfileDir, 'Cookies'),
      ];
      const cookiesPath = possibleCookiePaths.find((p) => fs.existsSync(p));

      if (!cookiesPath) {
        console.log(`[email:get-sessions] Cookies file not found for ${email}`);
        return { success: true, sessions: [] };
      }

      console.log(`[email:get-sessions] Found cookies at: ${cookiesPath}`);

      return new Promise((resolve) => {
        const db = new sqlite3.Database(cookiesPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) resolve({ success: false, error: err.message });

          const query = `
            SELECT host_key, count(*) as count, max(expires_utc) as last_expiry 
            FROM cookies 
            GROUP BY host_key 
            ORDER BY count DESC
          `;

          db.all(query, [], (err, rows) => {
            db.close();
            if (err) resolve({ success: false, error: err.message });

            const sessions = rows.map((row: any) => ({
              domain: row.host_key,
              count: row.count,
              expiryDate: new Date((row.last_expiry / 1000000 - 11644473600) * 1000).toISOString(),
            }));

            resolve({ success: true, sessions });
          });
        });
      });
    } catch (e: any) {
      console.error('[email:get-sessions] FAILED:', e);
      return { success: false, error: e.message };
    }
  });
}
