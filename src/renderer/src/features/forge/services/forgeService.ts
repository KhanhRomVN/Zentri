/**
 * ------------------------------------------------------------------
 * FORGE Service
 * ------------------------------------------------------------------
 * Data layer cho FORGE feature.
 * Gọi trực tiếp IPC/SQLite qua window.electron.
 * Mapping: services = platforms, emails = accounts.
 * ------------------------------------------------------------------
 */

import { Platform, ForgeAccount } from '../types';

// ─── Low-level IPC helpers ────────────────────────────────────────────────
const sqliteAll = async (sql: string, params?: unknown[]): Promise<any[]> => {
  try {
    return await window.electron.ipcRenderer.invoke('sqlite:all', sql, params);
  } catch (err) {
    console.error('[forgeService] sqlite:all failed:', err);
    return [];
  }
};

const sqliteRun = async (sql: string, params?: unknown[]): Promise<void> => {
  try {
    await window.electron.ipcRenderer.invoke('sqlite:run', sql, params);
  } catch (err) {
    console.error('[forgeService] sqlite:run failed:', err);
    throw err;
  }
};

// ─── Platforms (services) ─────────────────────────────────────────────────
export const fetchPlatforms = async (): Promise<Platform[]> => {
  const rows = await sqliteAll(
    "SELECT * FROM services WHERE category = 'forge' ORDER BY name ASC",
  );
  return rows as Platform[];
};

export const fetchAllServices = async (): Promise<Platform[]> => {
  const rows = await sqliteAll('SELECT * FROM services ORDER BY name ASC');
  return rows as Platform[];
};

export const addPlatform = async (platform: {
  id: string;
  name: string;
  url?: string;
  category?: string;
  description?: string;
}): Promise<void> => {
  // UPSERT instead of INSERT OR REPLACE — REPLACE is implemented as DELETE + INSERT
  // in SQLite and would fire the `service_emails` FK ON DELETE CASCADE, wiping
  // every email linked to this platform. Also preserves columns the caller does
  // not touch (tags, metadata, two_fa, ...).
  await sqliteRun(
    `INSERT INTO services (id, name, url, category, description, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       url = excluded.url,
       category = excluded.category,
       description = excluded.description,
       updated_at = CURRENT_TIMESTAMP`,
    [platform.id, platform.name, platform.url || null, platform.category || null, platform.description || null],
  );
};

// ─── Accounts (emails) ────────────────────────────────────────────────────
export const fetchAccounts = async (platformId?: string): Promise<ForgeAccount[]> => {
  if (!platformId) {
    const rows = await sqliteAll('SELECT * FROM emails ORDER BY created_at DESC');
    return rows as ForgeAccount[];
  }

  const rows = await sqliteAll(
    `SELECT e.*, s.name AS platformName, s.id AS platformId
     FROM emails e
     JOIN service_emails se ON se.email_id = e.id
     JOIN services s ON se.service_id = s.id
     WHERE s.id = ?
     ORDER BY e.created_at DESC`,
    [platformId],
  );
  return rows as ForgeAccount[];
};

// ─── Stats ────────────────────────────────────────────────────────────────
// Note: sessions table has been removed. Session-related stats now return 0.
// Cookie-based session detection is handled per-profile via email:get-sessions IPC.

export interface PlatformStats {
  sessionCount: number;
  accountCount: number;
  survivalRate: number; // 0-100
}

export interface DashboardStats {
  totalPlatforms: number;
  totalSessions: number;
  totalAccounts: number;
  avgSurvivalRate: number; // 0-100
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [platformRows, accountRows] = await Promise.all([
    sqliteAll("SELECT COUNT(*) as count FROM services WHERE category = 'forge'"),
    sqliteAll('SELECT COUNT(*) as count FROM emails'),
  ]);

  const totalPlatforms = platformRows[0]?.count ?? 0;
  const totalAccounts = accountRows[0]?.count ?? 0;

  return { totalPlatforms, totalSessions: 0, totalAccounts, avgSurvivalRate: 0 };
};

export const fetchPlatformStats = async (platformId: string): Promise<PlatformStats> => {
  const rows = await sqliteAll(
    `SELECT (SELECT COUNT(*) FROM service_emails WHERE service_id = ?) AS accountCount`,
    [platformId],
  );

  const accountCount = rows[0]?.accountCount ?? 0;

  return { sessionCount: 0, accountCount, survivalRate: 0 };
};