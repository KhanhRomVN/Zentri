import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import { dbManager } from '../../database';
import { getExecutablePath } from '../browser/utils';

const activeInboxFetches = new Set<string>();
const activeFingerprintFetches = new Set<string>();

export function setupDataHandlers() {
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
        try {
          execSync(`pkill -9 -f "${realProfileDir}"`, { stdio: 'ignore' });
          await new Promise((r) => setTimeout(r, 2000));
        } catch (e) {}

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

        await page.goto('https://mail.google.com/mail/u/0/h/', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        const currentUrl = page.url();
        const pageTitle = await page.title();
        if (
          currentUrl.includes('accounts.google.com') ||
          pageTitle.includes('Sign in') ||
          pageTitle.includes('Đăng nhập')
        ) {
          return { success: false, error: 'NOT_LOGGED_IN' };
        }

        await new Promise((r) => setTimeout(r, 2000));

        const messages: any[] = await page.evaluate(() => {
          const doc = (globalThis as any).document;
          const modernRows = Array.from(doc.querySelectorAll('tr.zA, div[role="main"] tr[role="row"]'));
          if (modernRows.length > 5) {
            return modernRows.slice(0, 15).map((row: any) => {
              try {
                const senderSpan = row.querySelector('.zF, .bA4, .vY');
                const subjectSpan = row.querySelector('.bog');
                const snippetSpan = row.querySelector('.y2');
                const timeSpan = row.querySelector('.xW, .bq3');
                if (!subjectSpan) return null;
                return {
                  id: Math.random().toString(36).substring(7),
                  sender: senderSpan ? senderSpan.innerText.trim() : 'Unknown',
                  subject: subjectSpan.innerText.trim(),
                  preview: snippetSpan ? snippetSpan.innerText.trim().replace(/^[\s\u00a0-]+/, '') : '',
                  time: timeSpan ? timeSpan.innerText.trim() : '',
                  isUnread: row.classList.contains('zE'),
                };
              } catch (e) { return null; }
            }).filter((m: any) => m !== null);
          }

          const mobileItems = Array.from(doc.querySelectorAll('div[role="listitem"], .v'));
          if (mobileItems.length > 5) {
            return mobileItems.slice(0, 15).map((item: any) => {
              const text = item.innerText || '';
              const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
              if (lines.length < 2) return null;
              return {
                id: Math.random().toString(36).substring(7),
                sender: lines[0] || 'Unknown',
                subject: lines[1] || 'No Subject',
                preview: lines.slice(2).join(' ').substring(0, 100),
                time: '',
                isUnread: item.querySelector('b') !== null,
              };
            }).filter((m: any) => m !== null);
          }

          const rows = Array.from(doc.querySelectorAll('table.m tr, table[bgcolor="#ffffff"] tr'));
          return rows.map((row: any) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return null;
            return {
              id: Math.random().toString(36).substring(7),
              sender: cells[1]?.innerText.trim() || 'Unknown',
              subject: cells[2]?.innerText.trim() || 'No Subject',
              preview: '',
              time: cells[3]?.innerText.trim() || '',
              isUnread: row.querySelector('b') !== null,
            };
          }).filter((m) => m !== null).slice(0, 10);
        });

        const finalMessages = messages.map((m: any) => {
          const otpRegex = /\b\d{4,8}\b|\b[A-Z0-9]{5,8}\b/;
          const match = (m.subject + ' ' + m.preview).match(otpRegex);
          return { ...m, hasOtp: !!match, otpCode: match ? match[0] : undefined };
        });

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
        browser = await puppeteer.launch({
          executablePath,
          userDataDir: realProfileDir,
          headless: true,
          args: ['--no-sandbox', '--disable-gpu', '--ozone-platform=x11'],
        });

        const page = await browser.newPage();
        await page.goto('https://browserleaks.com/ip', { waitUntil: 'networkidle2', timeout: 30000 });
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

        await page.goto('https://browserleaks.com/webrtc', { waitUntil: 'networkidle2', timeout: 30000 });
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

        let score = 100;
        const reasons: string[] = [];
        if (webrtcData.public !== 'No Leak' && webrtcData.public !== ipData.ip) {
          score -= 20; reasons.push('WebRTC IP Leak detected');
        }
        if (ipData.usageType.toLowerCase().includes('data center')) {
          score -= 15; reasons.push('Data Center IP detected');
        }

        return {
          success: true,
          geoData: {
            query: ipData.ip, city: ipData.city, country: ipData.country,
            usageType: ipData.usageType, isp: ipData.isp,
          },
          fingerprint: { os: ipData.os },
          webrtc: webrtcData,
          health: { val: score, reasons },
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
    async (_event, { email }: { email: string; browserPath?: string }) => {
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

        let cookiesPath = candidates.find(p => fs.existsSync(p)) || '';
        if (!cookiesPath) return { success: true, sessions: [] };

        const tempPath = path.join(userDataPath, `temp_sess_${Date.now()}.db`);
        fs.copyFileSync(cookiesPath, tempPath);

        const db = new sqlite3.Database(tempPath);
        const rows: any[] = await new Promise((resolve, reject) => {
          db.all('SELECT host_key, count(*) as count, max(expires_utc) as exp FROM cookies GROUP BY host_key', (err, rows) => {
            db.close();
            if (err) reject(err); else resolve(rows || []);
          });
        });

        try { fs.unlinkSync(tempPath); } catch (e) {}

        return {
          success: true,
          sessions: rows.map((r) => ({
            domain: r.host_key,
            count: r.count,
            expiryDate: new Date((r.exp / 1000000 - 11644473600) * 1000).toISOString(),
          })),
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  );

  ipcMain.handle(
    'email:get-latest-activity',
    async (_event, { email }: { email: string }) => {
      try {
        const dbDir = path.dirname(dbManager.dbPath);
        const userDataPath = app.getPath('userData');
        const profileDir = path.join(dbDir, 'profiles', email);
        const historyPath = path.join(profileDir, 'Default', 'History');

        if (!fs.existsSync(historyPath)) return { success: true, latest: null };

        const tempPath = path.join(userDataPath, `temp_latest_${Date.now()}.db`);
        fs.copyFileSync(historyPath, tempPath);
        const db = new sqlite3.Database(tempPath);

        const query = `
          SELECT urls.url, urls.title, visits.visit_time
          FROM visits JOIN urls ON visits.url = urls.id 
          ORDER BY visits.visit_time DESC LIMIT 1
        `;

        const row: any = await new Promise((resolve) => {
          db.get(query, [], (_err, row) => {
            db.close(); resolve(row);
          });
        });
        
        try { fs.unlinkSync(tempPath); } catch (e) {}

        if (!row) return { success: true, latest: null };

        return {
          success: true,
          latest: {
            url: row.url,
            title: row.title,
            time: Math.floor(row.visit_time / 1000 - 11644473600000),
          }
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
  );

  ipcMain.handle(
    'email:get-history',
    async (_event, { email, date }: { email: string; date?: string }) => {
      try {
        const dbDir = path.dirname(dbManager.dbPath);
        const userDataPath = app.getPath('userData');
        const profileDir = path.join(dbDir, 'profiles', email);
        const historyPath = path.join(profileDir, 'Default', 'History');

        if (!fs.existsSync(historyPath)) return { success: true, history: [], stats: { topWebsites: [], intervals: [] } };

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
            db.close(); resolve(rows || []);
          });
        });
        fs.unlinkSync(tempPath);

        const history = rows.map((r) => ({
          url: r.url, title: r.title,
          time: Math.floor(r.visit_time / 1000 - 11644473600000),
        }));

        const domainCounts: Record<string, { count: number; duration: number; iconUrl: string }> = {};
        history.forEach((h, index) => {
          try {
            const d = new URL(h.url).hostname.replace('www.', '');
            if (!domainCounts[d]) domainCounts[d] = { count: 0, duration: 0, iconUrl: h.url };
            domainCounts[d].count++;
            domainCounts[d].duration += Math.floor((rows[index].visit_duration || 0) / 1000000);
          } catch {}
        });

        const topWebsites = Object.entries(domainCounts)
          .map(([domain, data]) => ({ domain, count: data.count, duration: data.duration, url: data.iconUrl }))
          .sort((a, b) => b.count - a.count).slice(0, 10);

        const intervals = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
        history.forEach((h) => {
          const hour = new Date(h.time).getHours();
          if (hour >= 0 && hour < 24) intervals[hour].count++;
        });

        return { success: true, history: history.reverse(), stats: { topWebsites, intervals, totalVisits: history.length } };
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
          SELECT CAST(((visit_time/1000000)-11644473600)/86400 AS INTEGER)*86400 as day, urls.url
          FROM visits JOIN urls ON visits.url = urls.id
          WHERE visit_time >= ? AND visit_time < ?
        `;

        const rows: any[] = await new Promise((resolve) => {
          db.all(query, [startTime, endTime], (_err, rows) => {
            db.close(); resolve(rows || []);
          });
        });
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        const activity: Record<string, { domains: Set<string> }> = {};
        rows.forEach((row) => {
          const dateStr = new Date(row.day * 1000).toISOString().split('T')[0];
          if (!activity[dateStr]) activity[dateStr] = { domains: new Set<string>() };
          try {
            const hostname = new URL(row.url).hostname.replace('www.', '');
            const parts = hostname.split('.');
            const domain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
            activity[dateStr].domains.add(domain);
          } catch {}
        });

        const finalActivity: Record<string, { domainCount: number }> = {};
        Object.entries(activity).forEach(([date, data]) => {
          finalActivity[date] = { domainCount: data.domains.size };
        });

        return { success: true, activity: finalActivity };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  );
}
