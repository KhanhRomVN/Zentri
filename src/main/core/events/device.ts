import * as crypto from 'crypto';
import * as crypto from 'crypto';
import { ipcMain } from 'electron';
import { dbManager } from '../database';
import { DeviceScannerService } from '../../services/DeviceScannerService';

interface DeviceData {
  id: string;
  name: string;
  type: string;
  isVirtual: number;
  platform?: string | null;
  osVersion?: string | null;
  groupName?: string | null;
  tags?: string[] | null;
  status?: string;
  ipAddress?: string | null;
  macAddress?: string | null;
  battery?: number | null;
  storageTotal?: number | null;
  storageUsed?: number | null;
  ramTotal?: number | null;
  ramUsed?: number | null;
  cpuUsage?: number | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function setupDeviceHandlers() {
  ipcMain.handle('device:scan', async () => {
    try {
      const scanner = DeviceScannerService.getInstance();
      return scanner.scanAdbDevices();
    } catch (error) {
      console.error('[device:scan] FAILED:', error);
      return [];
    }
  });

  ipcMain.handle('device:get-all', async () => {
    try {
      const rows = await dbManager.all('SELECT * FROM devices ORDER BY created_at DESC');
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isVirtual: row.is_virtual,
        platform: row.platform,
        osVersion: row.os_version,
        groupName: row.group_name,
        tags: row.tags ? JSON.parse(row.tags) : [],
        status: row.status,
        ipAddress: row.ip_address,
        macAddress: row.mac_address,
        battery: row.battery,
        storageTotal: row.storage_total,
        storageUsed: row.storage_used,
        ramTotal: row.ram_total,
        ramUsed: row.ram_used,
        cpuUsage: row.cpu_usage,
        lastSeenAt: row.last_seen_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('[device:get-all] FAILED:', error);
      return [];
    }
  });

  ipcMain.handle('device:create', async (_event, data: Partial<DeviceData>) => {
    try {
      const id = data.id || crypto.randomUUID();
      const query = `
        INSERT INTO devices (
          id, name, type, is_virtual, platform, os_version, group_name, tags,
          status, ip_address, mac_address, battery, storage_total, storage_used,
          ram_total, ram_used, cpu_usage, last_seen_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        id,
        data.name || 'Untitled Device',
        data.type || 'mobile',
        data.isVirtual || 0,
        data.platform || null,
        data.osVersion || null,
        data.groupName || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.status || 'online',
        data.ipAddress || null,
        data.macAddress || null,
        data.battery || null,
        data.storageTotal || null,
        data.storageUsed || null,
        data.ramTotal || null,
        data.ramUsed || null,
        data.cpuUsage || null,
        data.lastSeenAt || null,
      ];
      await dbManager.run(query, params);
      return { id };
    } catch (error) {
      console.error('[device:create] FAILED:', error);
      throw error;
    }
  });

  ipcMain.handle('device:update', async (_event, id: string, data: Partial<DeviceData>) => {
    try {
      const query = `
        UPDATE devices SET
          name = ?, type = ?, is_virtual = ?, platform = ?, os_version = ?,
          group_name = ?, tags = ?, status = ?, ip_address = ?, mac_address = ?,
          battery = ?, storage_total = ?, storage_used = ?, ram_total = ?,
          ram_used = ?, cpu_usage = ?, last_seen_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const params = [
        data.name,
        data.type,
        data.isVirtual,
        data.platform,
        data.osVersion,
        data.groupName,
        data.tags ? JSON.stringify(data.tags) : null,
        data.status,
        data.ipAddress,
        data.macAddress,
        data.battery,
        data.storageTotal,
        data.storageUsed,
        data.ramTotal,
        data.ramUsed,
        data.cpuUsage,
        data.lastSeenAt,
        id,
      ];
      await dbManager.run(query, params);
      return { success: true };
    } catch (error) {
      console.error('[device:update] FAILED:', error);
      throw error;
    }
  });

  ipcMain.handle('device:delete', async (_event, id: string) => {
    try {
      await dbManager.run('DELETE FROM devices WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('[device:delete] FAILED:', error);
      throw error;
    }
  });
}