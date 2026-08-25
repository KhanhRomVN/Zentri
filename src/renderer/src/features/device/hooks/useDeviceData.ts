import { useState, useEffect, useCallback, useMemo } from 'react';
import { Device, DeviceFilterState, DeviceFacetCounts } from '../types';
import { getFleetKey } from '../utils';

interface UseDeviceDataReturn {
  devices: Device[];
  filteredDevices: Device[];
  loading: boolean;
  error: string | null;
  facetCounts: DeviceFacetCounts;
  filters: DeviceFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DeviceFilterState>>;
  refresh: () => void;
}

function computeFacetCounts(devices: Device[]): DeviceFacetCounts {
  const counts: DeviceFacetCounts = {
    fleet: {},
    status: {},
    platform: {},
    group: {},
    tags: {},
  };
  for (const d of devices) {
    counts.fleet[getFleetKey(d)] = (counts.fleet[getFleetKey(d)] || 0) + 1;
    counts.status[d.status] = (counts.status[d.status] || 0) + 1;
    const platform = d.platform || 'unknown';
    counts.platform[platform] = (counts.platform[platform] || 0) + 1;
    const group = d.groupName || 'ungrouped';
    counts.group[group] = (counts.group[group] || 0) + 1;
    for (const tag of d.tags || []) {
      counts.tags[tag] = (counts.tags[tag] || 0) + 1;
    }
  }
  return counts;
}

export function useDeviceData(): UseDeviceDataReturn {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceFilterState>({
    searchQuery: '',
    fleet: new Set(['all']),
    status: new Set(['online', 'busy', 'offline', 'error']),
    platform: new Set(),
    group: new Set(),
    tags: new Set(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('device:get-all');
      setDevices(data || []);
    } catch (err: any) {
      console.error('[Device] Load error:', err);
      setError(`Failed to load devices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facetCounts = useMemo(() => computeFacetCounts(devices), [devices]);

  const filteredDevices = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return devices.filter((d) => {
      const fleetKey = getFleetKey(d);
      if (!filters.fleet.has('all') && !filters.fleet.has(fleetKey)) return false;
      if (!filters.status.has(d.status)) return false;
      if (d.platform && filters.platform.size > 0 && !filters.platform.has(d.platform)) return false;
      if (d.groupName && filters.group.size > 0 && !filters.group.has(d.groupName)) return false;
      if (d.tags && filters.tags.size > 0 && !d.tags.some((t) => filters.tags.has(t))) return false;
      if (q) {
        const hay = [d.name, d.platform, d.osVersion, d.ipAddress, d.macAddress, d.groupName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [devices, filters]);

  return {
    devices,
    filteredDevices,
    loading,
    error,
    facetCounts,
    filters,
    setFilters,
    refresh: loadData,
  };
}