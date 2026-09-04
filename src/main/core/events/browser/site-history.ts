/**
 * Tracks fingerprint + public IP history per domain inside a Chrome profile folder.
 * Each profile gets its own fp-ip-history.db SQLite file.
 *
 * Logic:
 *   - On every navigation to a new domain, collect full fingerprint config
 *     (from app-selected config, or real browser fingerprint via CDP).
 *   - Fetch public IP via CDP (ipify.org from browser context).
 *   - Compare full fingerprint_config_json + public_ip against active entry.
 *   - If different → close old entry (set ended_at) + insert new entry.
 *   - If same → no-op.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as sqlite3 from 'sqlite3';

const TAG = '[SiteHistory]';
const TAG_DBG = '[SiteHistory:DEBUG]';
const DB_FILENAME = 'fp-ip-history.db';

// ── Schema ────────────────────────────────────────────────────────────────

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS site_fingerprint_history (
  id                       TEXT PRIMARY KEY,
  domain                   TEXT NOT NULL,
  fingerprint_hash         TEXT NOT NULL,
  fingerprint_config_json  TEXT,
  public_ip                TEXT NOT NULL,
  ip_info_json             TEXT,
  is_proxy                 INTEGER DEFAULT 0,
  started_at               DATETIME NOT NULL,
  ended_at                 DATETIME,
  created_at               DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sfh_domain_active ON site_fingerprint_history(domain, ended_at);
`;

// ── Migration: add new columns if missing ─────────────────────────────────

const MIGRATE_SQL = [
  'ALTER TABLE site_fingerprint_history ADD COLUMN fingerprint_config_json TEXT',
  'ALTER TABLE site_fingerprint_history ADD COLUMN ip_info_json TEXT',
  'ALTER TABLE site_fingerprint_history ADD COLUMN is_proxy INTEGER DEFAULT 0',
];

function runMigrations(db: sqlite3.Database): void {
  for (const sql of MIGRATE_SQL) {
    db.run(sql, (err) => {
      // Ignore "duplicate column" errors — column already exists
      if (err && !err.message.includes('duplicate column')) {
        console.error(TAG, 'Migration error:', err.message);
      }
    });
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────

function openDb(profileDir: string): sqlite3.Database {
  const dbPath = path.join(profileDir, DB_FILENAME);
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

  db.exec(CREATE_TABLE_SQL, (err) => {
    if (err) {
      console.error(TAG, 'Failed to create table:', err.message);
    } else {
      // Run migrations after table is confirmed to exist
      runMigrations(db);
    }
  });

  return db;
}

function dbGet<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

function dbRun(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Collect real browser fingerprint via CDP (read-only, no override) ─────

async function collectRealFingerprint(client: any): Promise<Record<string, any> | null> {
  try {
    const { result } = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            var gl = document.createElement('canvas').getContext('webgl');
            var debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
            var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return JSON.stringify({
              userAgent: navigator.userAgent,
              appVersion: navigator.appVersion,
              platform: navigator.platform,
              oscpu: navigator.oscpu || null,
              hardwareConcurrency: navigator.hardwareConcurrency,
              deviceMemory: navigator.deviceMemory || null,
              maxTouchPoints: navigator.maxTouchPoints,
              vendor: navigator.vendor,
              vendorSub: navigator.vendorSub,
              productSub: navigator.productSub,
              language: navigator.language,
              languages: Array.from(navigator.languages || []),
              cookieEnabled: navigator.cookieEnabled,
              doNotTrack: navigator.doNotTrack,
              pdfViewerEnabled: navigator.pdfViewerEnabled,
              webdriver: navigator.webdriver,
              screenWidth: screen.width,
              screenHeight: screen.height,
              screenAvailWidth: screen.availWidth,
              screenAvailHeight: screen.availHeight,
              screenColorDepth: screen.colorDepth,
              screenPixelDepth: screen.pixelDepth,
              devicePixelRatio: window.devicePixelRatio,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              webglVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
              webglRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
              audioSampleRate: audioCtx.sampleRate,
              audioMaxChannelCount: audioCtx.destination.maxChannelCount,
            });
          } catch (e) {
            return null;
          }
        })()
      `,
      returnByValue: true,
      timeout: 5000,
    });

    if (result?.value) {
      const fp = JSON.parse(result.value);
      return fp;
    }
    return null;
  } catch (e: any) {
    console.error(TAG, 'collectRealFingerprint() — CDP error:', e?.message);
    return null;
  }
}

// ── Fingerprint hash ──────────────────────────────────────────────────────

function hashFingerprintConfig(config: Record<string, any> | null): string {
  if (!config) {
    return 'no-fingerprint';
  }
  const sorted = JSON.stringify(config, Object.keys(config).sort());
  return crypto.createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

// ── Public IP via CDP ─────────────────────────────────────────────────────

async function fetchPublicIp(client: any): Promise<string | null> {
  try {
    const { result } = await client.send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
          } catch (e) {
            return null;
          }
        })()
      `,
      awaitPromise: true,
      timeout: 8000,
    });
    const ip = result?.value ?? null;
    return ip;
  } catch (e: any) {
    console.error(TAG, 'fetchPublicIp() — CDP error:', e?.message);
    return null;
  }
}

// ── IP info via ip-api.com ─────────────────────────────────────────────────

async function fetchIpInfo(ip: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,org,as,asname,timezone,query`,
    );
    if (!res.ok) {
      return null;
    }
    const data: any = await res.json();
    if (data?.status !== 'success') {
      return null;
    }
    return data;
  } catch (e: any) {
    console.error(TAG, 'fetchIpInfo() — error:', e?.message);
    return null;
  }
}

// ── Domain extraction ─────────────────────────────────────────────────────

function extractDomain(url: string): string | null {
  try {
    if (
      !url ||
      url === 'about:blank' ||
      url === 'chrome://newtab' ||
      url.startsWith('chrome-extension://')
    ) {
      return null;
    }
    const hostname = new URL(url).hostname;
    return hostname;
  } catch {
    return null;
  }
}

// ── Core tracking logic ───────────────────────────────────────────────────

interface ActiveEntry {
  id: string;
  fingerprint_config_json: string | null;
  public_ip: string;
}

async function trackSiteVisit(
  db: sqlite3.Database,
  domain: string,
  fpConfig: Record<string, any>,
  fpHash: string,
  ip: string,
  ipInfo: Record<string, any> | null,
  isProxy: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const fpConfigJson = JSON.stringify(fpConfig);
  const ipInfoJson = ipInfo ? JSON.stringify(ipInfo) : null;

  const active = await dbGet<ActiveEntry>(
    db,
    'SELECT id, fingerprint_config_json, public_ip FROM site_fingerprint_history WHERE domain = ? AND ended_at IS NULL',
    [domain],
  );

  if (!active) {
    const id = crypto.randomUUID();
    await dbRun(
      db,
      `INSERT INTO site_fingerprint_history
       (id, domain, fingerprint_hash, fingerprint_config_json, public_ip, ip_info_json, is_proxy, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, domain, fpHash, fpConfigJson, ip, ipInfoJson, isProxy ? 1 : 0, now],
    );
    return;
  }

  // Compare full fingerprint_config_json + public_ip
  const fpMatch = active.fingerprint_config_json === fpConfigJson;
  const ipMatch = active.public_ip === ip;

  if (fpMatch && ipMatch) {
    return;
  }

  // Different → close old + insert new
  await dbRun(db, 'UPDATE site_fingerprint_history SET ended_at = ? WHERE id = ?', [
    now,
    active.id,
  ]);

  const newId = crypto.randomUUID();
  await dbRun(
    db,
    `INSERT INTO site_fingerprint_history
     (id, domain, fingerprint_hash, fingerprint_config_json, public_ip, ip_info_json, is_proxy, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId, domain, fpHash, fpConfigJson, ip, ipInfoJson, isProxy ? 1 : 0, now],
  );
}

// ── High-level hook called from launch.ts ─────────────────────────────────

export async function onPageNavigated(
  profileDir: string,
  client: any,
  fpConfig: Record<string, any> | null,
  url: string,
  isProxy: boolean,
): Promise<void> {
  const domain = extractDomain(url);
  if (!domain) {
    return;
  }

  // Get fingerprint config: prefer app-selected, fallback to real browser fingerprint
  let resolvedFp: Record<string, any> | null = fpConfig;
  if (!resolvedFp) {
    resolvedFp = await collectRealFingerprint(client);
    if (!resolvedFp) {
      return;
    }
  }

  const ip = await fetchPublicIp(client);
  if (!ip) {
    return;
  }

  const fpHash = hashFingerprintConfig(resolvedFp);

  const ipInfo = await fetchIpInfo(ip);

  const db = openDb(profileDir);
  try {
    await trackSiteVisit(db, domain, resolvedFp, fpHash, ip, ipInfo, isProxy);
  } catch (e: any) {
    console.error(TAG, 'trackSiteVisit() — error:', e?.message);
  } finally {
    db.close();
  }
}
