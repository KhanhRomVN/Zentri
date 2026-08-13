import { ipcMain } from 'electron';
import * as crypto from 'crypto';
import { dbManager } from '../database';
import { ProxyDiagnosticService } from '../../services/ProxyDiagnosticService';

// Local proxy data type matching the DB + renderer types
interface ProxyData {
  id: string;
  ipVersion?: number | null;
  proxyType?: string | null;
  sourceType?: string | null;
  rotationType?: string | null;
  pricingType?: string | null;
  protocol?: string | null;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  country?: string | null;
  city?: string | null;
  isp?: string | null;
  durationDays?: number | null;
  bandwidthGb?: number | null;
  price?: number | null;
  status?: string;
  metadata?: any;
  expiredAt?: string | null;
  lastCheckedAt?: string | null;
  purchaseUrl?: string | null;
  isHealthy?: number | null;
  latency?: number | null;
  successRate?: number | null;
  quotaTotal?: string | null;
  quotaUsed?: number | null;
  lastSeenMin?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export function setupProxyHandlers() {
  console.log('✅ Setting up Proxy Handlers...');

  // Diagnostic check
  ipcMain.handle('proxy:check', async (_event, proxyData: any) => {
    try {
      return await ProxyDiagnosticService.checkProxy(proxyData);
    } catch (error) {
      console.error('[proxy:check] FAILED:', error);
      throw error;
    }
  });

  // Get all proxies
  ipcMain.handle('proxy:get-all', async () => {
    try {
      const rows = await dbManager.all('SELECT * FROM proxies ORDER BY created_at DESC');
      return rows.map((row: any) => ({
        id: row.id,
        ipVersion: row.ip_version,
        proxyType: row.proxy_type,
        sourceType: row.source_type,
        rotationType: row.rotation_type,
        pricingType: row.pricing_type,
        protocol: row.protocol,
        host: row.host,
        port: row.port,
        username: row.username,
        password: row.password,
        country: row.country,
        city: row.city,
        isp: row.isp,
        durationDays: row.duration_days,
        bandwidthGb: row.bandwidth_gb,
        price: row.price,
        status: row.status,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        expiredAt: row.expired_at,
        lastCheckedAt: row.last_checked_at,
        purchaseUrl: row.purchase_url,
        isHealthy: row.is_healthy,
        latency: row.latency,
        successRate: row.success_rate,
        quotaTotal: row.quota_total,
        quotaUsed: row.quota_used,
        lastSeenMin: row.last_seen_min,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('[proxy:get-all] FAILED:', error);
      return [];
    }
  });

  // Create proxy
  ipcMain.handle('proxy:create', async (_event, data: Partial<ProxyData>) => {
    try {
      const id = data.id || crypto.randomUUID();
      const query = `
        INSERT INTO proxies (
          id, ip_version, proxy_type, source_type, rotation_type, pricing_type,
          protocol, host, port, username, password, country, city, isp,
          duration_days, bandwidth_gb, price, status, metadata,
          expired_at, last_checked_at, purchase_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        data.ipVersion || 4,
        data.proxyType || 'private',
        data.sourceType || 'datacenter',
        data.rotationType || 'static',
        data.pricingType || 'time',
        data.protocol || null,
        data.host || null,
        data.port || null,
        data.username || null,
        data.password || null,
        data.country || null,
        data.city || null,
        data.isp || null,
        data.durationDays || null,
        data.bandwidthGb || null,
        data.price || null,
        data.status || 'active',
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.expiredAt || null,
        data.lastCheckedAt || null,
        data.purchaseUrl || null,
      ];

      await dbManager.run(query, params);
      const newProxy = await dbManager.get('SELECT * FROM proxies WHERE id = ?', [id]);
      return newProxy;
    } catch (error) {
      console.error('[proxy:create] FAILED:', error);
      throw error;
    }
  });

  // Update proxy
  ipcMain.handle(
    'proxy:update',
    async (_event, { id, data }: { id: string; data: Partial<ProxyData> }) => {
      try {
        const fields = Object.entries(data)
          .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
          .map(([key]) => {
            // Map camelCase to snake_case for DB
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            return `${snakeKey} = ?`;
          });

        if (fields.length === 0) return true;

        const query = `
        UPDATE proxies 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

        const params = Object.entries(data)
          .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
          .map(([, value]) => (typeof value === 'object' ? JSON.stringify(value) : value));

        params.push(id);

        await dbManager.run(query, params);
        return true;
      } catch (error) {
        console.error('[proxy:update] FAILED:', error);
        throw error;
      }
    },
  );

  // Delete proxy
  ipcMain.handle('proxy:delete', async (_event, id: string) => {
    try {
      await dbManager.run('DELETE FROM proxies WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('[proxy:delete] FAILED:', error);
      throw error;
    }
  });

  // Get proxy history
  ipcMain.handle('proxy:get-history', async (_event, proxyId: string) => {
    try {
      const query = `
        SELECT h.*, e.email as email_address 
        FROM proxy_history h
        JOIN emails e ON h.email_id = e.id
        WHERE h.proxy_id = ?
        ORDER BY h.used_at DESC
      `;
      return await dbManager.all(query, [proxyId]);
    } catch (error) {
      console.error('[proxy:get-history] FAILED:', error);
      throw error;
    }
  });

  // Log proxy usage
  ipcMain.handle(
    'proxy:log-usage',
    async (_event, { proxyId, emailId, targetSite }: { proxyId: string; emailId: string; targetSite?: string }) => {
      try {
        const id = crypto.randomUUID();
        const query = `
          INSERT INTO proxy_history (id, proxy_id, email_id, target_site)
          VALUES (?, ?, ?, ?)
        `;
        await dbManager.run(query, [id, proxyId, emailId, targetSite || null]);
        return true;
      } catch (error) {
        console.error('[proxy:log-usage] FAILED:', error);
        throw error;
      }
    },
  );

  // Get proxy health history (last 24 checks)
  ipcMain.handle('proxy:get-health-history', async (_event, proxyId: string) => {
    try {
      const rows = await dbManager.all(
        'SELECT * FROM proxy_health_history WHERE proxy_id = ? ORDER BY timestamp DESC LIMIT 24',
        [proxyId],
      );
      return rows.map((row: any) => ({
        id: row.id,
        proxyId: row.proxy_id,
        timestamp: row.timestamp,
        isHealthy: row.is_healthy === 1,
        latency: row.latency,
      }));
    } catch (error) {
      console.error('[proxy:get-health-history] FAILED:', error);
      return [];
    }
  });
}
