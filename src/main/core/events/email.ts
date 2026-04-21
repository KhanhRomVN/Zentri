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

  // Global set to track active inbox fetches and prevent race conditions
  const activeInboxFetches = new Set<string>();

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
      if (!executablePath) throw new Error('Browser not found');

      // 2. Setup Real Profile Path
      const { dbManager } = await import('../database');
      let realProfileDir = '';
      if (dbManager.dbPath && email) {
        const dbDir = path.dirname(dbManager.dbPath);
        realProfileDir = path.join(dbDir, 'profiles', email);
      } else {
        realProfileDir = path.join(userDataPath, 'browser_profiles', email);
      }

      // 3. Force Cleanup Blocker Processes (Real Profile needed for Cookie Encryption)
      const { execSync } = await import('child_process');
      try {
        // pkill -f is very effective at catching any process using this profile path in its arguments
        console.log(`[email:get-inbox] Terminating any orphan processes for ${email}`);
        execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
        // Mandatory sleep to let OS release the handles
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        // No processes found
      }

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
        headless: true, // Revert to standard headless
        env: {
          ...process.env,
          DISPLAY: process.env.DISPLAY || ':0',
        },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-dev-shm-usage',
          '--disable-features=LockProfile',
          '--password-store=gnome-libsecret', // Use Linux keyring
          '--window-size=1280,720',
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

      const { execSync } = await import('child_process');
      try {
        execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {}

      browser = await puppeteer.launch({
        executablePath,
        userDataDir: realProfileDir,
        headless: false, // Visible for debug
        env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' },
        args: ['--no-sandbox', '--password-store=gnome-libsecret', '--window-size=1280,720'],
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

      try {
        const { execSync } = await import('child_process');
        execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {}

      browser = await puppeteer.launch({
        executablePath,
        userDataDir: realProfileDir,
        headless: true,
        env: {
          ...process.env,
          DISPLAY: process.env.DISPLAY || ':0',
        },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-dev-shm-usage',
          '--disable-features=LockProfile',
          '--password-store=gnome-libsecret',
          '--window-size=1280,720',
        ],
      });

      const page = await browser.newPage();

      // Probe Geolocation
      let geoData = {};
      try {
        await page.goto('http://ip-api.com/json', { waitUntil: 'networkidle2', timeout: 10000 });
        geoData = JSON.parse(await page.evaluate(() => document.body.innerText));
      } catch (e) {
        console.warn('Geo lookup failed');
      }

      // Probe Fingerprint
      await page.goto('about:blank');
      const fingerprint = await page.evaluate(() => {
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

      return { success: true, fingerprint, geoData };
    } catch (e: any) {
      console.error('[email:get-fingerprint] FAILED:', e);
      return { success: false, error: e.message };
    } finally {
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

      const cookiesPath = path.join(realProfileDir, 'Default', 'Network', 'Cookies');
      if (!fs.existsSync(cookiesPath)) {
        return { success: true, sessions: [] };
      }

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
