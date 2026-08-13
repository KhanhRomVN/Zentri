import { useState, useEffect, useCallback, useMemo } from 'react';
import { Proxy, ProxyFilterState, ProxyFacetCounts, DisplayStatus } from '../types';
import { deriveDisplayStatus } from '../constants';

interface UseProxyDataReturn {
  proxies: Proxy[];
  filteredProxies: Proxy[];
  paginatedProxies: Proxy[];
  loading: boolean;
  error: string | null;
  facetCounts: ProxyFacetCounts;
  filters: ProxyFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ProxyFilterState>>;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  refresh: () => void;
}

const PAGE_SIZE = 50;

function computeFacetCounts(proxies: Proxy[]): ProxyFacetCounts {
  const counts: ProxyFacetCounts = {
    status: {},
    protocol: {},
    source: {},
    type: {},
    country: {},
  };
  for (const p of proxies) {
    const ds = deriveDisplayStatus(p);
    counts.status[ds] = (counts.status[ds] || 0) + 1;

    const proto = p.protocol || 'unknown';
    counts.protocol[proto] = (counts.protocol[proto] || 0) + 1;

    const src = p.source_type || 'unknown';
    counts.source[src] = (counts.source[src] || 0) + 1;

    const type = p.proxy_type || 'unknown';
    counts.type[type] = (counts.type[type] || 0) + 1;

    const country = p.country || 'unknown';
    counts.country[country] = (counts.country[country] || 0) + 1;
  }
  return counts;
}

export function useProxyData(): UseProxyDataReturn {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<ProxyFilterState>({
    searchQuery: '',
    status: new Set(['healthy', 'degraded', 'dead', 'testing']),
    protocol: new Set(['http', 'socks5']),
    source: new Set(['datacenter', 'residential', 'mobile']),
    type: new Set(['private', 'shared']),
    country: new Set(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('proxy:get-all');
      setProxies(data || []);
    } catch (err: any) {
      console.error('[Proxy] Load error:', err);
      setError(`Failed to load proxies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize country filter with all available countries
  useEffect(() => {
    if (proxies.length > 0 && filters.country.size === 0) {
      const countries = new Set(proxies.map((p) => p.country).filter(Boolean) as string[]);
      setFilters((prev) => ({ ...prev, country: countries }));
    }
  }, [proxies.length]);

  const facetCounts = useMemo(() => computeFacetCounts(proxies), [proxies]);

  const filteredProxies = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return proxies.filter((p) => {
      const ds = deriveDisplayStatus(p);
      if (!filters.status.has(ds)) return false;
      if (p.protocol && !filters.protocol.has(p.protocol)) return false;
      if (p.source_type && !filters.source.has(p.source_type)) return false;
      if (p.proxy_type && !filters.type.has(p.proxy_type)) return false;
      if (p.country && !filters.country.has(p.country)) return false;
      if (q) {
        const hay = [
          p.host, p.port?.toString(), p.username, p.isp, p.country, p.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [proxies, filters]);

  const totalRecords = filteredProxies.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const startRecord = totalRecords > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRecord = Math.min(currentPage * PAGE_SIZE, totalRecords);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProxies.length]);

  const paginatedProxies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProxies.slice(start, start + PAGE_SIZE);
  }, [filteredProxies, currentPage]);

  return {
    proxies,
    filteredProxies,
    paginatedProxies,
    loading,
    error,
    facetCounts,
    filters,
    setFilters,
    currentPage,
    totalPages,
    totalRecords,
    startRecord,
    endRecord,
    pageSize: PAGE_SIZE,
    setCurrentPage,
    refresh: loadData,
  };
}