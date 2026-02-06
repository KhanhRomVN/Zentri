import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';

export function setupEmailHandlers() {
  ipcMain.handle(
    'email:open-login',
    async (
      _event,
      {
        provider,
        accountId,
        url,
        profilePath,
      }: { provider: string; accountId: string; url?: string; profilePath?: string },
    ) => {
      try {
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
        // Priority: custom profilePath from renderer (git repo) > default appData path
        const userDataPath = app.getPath('userData');
        const browserProfileDir =
          profilePath || path.join(userDataPath, 'browser_profiles', accountId || provider);

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
}
