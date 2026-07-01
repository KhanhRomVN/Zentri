/**
 * Search Service - Centralized IPC calls for search feature
 * All database and storage operations go through this service
 */

// ─── Storage Operations ────────────────────────────────────────────────────
export const storageGet = async (key: string): Promise<any> => {
  try {
    return await window.electron.ipcRenderer.invoke('storage:get', key);
  } catch (err) {
    console.error(`[searchService] Failed to get storage key "${key}":`, err);
    return null;
  }
};

export const storageSet = async (key: string, value: any): Promise<void> => {
  try {
    await window.electron.ipcRenderer.invoke('storage:set', key, value);
  } catch (err) {
    console.error(`[searchService] Failed to set storage key "${key}":`, err);
  }
};

// ─── SQLite Operations ────────────────────────────────────────────────────
export const sqliteAll = async (sql: string, params?: any[]): Promise<any[]> => {
  try {
    const result = await window.electron.ipcRenderer.invoke('sqlite:all', sql, params);
    return result || [];
  } catch (err) {
    console.error(`[searchService] SQLite query failed:`, err);
    return [];
  }
};

// ─── Email Data ────────────────────────────────────────────────────────────
export interface EmailRow {
  id: number;
  email: string;
  password?: string;
  recoveryEmail?: string;
  phoneNumber?: string;
  status?: string;
  createdAt?: string;
  lastUsedAt?: string;
  totpSecretKey?: string;
  proxyHost?: string;
  proxyPort?: number;
  proxyProtocol?: string;
  proxyCountry?: string;
  proxyCity?: string;
  [key: string]: any;
}

export interface ServiceLink {
  email_id: number;
  service_id: number;
  serviceName?: string;
  serviceUrl?: string;
  username?: string;
  password?: string;
  notes?: string;
  [key: string]: any;
}

export interface ServiceRow {
  id: number;
  name: string;
  url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AccountCount {
  service_id: number;
  cnt: number;
}

/**
 * Fetch all emails with optional service filter
 */
export const fetchEmails = async (serviceId?: number): Promise<EmailRow[]> => {
  let sql = 'SELECT * FROM emails ORDER BY created_at DESC';
  let params: any[] = [];
  if (serviceId) {
    sql = `
      SELECT e.* FROM emails e
      JOIN service_emails se ON se.email_id = e.id
      WHERE se.service_id = ?
      ORDER BY e.created_at DESC
    `;
    params = [serviceId];
  }
  return await sqliteAll(sql, params);
};

/**
 * Fetch service links for emails
 */
export const fetchServiceLinks = async (serviceId?: number): Promise<ServiceLink[]> => {
  let sql = `
    SELECT se.*, s.name as serviceName, s.url as serviceUrl
    FROM service_emails se 
    JOIN services s ON se.service_id = s.id
  `;
  let params: any[] = [];
  if (serviceId) {
    sql += ' WHERE se.service_id = ?';
    params = [serviceId];
  }
  return await sqliteAll(sql, params);
};

/**
 * Fetch all services from database
 */
export const fetchServices = async (): Promise<ServiceRow[]> => {
  return await sqliteAll('SELECT * FROM services ORDER BY name ASC');
};

/**
 * Fetch account counts per service
 */
export const fetchAccountCounts = async (): Promise<AccountCount[]> => {
  return await sqliteAll(
    'SELECT se.service_id, COUNT(DISTINCT se.email_id) as cnt FROM service_emails se GROUP BY se.service_id'
  );
};

/**
 * Fetch avatar for an email
 */
export const fetchAvatar = async (email: string): Promise<string | null> => {
  try {
    const result = await window.electron.ipcRenderer.invoke('email:get-avatar', { email });
    if (result) return result;
    return null;
  } catch (err) {
    console.error(`[searchService] Failed to fetch avatar for "${email}":`, err);
    return null;
  }
};

/**
 * Fetch all data for a view (emails + service links)
 */
export const fetchViewData = async (serviceId?: number): Promise<{
  emails: EmailRow[];
  serviceLinks: ServiceLink[];
}> => {
  const [emails, serviceLinks] = await Promise.all([
    fetchEmails(serviceId),
    fetchServiceLinks(serviceId),
  ]);
  return { emails, serviceLinks };
};

/**
 * Enrich email rows with linked services and proxy data
 */
export const enrichEmailRows = (
  emailRows: EmailRow[],
  serviceLinks: ServiceLink[]
): any[] => {
  return (emailRows || []).map((row: any) => {
    const linkedServices = (serviceLinks || [])
      .filter((link: any) => link.email_id === row.id)
      .map((link: any) => ({
        name: link.serviceName,
        url: link.serviceUrl,
        username: link.username,
        password: link.password,
        notes: link.notes,
      }));
    return {
      ...row,
      _services: linkedServices,
      _proxy: row.proxyHost
        ? {
            host: row.proxyHost,
            port: row.proxyPort,
            protocol: row.proxyProtocol,
            country: row.proxyCountry,
            city: row.proxyCity,
          }
        : null,
    };
  });
};