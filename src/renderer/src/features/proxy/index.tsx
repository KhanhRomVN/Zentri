import { useState, useEffect, useCallback, useMemo, SetStateAction } from 'react';
import { Plus, Search, LayoutGrid, Loader2, AlertCircle } from 'lucide-react';
import { Proxy, ProxyFilterState } from './types';
import ProxyTable from './components/ProxyTable';
import ProxyFilter from './components/ProxyFilter';
import ProxyConfigForm from './components/ProxyConfigForm';
import { Breadcrumb, BreadcrumbItem } from '../../shared/components/ui/breadcumb';
import Input from '../../shared/components/ui/input/Input';
import Toast from '../../shared/components/ui/Toast';

const ProxyManager = () => {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);

  const [filters, setFilters] = useState<ProxyFilterState>({
    searchQuery: '',
    proxyType: 'all',
    sourceType: 'all',
    protocol: 'all',
    status: 'all',
    country: 'all',
  });

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('proxy:get-all');
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

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden selection:bg-primary/10 transition-all duration-700">
      {/* Dynamic Header */}
      {!isConfiguring && (
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-4">
            <Breadcrumb className="mb-0" size={120}>
              <BreadcrumbItem
                icon={LayoutGrid}
                className="hover:text-foreground text-muted-foreground/50 transition-colors"
                text={''}
              />
              <BreadcrumbItem text="Network Infrastructure" />
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-80 flex items-center transition-all duration-500">
              <Input
                size="sm"
                placeholder="Scan infrastructure (Host, User, ISP)..."
                leftIcon={Search}
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="!h-9 bg-muted/5 border-border/10 focus:bg-muted/10 transition-all duration-300 rounded-xl translate-y-[1px]"
              />
            </div>

            <button
              onClick={() => {
                setSelectedProxy(null);
                setIsConfiguring(true);
              }}
              className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-90 border border-primary/20 group shadow-lg shadow-primary/5"
              title="Initialize Provisioning"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-500" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Sidebar Filter with Status Control */}
        <ProxyFilter filters={filters} onFilterChange={setFilters} disabled={isConfiguring} />
        {/* Dynamic Content Panel */}
        <div className="flex-1 bg-card/30 overflow-hidden flex flex-col relative transition-all duration-700">
          {isConfiguring ? (
            <ProxyConfigForm
              proxy={selectedProxy}
              onClose={() => setIsConfiguring(false)}
              onSuccess={() => {
                setIsConfiguring(false);
                loadData();
                setToast({
                  visible: true,
                  message: selectedProxy
                    ? 'Infrastructure node upgraded successfully'
                    : 'Gateway provisioning sequence complete',
                  type: 'success',
                });
              }}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground opacity-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
              onEdit={(p: SetStateAction<Proxy | null>) => {
                setSelectedProxy(p);
                setIsConfiguring(true);
              }}
              onRefresh={loadData}
            />
          )}
        </div>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default ProxyManager;
