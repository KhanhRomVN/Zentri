import { useState, useCallback } from 'react';
import { Plus, RefreshCw, Upload } from 'lucide-react';
import type { Proxy as ProxyType } from '../../types/db';
import { useProxyData } from './hooks/useProxyData';
import { Button } from '../../components/ui/Button';
import HeaderBar from '../../components/HeaderBar';
import StatsStrip from './components/StatsStrip';
import FilterPanel from './components/FilterPanel';
import ProxyTable from './components/ProxyTable';
import ProxyDrawer from './components/ProxyDrawer';
import ProxyModal from './components/ProxyModal';
import { toast } from 'sonner';

const Proxy = () => {
  const {
    proxies,
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
    setCurrentPage,
    refresh,
  } = useProxyData();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerProxy, setDrawerProxy] = useState<ProxyType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const timeout = setTimeout(() => {
        setFilters((prev) => ({ ...prev, searchQuery: value }));
      }, 140);
      return () => clearTimeout(timeout);
    },
    [setFilters],
  );

  const handleRowClick = useCallback((proxy: ProxyType) => {
    setDrawerProxy(proxy);
    setIsDrawerOpen(true);
  }, []);

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    for (const id of selectedIds) {
      try {
        // @ts-ignore
        await window.electron.ipcRenderer.invoke('proxy:delete', id);
      } catch {
        // continue
      }
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${count.toLocaleString()} proxies from registry`);
    refresh();
  };

  // Keyboard shortcut: / to focus search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('proxy-search')?.focus();
    }
  }, []);

  return (
    <div
      className="flex flex-col h-full w-full bg-background overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Top bar */}
      <HeaderBar title="Proxy" />

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden px-5 pt-5 border-r border-b border-border">
        {/* Page title */}
        <div className="flex items-end justify-between mb-4 shrink-0">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-text-primary tracking-tight">
              Proxy Registry
            </h1>
            <p className="text-[12.5px] text-text-secondary/60 mt-1">
              Manage your proxy infrastructure — monitor health, latency, and quota in real time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <Upload className="size-3.5" />
              Import
            </Button>
            <Button variant="solid" onClick={() => setIsModalOpen(true)}>
              <Plus className="size-3.5" />
              Add Proxy
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <StatsStrip proxies={proxies} />

        {/* Workspace: Facets + Table */}
        <div className="flex-1 flex gap-3.5 min-h-0 pb-4">
          {/* Filter Panel */}
          <FilterPanel facetCounts={facetCounts} filters={filters} onFiltersChange={setFilters} />

          {/* Table panel */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Bulk bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-teal/10 border-b border-border text-[12.5px] shrink-0">
                <span>
                  <b className="text-teal">{selectedIds.size.toLocaleString()}</b> proxies selected
                </span>
                <div className="flex-1" />
                <Button variant="outline" size="sm">
                  Test
                </Button>
                <Button variant="outline" size="sm">
                  Move to pool
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red hover:text-red"
                >
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-text-secondary/40">
                  <div className="size-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                    Loading Registry...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="text-sm text-red">{error}</p>
                  <Button variant="outline" size="sm" onClick={refresh}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <ProxyTable
                proxies={paginatedProxies}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={handleRowClick}
                onRefresh={refresh}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                totalRecords={totalRecords}
                startRecord={startRecord}
                endRecord={endRecord}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <ProxyDrawer
        isOpen={isDrawerOpen}
        proxy={drawerProxy}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Modal */}
      <ProxyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refresh} />
    </div>
  );
};

export default Proxy;
