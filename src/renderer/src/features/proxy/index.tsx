import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, ChevronRight, AlertCircle } from 'lucide-react';
import { Proxy, ProxyFilterState } from './types';
import ProxyTable from './components/ProxyTable';
import ProxyFilter from './components/ProxyFilter';
import ProxyConfigForm from './components/ProxyConfigForm';
import SearchToolbar from '../search/components/SearchToolbar';
import { useProxyTableState } from './hooks/useProxyTableState';
import { PROXY_COLUMNS } from './constants';

const ProxyManager = () => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(true);

  const [filters, setFilters] = useState<ProxyFilterState>({
    searchQuery: '',
    proxyType: 'all',
    sourceType: 'all',
    protocol: 'all',
    status: 'all',
    country: 'all',
  });

  // Table state
  const availableColumns = useMemo(() => {
    return PROXY_COLUMNS.filter((c) => c.isVisible).map((c) => c.id);
  }, []);

  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useProxyTableState({
    viewId: 'proxy',
    defaultColumns: availableColumns,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('proxy:get-all');
      console.log('[ProxyManager] Loaded Data:', data);
      setProxies(data);
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

  // Automated Background Health Check
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (proxies.length === 0 || isConfiguring) return;

      const now = Date.now();
      proxies.forEach(async (proxy) => {
        if (!proxy.host || proxy.status === 'trash' || proxy.status === 'disabled') return;

        const expirationTime = proxy.expired_at ? new Date(proxy.expired_at).getTime() : Infinity;
        const timeToExpiration = expirationTime - now;
        const lastCheck = proxy.last_checked_at ? new Date(proxy.last_checked_at).getTime() : 0;
        const timeSinceLastCheck = now - lastCheck;

        // Auto-mark as expired if time is up
        if (timeToExpiration <= 0 && proxy.status !== 'expired') {
          try {
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('proxy:update', {
              id: proxy.id,
              data: { status: 'expired' },
            });
            setProxies((prev) =>
              prev.map((p) => (p.id === proxy.id ? { ...p, status: 'expired' } : p)),
            );
            return;
          } catch (e) {
            console.error('[Proxy] Expiry Update Error:', e);
          }
        }

        let shouldCheck = false;

        // Logic as requested by user
        if (timeToExpiration > 12 * 60 * 60 * 1000) {
          // > 12h
          if (timeSinceLastCheck > 6 * 60 * 60 * 1000) shouldCheck = true; // > 6h
        } else if (timeToExpiration > 1 * 60 * 60 * 1000) {
          // 1h - 12h
          if (timeSinceLastCheck > 1 * 60 * 60 * 1000) shouldCheck = true; // > 1h
        } else if (timeToExpiration > 10 * 60 * 1000) {
          // 10m - 1h
          if (timeSinceLastCheck > 15 * 60 * 1000) shouldCheck = true; // > 15m
        } else if (timeToExpiration > 0) {
          // < 10m
          if (timeSinceLastCheck > 1 * 60 * 1000) shouldCheck = true; // > 1m
        }

        if (shouldCheck) {
          try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('proxy:check', proxy);
            const isHealthy = result?.isHealthy ?? false;

            // @ts-ignore
            await window.electron.ipcRenderer.invoke('proxy:update', {
              id: proxy.id,
              data: {
                last_checked_at: new Date(now).toISOString(),
                isHealthy: isHealthy,
              },
            });

            // Update local state to show results immediately
            setProxies((prev) =>
              prev.map((p) =>
                p.id === proxy.id ? { ...p, last_checked_at: new Date(now).toISOString(), isHealthy: isHealthy } : p,
              ),
            );
          } catch (e) {
            console.error('[Proxy] Health Check Error:', e);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [proxies, isConfiguring]);

  const filteredProxies = useMemo(() => {
    return proxies.filter((p) => {
      const matchesSearch =
        !filters.searchQuery ||
        p.host?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.username?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.isp?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType = filters.proxyType === 'all' || p.proxyType === filters.proxyType;
      const matchesSource = filters.sourceType === 'all' || p.sourceType === filters.sourceType;
      const matchesProtocol = filters.protocol === 'all' || p.protocol === filters.protocol;
      const matchesStatus = filters.status === 'all' || p.status === filters.status;
      const matchesCountry = filters.country === 'all' || p.country === filters.country;

      return (
        matchesSearch &&
        matchesType &&
        matchesSource &&
        matchesProtocol &&
        matchesStatus &&
        matchesCountry
      );
    });
  }, [proxies, filters]);

  // Count active filters (excluding searchQuery and country which are handled differently)
  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.proxyType !== 'all') count++;
    if (filters.sourceType !== 'all') count++;
    if (filters.protocol !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.country !== 'all') count++;
    return count;
  }, [filters]);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden selection:bg-primary/10 transition-all duration-700">
      {/* Header - 48px height matching search feature */}
      <header className="h-[40px] shrink-0 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-all duration-500">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Reset selection or navigate to proxy home
            }}
            className="text-text-primary hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <ChevronRight className="w-4 h-4 text-text-primary" />
          <span className="text-text-primary text-sm font-semibold">Proxy</span>
          {selectedProxy && (
            <>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
              <span className="text-text-primary text-sm font-semibold">
                {selectedProxy.host}:{selectedProxy.port}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SearchToolbar
            filtersCount={filterCount}
            showFilterBar={showFilterBar}
            onToggleFilterBar={() => setShowFilterBar(!showFilterBar)}
            sorting={sorting}
            onSortingChange={setSorting}
            availableColumns={availableColumns}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            totalRecords={filteredProxies.length}
            onRefresh={handleRefresh}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Sidebar Filter */}
        {showFilterBar && (
          <ProxyFilter
            filters={filters}
            onFilterChange={setFilters}
            disabled={isConfiguring}
          />
        )}
        {/* Dynamic Content Panel */}
        <div className="flex-1 bg-card/30 overflow-hidden flex flex-col relative transition-all duration-700">
          {isConfiguring ? (
            <ProxyConfigForm
              proxy={selectedProxy}
              onClose={() => setIsConfiguring(false)}
              onSuccess={() => {
                setIsConfiguring(false);
                loadData();
              }}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-50">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                Booting Infrastructure Registry...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center bg-destructive/5">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-sm font-bold text-foreground">Sync Failure</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <button
                onClick={loadData}
                className="px-6 py-2.5 bg-background border border-border hover:bg-muted rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Retry Sync
              </button>
            </div>
          ) : (
            <ProxyTable
              proxies={filteredProxies}
              onEdit={(p) => {
                setSelectedProxy(p);
                setIsConfiguring(true);
              }}
              onRefresh={handleRefresh}
              sorting={sorting}
              onSortingChange={setSorting}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              columnSizing={columnSizing}
              onColumnSizingChange={setColumnSizing}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyManager;