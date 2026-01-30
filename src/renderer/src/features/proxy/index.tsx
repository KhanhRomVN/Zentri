import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  FileDown,
  Loader2,
  Wand2,
  Trash2,
  ShieldCheck,
  Save,
  X,
  Globe,
  ChevronDown,
  MapPin,
  Building2,
  Cpu,
  Fingerprint,
  ExternalLink,
  Clock,
  Hash,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import ProxySidebar from './components/ProxySidebar';
import ProxyTable from './components/ProxyTable';
import ProxyDrawer from './components/ProxyDrawer';
import Dropdown from '@renderer/shared/components/ui/dropdown/Dropdown';
import DropdownTrigger from '@renderer/shared/components/ui/dropdown/DropdownTrigger';
import DropdownContent from '@renderer/shared/components/ui/dropdown/DropdownContent';
import DropdownItem from '@renderer/shared/components/ui/dropdown/DropdownItem';
import { ProxyItem, ProxyType } from './types/types';
import { lookupIP } from './utils/ipLookup';
import { cn } from '@renderer/shared/lib/utils';
import hexToRgba from 'hex-to-rgba';

const ProxyPage: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState<ProxyItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Get primary color hex from CSS variable for hex-to-rgba
  const primaryHex = useMemo(() => {
    return (
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3686ff'
    );
  }, []);

  // Modal Add Proxy States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [manualData, setManualData] = useState({
    ip: '',
    port: '',
    type: 'HTTPS' as ProxyType,
    username: '',
    password: '',
  });
  const [checkResult, setCheckResult] = useState<any>(null);

  // States cho Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({
    status: [],
    type: [],
    country: [],
    provider: [],
  });
  const [sortBy, setSortBy] = useState('stt_asc');

  const gitlabFolder = useMemo(() => localStorage.getItem('gitlab_repo_folder'), []);

  const extractData = (res: any) => {
    if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
      return res.data;
    }
    return res;
  };

  // Sync Data Logic
  const loadProxies = async () => {
    if (!gitlabFolder) return;
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'proxies.json',
      );
      const data = extractData(result);
      if (data && Array.isArray(data)) {
        setProxies(data);
      } else {
        setProxies([]);
      }
    } catch (err) {
      console.error('Failed to load proxies:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProxies = async (data: ProxyItem[]) => {
    if (!gitlabFolder) return;
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'proxies.json',
        data: data,
      });
    } catch (err) {
      console.error('Failed to save proxies:', err);
    }
  };

  useEffect(() => {
    loadProxies();
  }, [gitlabFolder]);

  // Derived Data (Filter & Sort)
  const filteredProxies = useMemo(() => {
    return proxies
      .filter((p) => {
        const matchesSearch =
          p.proxy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.details?.ip?.includes(searchQuery);
        const matchesStatus = filters.status.length === 0 || filters.status.includes(p.status);
        const matchesType = filters.type.length === 0 || filters.type.includes(p.type);
        const matchesCountry = filters.country.length === 0 || filters.country.includes(p.country);
        const matchesProvider =
          filters.provider.length === 0 ||
          (p.details?.isp && filters.provider.includes(p.details.isp));

        return matchesSearch && matchesStatus && matchesType && matchesCountry && matchesProvider;
      })
      .sort((a, b) => {
        if (sortBy === 'stt_asc') return a.stt - b.stt;
        if (sortBy === 'stt_desc') return b.stt - a.stt;
        if (sortBy === 'expiry')
          return new Date(a.expired).getTime() - new Date(b.expired).getTime();
        return 0;
      });
  }, [proxies, searchQuery, filters, sortBy]);

  // Logic Modal Add Proxy
  const isManualDisabled = !!quickInput;
  const isQuickDisabled = !!(
    manualData.ip ||
    manualData.port ||
    manualData.username ||
    manualData.password
  );

  const handleQuickProcess = () => {
    if (!quickInput) return;
    const parts = quickInput.trim().split(':');
    if (parts.length >= 2) {
      const parsed = {
        ip: parts[0],
        port: parts[1],
        type: manualData.type,
        username: parts[2] || '',
        password: parts[3] || '',
      };
      setManualData(parsed);
      setQuickInput('');
      setCheckResult(null); // Clear previous check result when data changes
      return parsed;
    }
    return null;
  };

  const handleClearModal = () => {
    setQuickInput('');
    setManualData({
      ip: '',
      port: '',
      type: 'HTTPS',
      username: '',
      password: '',
    });
    setCheckResult(null);
  };

  const handleCheckProxy = async () => {
    let dataToCheck = { ...manualData };
    if (quickInput) {
      const parsed = handleQuickProcess();
      if (parsed) dataToCheck = parsed;
    }

    if (!dataToCheck.ip) return;

    setLoading(true);
    try {
      const details = await lookupIP(dataToCheck.ip);
      setCheckResult(details);
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProxy = async () => {
    let finalData = { ...manualData };
    if (quickInput) {
      const parsed = handleQuickProcess();
      if (parsed) finalData = parsed;
    }

    if (!finalData.ip) return;

    // Use existing checkResult if IP matches, otherwise use undefined or fetch (optional)
    const details = checkResult && checkResult.ip === finalData.ip ? checkResult : undefined;

    const newProxy: ProxyItem = {
      id: Date.now().toString(),
      stt: proxies.length + 1,
      proxy: `${finalData.ip}:${finalData.port}${finalData.username ? `:${finalData.username}:${finalData.password}` : ''}`,
      type: finalData.type,
      country: details?.country || 'Unknown',
      countryCode: details?.countryCode || '',
      expired: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: details ? (details.ip ? 'active' : 'error') : 'active',
      lastCheck: details ? new Date().toLocaleTimeString() : undefined,
      details: details,
    };

    const updated = [newProxy, ...proxies];
    setProxies(updated);
    saveProxies(updated);
    setIsModalOpen(false);
    handleClearModal();
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* 2 Panel Layout */}
      <ProxySidebar
        proxies={proxies}
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Content - height h-16 (đồng bộ với Sidebar Header) */}
        <header className="h-16 shrink-0 border-b border-border bg-background/50 px-6 flex items-center justify-between">
          <div className="flex items-center flex-1">
            {/* Search Bar - Tăng width */}
            <div className="relative group w-[500px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Fast search IP, address, hostname or provider..."
                className="w-full h-10 pl-11 pr-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all font-medium shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button className="h-10 px-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
              </button>
            )}
            <button
              onClick={loadProxies}
              className="h-10 px-4 border border-border rounded-md text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all flex items-center gap-2"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />{' '}
              {loading ? 'Loading...' : 'Sync'}
            </button>
            <button className="h-10 px-4 border border-border rounded-md text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all flex items-center gap-2">
              <FileDown className="w-3.5 h-3.5" /> Export
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => {
                handleClearModal();
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="h-10 px-5 rounded-md text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg"
              style={{
                color: primaryHex,
                backgroundColor: hexToRgba(primaryHex, 0.15),
              }}
            >
              <Plus className="w-4 h-4" /> Add Proxy
            </button>
          </div>
        </header>

        {/* Proxy Table */}
        <ProxyTable
          proxies={filteredProxies}
          onProxySelect={(p) => {
            setSelectedProxy(p);
            setIsDrawerOpen(true);
          }}
          selectedProxyId={selectedProxy?.id}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
            )
          }
          onToggleAll={() =>
            setSelectedIds(
              selectedIds.length === filteredProxies.length ? [] : filteredProxies.map((p) => p.id),
            )
          }
        />
      </div>

      {/* Detail Drawer */}
      <ProxyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        proxy={selectedProxy}
      />

      {/* Modal Add Proxy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className={cn(
              'relative w-full bg-background border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 transition-all',
              checkResult ? 'max-w-4xl' : 'max-w-xl',
            )}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Add New Proxy</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ height: '600px' }}>
              {/* Left Column: Form Inputs */}
              <div className={cn('p-8 flex-1 overflow-y-auto', checkResult ? 'w-1/2' : 'w-full')}>
                <div className="space-y-8 pb-12">
                  {/* Quick Input Section */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Quick Import
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1 group">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          placeholder="ip:port:user:pass or ip:port"
                          className="w-full h-11 pl-11 pr-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          value={quickInput}
                          onChange={(e) => setQuickInput(e.target.value)}
                          disabled={isQuickDisabled}
                        />
                      </div>
                      <button
                        onClick={handleQuickProcess}
                        disabled={!quickInput || isQuickDisabled}
                        className="h-11 px-4 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-all disabled:opacity-30 flex items-center gap-2 group"
                        title="Process & Split"
                      >
                        <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span className="text-xs font-bold">Process</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50"></div>
                    </div>
                    <span className="relative px-4 bg-background text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Or manual input
                    </span>
                  </div>

                  {/* Manual Inputs Grid */}
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-8 space-y-2">
                      <label className="text-xs font-semibold px-1">IP Address</label>
                      <input
                        type="text"
                        placeholder="192.168.1.1"
                        className="w-full h-11 px-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all disabled:opacity-50"
                        value={manualData.ip}
                        onChange={(e) => setManualData({ ...manualData, ip: e.target.value })}
                        disabled={isManualDisabled}
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-xs font-semibold px-1">Port</label>
                      <input
                        type="text"
                        placeholder="8080"
                        className="w-full h-11 px-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all disabled:opacity-50"
                        value={manualData.port}
                        onChange={(e) => setManualData({ ...manualData, port: e.target.value })}
                        disabled={isManualDisabled}
                      />
                    </div>
                    <div className="col-span-12 grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold px-1">Proxy Type</label>
                        <Dropdown className="w-full" disabled={isManualDisabled}>
                          <DropdownTrigger className="w-full">
                            <div
                              className={cn(
                                'w-full h-11 px-4 bg-input border border-border rounded-md text-sm flex items-center justify-between transition-all cursor-pointer hover:border-border-hover group',
                                isManualDisabled && 'opacity-50 cursor-not-allowed',
                              )}
                            >
                              <span>{manualData.type}</span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                          </DropdownTrigger>
                          <DropdownContent className="w-full" minWidth="200px">
                            {['HTTPS', 'SOCKS5', 'SOCKS4'].map((t) => (
                              <DropdownItem
                                key={t}
                                onClick={() =>
                                  setManualData({ ...manualData, type: t as ProxyType })
                                }
                              >
                                {t}
                              </DropdownItem>
                            ))}
                          </DropdownContent>
                        </Dropdown>
                      </div>
                      <div />
                    </div>
                    <div className="col-span-6 space-y-2">
                      <label className="text-xs font-semibold px-1">Username (Optional)</label>
                      <input
                        type="text"
                        placeholder="admin"
                        className="w-full h-11 px-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all disabled:opacity-50"
                        value={manualData.username}
                        onChange={(e) => setManualData({ ...manualData, username: e.target.value })}
                        disabled={isManualDisabled}
                      />
                    </div>
                    <div className="col-span-6 space-y-2">
                      <label className="text-xs font-semibold px-1">Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="••••••"
                        className="w-full h-11 px-4 bg-input border border-border rounded-md text-sm outline-none focus:border-border-focus transition-all disabled:opacity-50"
                        value={manualData.password}
                        onChange={(e) => setManualData({ ...manualData, password: e.target.value })}
                        disabled={isManualDisabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Check Result Panel */}
              {checkResult && (
                <div className="w-1/2 border-l border-border bg-muted/5 overflow-y-auto">
                  <div className="p-8 space-y-6 animate-in slide-in-from-right-10 duration-500 pb-16">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Network Intelligence
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>

                    {/* IP & Country */}
                    <div className="p-4 bg-background border border-border rounded-md space-y-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                          <Fingerprint className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                            IP Address
                          </p>
                          <p className="text-sm font-bold text-foreground font-mono">
                            {checkResult.ip}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center text-red-500">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                            Location
                          </p>
                          <div className="flex items-center gap-2">
                            {checkResult.countryCode && (
                              <img
                                src={`https://flagcdn.com/w20/${checkResult.countryCode.toLowerCase()}.png`}
                                className="w-4 h-3 rounded-sm"
                              />
                            )}
                            <p className="text-sm font-bold text-foreground italic">
                              {checkResult.country || checkResult.city || 'Unknown'}
                            </p>
                          </div>
                          {checkResult.city && checkResult.region && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {checkResult.city}, {checkResult.region}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Provider Info */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-md shadow-sm">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            Internet Service Provider
                          </p>
                          <p
                            className="text-xs font-semibold text-foreground truncate"
                            title={checkResult.isp || checkResult.org}
                          >
                            {checkResult.isp || checkResult.org || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-md shadow-sm">
                          <Cpu className="w-4 h-4 text-purple-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">
                              ASN
                            </p>
                            <p className="text-xs font-semibold text-foreground truncate">
                              {checkResult.asn || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-md shadow-sm">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">
                              Timezone
                            </p>
                            <p className="text-xs font-semibold text-foreground truncate">
                              {checkResult.timezone || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-md shadow-sm">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            Hostname
                          </p>
                          <p className="text-xs font-semibold text-foreground truncate font-mono">
                            {checkResult.hostname || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Advanced RDAP Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-background/50 border border-border rounded-md shadow-sm border-dashed">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">
                              Network Range
                            </p>
                            <p className="text-[10px] font-bold text-foreground truncate font-mono">
                              {checkResult.networkRange || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-background/50 border border-border rounded-md shadow-sm border-dashed">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">
                              Registered At
                            </p>
                            <p className="text-[10px] font-bold text-foreground truncate">
                              {checkResult.registeredAt || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {checkResult.abuseContact && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-md">
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-rose-500/70 uppercase">
                              Abuse Contact
                            </p>
                            <p className="text-[10px] font-bold text-rose-600 truncate">
                              {checkResult.abuseContact}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-md space-y-1">
                      <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Usage
                        Status
                      </div>
                      <p className="text-[11px] text-blue-600/80 font-medium italic">
                        This proxy is identified as{' '}
                        {checkResult.usageType?.toLowerCase() || 'general purpose'} network.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={handleClearModal}
                  className="p-3 h-11 border border-border rounded-md hover:bg-muted text-muted-foreground transition-all flex items-center gap-2"
                  title="Clear All"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCheckProxy}
                  disabled={loading || (!quickInput && (!manualData.ip || !manualData.port))}
                  className="h-11 px-6 bg-input border border-border rounded-md text-sm font-bold hover:bg-muted transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                  Check Proxy
                </button>
                <button
                  onClick={handleSaveProxy}
                  disabled={loading || (!quickInput && (!manualData.ip || !manualData.port))}
                  className="h-11 px-8 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30"
                >
                  <Save className="w-4 h-4" />
                  Save Proxy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyPage;
