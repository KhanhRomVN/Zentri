import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as crypto from 'crypto';
import { dbManager } from '../../database';

export function setupProfileHandlers() {
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

  /**
   * Check if a specific domain has active session cookies in the profile.
   * Returns { success: true, hasSession: boolean, cookieCount: number, lastActivity: string }
   */
  ipcMain.handle(
    'email:check-domain-session',
    async (_event, { email, domain }: { email: string; domain: string }) => {
      try {
        if (!dbManager.dbPath || !email || !domain) {
          return { success: false, error: 'INVALID_INPUT' };
        }

        const profileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);

        if (!fs.existsSync(path.join(profileDir, 'Default'))) {
          return { success: true, hasSession: false, cookieCount: 0, reason: 'empty-profile' };
        }

        const candidates = [
          path.join(profileDir, 'Default', 'Network', 'Cookies'),
          path.join(profileDir, 'Default', 'Cookies'),
          path.join(profileDir, 'Network', 'Cookies'),
          path.join(profileDir, 'Cookies'),
        ];
        const cookiesPath = candidates.find((p) => fs.existsSync(p));
        if (!cookiesPath) {
          return { success: true, hasSession: false, cookieCount: 0, reason: 'no-cookies-file' };
        }

        // Copy to temp file
        const userDataPath = app.getPath('userData');
        const tempPath = path.join(userDataPath, `temp_domain_check_${Date.now()}.db`);
        fs.copyFileSync(cookiesPath, tempPath);

        const db = new sqlite3.Database(tempPath);
        const rows: any[] = await new Promise((resolve) => {
          db.all(
            `SELECT name, expires_utc, last_access_utc, is_httponly, is_secure 
             FROM cookies 
             WHERE host_key LIKE ? OR host_key LIKE ?`,
            [`%.${domain}`, domain],
            (err, r) => {
              db.close();
              if (err) resolve([]);
              else resolve(r || []);
            },
          );
        });

        try {
          fs.unlinkSync(tempPath);
        } catch (e) {}

        // Check if cookies are still valid (not expired)
        const now = Date.now() * 1000; // Chrome uses microseconds since epoch
        const validCookies = rows.filter((c) => {
          // expires_utc = 0 means session cookie (expires when browser closes)
          // or check if not expired yet
          return c.expires_utc === 0 || c.expires_utc > now;
        });

        // Calculate last activity (most recent last_access_utc)
        let lastActivity = null;
        if (validCookies.length > 0) {
          const maxAccess = Math.max(...validCookies.map((c) => c.last_access_utc || 0));
          if (maxAccess > 0) {
            // Convert Chrome timestamp (microseconds since 1601) to JS timestamp
            const chromeEpoch = Date.UTC(1601, 0, 1);
            lastActivity = new Date(chromeEpoch + maxAccess / 1000).toISOString();
          }
        }

        // Determine the nearest expiry among persistent (non-session) cookies
        // so the UI can show a real days-remaining countdown instead of a
        // guessed fixed window. Session cookies (expires_utc === 0) have no
        // fixed expiry — they last until the browser closes.
        let nearestExpiryUtc: string | null = null;
        const persistentCookies = validCookies.filter((c) => c.expires_utc && c.expires_utc > 0);
        if (persistentCookies.length > 0) {
          const minExpires = Math.min(...persistentCookies.map((c) => c.expires_utc));
          const chromeEpoch = Date.UTC(1601, 0, 1);
          nearestExpiryUtc = new Date(chromeEpoch + minExpires / 1000).toISOString();
        }

        return {
          success: true,
          hasSession: validCookies.length > 0,
          cookieCount: validCookies.length,
          lastActivity,
          nearestExpiryUtc,
          reason: validCookies.length > 0 ? 'has-cookies' : 'no-valid-cookies',
        };
      } catch (error: any) {
        console.error('Error checking domain session:', error);
        return { success: false, error: error.message };
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

      const uniqueServices = Array.from(new Map(services.map((s) => [s.url, s])).values());
      return uniqueServices;
    } catch (error) {
      console.error('Error extracting services:', error);
      return [];
    }
  });

  ipcMain.handle(
    'service_emails:insert',
    async (
      _event,
      {
        emailId,
        serviceId,
        metadata,
        twoFa,
      }: {
        emailId: string;
        serviceId: string;
        metadata?: Record<string, any>;
        twoFa?: { totp?: string; backupCodes?: string[] };
      },
    ) => {
      try {
        const id = crypto.randomUUID();
        const query = `
          INSERT INTO service_emails (id, email_id, service_id, metadata, two_fa)
          VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
          id,
          emailId,
          serviceId,
          metadata ? JSON.stringify(metadata) : null,
          twoFa ? JSON.stringify(twoFa) : null,
        ];
        await dbManager.run(query, params);
        return { success: true, id };
      } catch (error: any) {
        console.error('Error adding service link:', error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'service_emails:update',
    async (
      _event,
      {
        linkId,
        metadata,
        twoFa,
      }: {
        linkId: string;
        metadata?: Record<string, any>;
        twoFa?: { totp?: string; backupCodes?: string[] };
      },
    ) => {
      try {
        const query = `
          UPDATE service_emails SET metadata = ?, two_fa = ? WHERE id = ?
        `;
        const twoFaStr = twoFa ? JSON.stringify(twoFa) : null;
        const result = await dbManager.run(query, [
          metadata ? JSON.stringify(metadata) : null,
          twoFaStr,
          linkId,
        ]);
        return { success: true };
      } catch (error: any) {
        console.error('Error updating service link:', error);
        return { success: false, error: error.message };
      }
    },
  );

  /**
   * Determines whether the browser profile for `email` currently has an active
   * Google account session by inspecting the auth cookies Chrome writes after
   * sign-in (SID / SAPISID / __Secure-*PSID family).
   *
   * Returns `{ loggedIn, reason }` where reason is one of:
   *   - 'empty-profile'   : profile folder has no Default/ → browser never launched
   *   - 'no-cookies-file' : no Cookies file exists
   *   - 'no-auth-cookie'  : Cookies file exists but has no Google auth cookie
   *   - 'ok'              : at least one Google auth cookie present
   */
  ipcMain.handle('email:check-google-login', async (_event, { email }: { email: string }) => {
    try {
      if (!dbManager.dbPath || !email) {
        return { success: false, error: 'INVALID_INPUT' };
      }

      const profileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);

      if (!fs.existsSync(path.join(profileDir, 'Default'))) {
        return { success: true, loggedIn: false, reason: 'empty-profile' };
      }

      const candidates = [
        path.join(profileDir, 'Default', 'Network', 'Cookies'),
        path.join(profileDir, 'Default', 'Cookies'),
        path.join(profileDir, 'Network', 'Cookies'),
        path.join(profileDir, 'Cookies'),
      ];
      const cookiesPath = candidates.find((p) => fs.existsSync(p));
      if (!cookiesPath) {
        return { success: true, loggedIn: false, reason: 'no-cookies-file' };
      }

      // Copy to a temp file so we don't lock the live Cookies DB while Chrome
      // might be running against the same profile.
      const userDataPath = app.getPath('userData');
      const tempPath = path.join(userDataPath, `temp_glogin_${Date.now()}.db`);
      fs.copyFileSync(cookiesPath, tempPath);

      const db = new sqlite3.Database(tempPath);
      const row: any = await new Promise((resolve) => {
        db.get(
          `SELECT COUNT(*) AS count FROM cookies
           WHERE host_key LIKE '%.google.com'
             AND name IN ('SID','HSID','SSID','APISID','SAPISID',
                          '__Secure-1PSID','__Secure-3PSID',
                          '__Secure-1PAPISID','__Secure-3PAPISID','LSID')`,
          (err, r) => {
            db.close();
            if (err) resolve({ count: 0 });
            else resolve(r || { count: 0 });
          },
        );
      });

      try {
        fs.unlinkSync(tempPath);
      } catch (e) {}

      const count = row?.count ?? 0;
      return {
        success: true,
        loggedIn: count > 0,
        reason: count > 0 ? 'ok' : 'no-auth-cookie',
      };
    } catch (error: any) {
      console.error('Error checking Google login:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Read the current extension state of a Chrome profile:
   *   - developerMode: whether extensions.ui.developer_mode is true
   *   - unpackedExtensions: entries with location=4 (manually loaded)
   *
   * Returns `{ success: true, developerMode, unpackedExtensions }`.
   * The profile is inspected via `Default/Preferences` (JSON); no live Chrome
   * needed, but the file may be stale if Chrome is currently running.
   */
  ipcMain.handle('email:get-extension-state', async (_event, { email }: { email: string }) => {
    try {
      if (!dbManager.dbPath || !email) {
        return { success: false, error: 'INVALID_INPUT' };
      }
      const profileDir = path.join(path.dirname(dbManager.dbPath), 'profiles', email);
      const preferencesPath = path.join(profileDir, 'Default', 'Preferences');
      if (!fs.existsSync(preferencesPath)) {
        return { success: true, developerMode: false, unpackedExtensions: [] };
      }
      const prefs = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
      const developerMode = prefs?.extensions?.ui?.developer_mode === true;
      const settings = prefs?.extensions?.settings || {};
      const unpackedExtensions = Object.entries(settings)
        .filter(([, v]: [string, any]) => v?.location === 4 && typeof v?.path === 'string')
        .map(([id, v]: [string, any]) => ({
          id,
          path: v.path,
          fromWebstore: v.from_webstore === true,
          state: v.state,
        }));
      return { success: true, developerMode, unpackedExtensions };
    } catch (error: any) {
      console.error('Error reading extension state:', error);
      return { success: false, error: error.message };
    }
  });

  // ─── Password manager (per-profile SQLite file) ─────────────────────────
  // Credentials live in `<profileDir>/passwords.db`, separate from the main
  // Zentri DB. The browser extension reads this file for autofill.

  const getPasswordsDbPath = (email: string): string =>
    path.join(path.dirname(dbManager.dbPath), 'profiles', email, 'passwords.db');

  const ensurePasswordsTable = (db: sqlite3.Database): Promise<void> =>
    new Promise((resolve, reject) => {
      db.exec(
        `CREATE TABLE IF NOT EXISTS passwords (
           id TEXT PRIMARY KEY,
           url TEXT NOT NULL,
           username TEXT,
           password TEXT,
           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
           updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
         )`,
        (err) => (err ? reject(err) : resolve()),
      );
    });

  ipcMain.handle('profile:list-passwords', async (_event, { email }: { email: string }) => {
    try {
      if (!dbManager.dbPath || !email) return { success: false, error: 'INVALID_INPUT' };
      const dbPath = getPasswordsDbPath(email);
      if (!fs.existsSync(dbPath)) return { success: true, passwords: [] };
      const db = new sqlite3.Database(dbPath);
      await ensurePasswordsTable(db);
      const rows: any[] = await new Promise((resolve) => {
        db.all(
          'SELECT id, url, username, password FROM passwords ORDER BY created_at ASC',
          (err, r) => {
            db.close();
            if (err) resolve([]);
            else resolve(r || []);
          },
        );
      });
      return { success: true, passwords: rows };
    } catch (error: any) {
      console.error('Error listing passwords:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    'profile:add-password',
    async (
      _event,
      {
        email,
        url,
        username,
        password,
      }: { email: string; url: string; username?: string; password: string },
    ) => {
      try {
        if (!dbManager.dbPath || !email) return { success: false, error: 'INVALID_INPUT' };
        const dbPath = getPasswordsDbPath(email);
        const profileDir = path.dirname(dbPath);
        if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
        const db = new sqlite3.Database(dbPath);
        await ensurePasswordsTable(db);
        const id = crypto.randomUUID();
        await new Promise<void>((resolve, reject) => {
          db.run(
            'INSERT INTO passwords (id, url, username, password) VALUES (?, ?, ?, ?)',
            [id, url, username || '', password],
            (err) => (err ? reject(err) : resolve()),
          );
        });
        db.close();
        return { success: true, id };
      } catch (error: any) {
        console.error('Error adding password:', error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'profile:update-password',
    async (
      _event,
      {
        email,
        id,
        url,
        username,
        password,
      }: { email: string; id: string; url: string; username?: string; password: string },
    ) => {
      try {
        if (!dbManager.dbPath || !email || !id) {
          return { success: false, error: 'INVALID_INPUT' };
        }
        const dbPath = getPasswordsDbPath(email);
        if (!fs.existsSync(dbPath)) return { success: false, error: 'NOT_FOUND' };
        const db = new sqlite3.Database(dbPath);
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE passwords SET url = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [url, username || '', password, id],
            (err) => (err ? reject(err) : resolve()),
          );
        });
        db.close();
        return { success: true };
      } catch (error: any) {
        console.error('Error updating password:', error);
        return { success: false, error: error.message };
      }
    },
  );

  ipcMain.handle(
    'profile:delete-password',
    async (_event, { email, id }: { email: string; id: string }) => {
      try {
        if (!dbManager.dbPath || !email || !id) {
          return { success: false, error: 'INVALID_INPUT' };
        }
        const dbPath = getPasswordsDbPath(email);
        if (!fs.existsSync(dbPath)) return { success: true };
        const db = new sqlite3.Database(dbPath);
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM passwords WHERE id = ?', [id], (err) =>
            err ? reject(err) : resolve(),
          );
        });
        db.close();
        return { success: true };
      } catch (error: any) {
        console.error('Error deleting password:', error);
        return { success: false, error: error.message };
      }
    },
  );
}
