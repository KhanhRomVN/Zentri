/**
 * ------------------------------------------------------------------
 * FORGE Service
 * ------------------------------------------------------------------
 * Data layer cho FORGE feature.
 * Gọi trực tiếp IPC/SQLite qua window.electron.
 * Mapping: services = platforms, emails = accounts.
 * ------------------------------------------------------------------
 */

import { Platform, ForgeAccount, ForgeSession } from '../types';

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
  await sqliteRun(
    `INSERT OR REPLACE INTO services (id, name, url, category, description, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
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

// ─── Sessions ─────────────────────────────────────────────────────────────
export const fetchSessions = async (platformId?: string): Promise<ForgeSession[]> => {
  if (!platformId) {
    const rows = await sqliteAll('SELECT * FROM sessions ORDER BY created_at DESC');
    return rows as ForgeSession[];
  }

  // Sessions liên quan tới accounts thuộc platform qua service_emails
  const rows = await sqliteAll(
    `SELECT DISTINCT s.*, svc.name AS platformName, svc.id AS platformId,
            (SELECT COUNT(*) FROM sessions s2 WHERE s2.email_id = s.email_id) AS accountCount
     FROM sessions s
     JOIN emails e ON s.email_id = e.id
     JOIN service_emails se ON se.email_id = e.id
     JOIN services svc ON se.service_id = svc.id
     WHERE svc.id = ?
     ORDER BY s.created_at DESC`,
    [platformId],
  );
  return rows as ForgeSession[];
};

// ─── Stats ────────────────────────────────────────────────────────────────
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
  const [platformRows, sessionRows, accountRows, survivalRows] = await Promise.all([
    sqliteAll("SELECT COUNT(*) as count FROM services WHERE category = 'forge'"),
    sqliteAll('SELECT COUNT(*) as count FROM sessions'),
    sqliteAll('SELECT COUNT(*) as count FROM emails'),
    sqliteAll(
      'SELECT COUNT(CASE WHEN ended_at IS NULL THEN 1 END) as active, COUNT(*) as total FROM sessions',
    ),
  ]);

  const totalPlatforms = platformRows[0]?.count ?? 0;
  const totalSessions = sessionRows[0]?.count ?? 0;
  const totalAccounts = accountRows[0]?.count ?? 0;
  const activeSessions = survivalRows[0]?.active ?? 0;
  const totalSessionsForRate = survivalRows[0]?.total ?? 0;
  const avgSurvivalRate =
    totalSessionsForRate > 0 ? (activeSessions / totalSessionsForRate) * 100 : 0;

  return { totalPlatforms, totalSessions, totalAccounts, avgSurvivalRate };
};

export const fetchPlatformStats = async (platformId: string): Promise<PlatformStats> => {
  const rows = await sqliteAll(
    `SELECT
       (SELECT COUNT(*) FROM service_emails WHERE service_id = ?) AS accountCount,
       (SELECT COUNT(*) FROM sessions s
         JOIN emails e ON s.email_id = e.id
         JOIN service_emails se ON se.email_id = e.id
         WHERE se.service_id = ?) AS sessionCount,
       (SELECT COUNT(*) FROM sessions s
         JOIN emails e ON s.email_id = e.id
         JOIN service_emails se ON se.email_id = e.id
         WHERE se.service_id = ? AND s.ended_at IS NULL) AS activeSessions`,
    [platformId, platformId, platformId],
  );

  const accountCount = rows[0]?.accountCount ?? 0;
  const sessionCount = rows[0]?.sessionCount ?? 0;
  const activeSessions = rows[0]?.activeSessions ?? 0;
  const survivalRate = sessionCount > 0 ? (activeSessions / sessionCount) * 100 : 0;

  return { sessionCount, accountCount, survivalRate };
};