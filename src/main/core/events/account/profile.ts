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
}
