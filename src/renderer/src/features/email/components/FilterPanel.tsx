/**
 * ------------------------------------------------------------------
 * FilterPanel
 * ------------------------------------------------------------------
 * Sidebar filter panel for the Email Manager. Provides faceted
 * filtering by linked services, visited websites, 2FA status, and
 * IP address.
 *
 * Main features:
 * - Services filter with dropdown + recent services
 * - 2FA filter (enabled / disabled)
 * - Websites visited filter with dropdown + recent websites
 * - IP filter with dropdown + recent IPs
 * - Clear all filters button
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useMemo, useState, useEffect } from 'react';

// ── UI ──
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from '@renderer/components/ui/Dropdown';

// ── Types ──
import { Account, Service } from '../types';
import { isValidTotp, parseBackupCodes } from './modals/EmailModal/Security/utils';
import { getCountryFlagComponent, getCountryName } from '../../../utils/countryFlags';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface EmailFilterState {
  serviceId: string | null;
  websiteUrl: string | null;
  twoFa: 'on' | 'off' | null;
  ip: string | null;
  running: boolean;
}

interface FilterPanelProps {
  accounts: Account[];
  onFiltersChange?: (filters: EmailFilterState) => void;
  onViewSelect?: (view: any) => void;
  selectedViewId?: string | null;
  runningCount?: number;
}

type SectionKey = 'services' | 'twofa' | 'websites' | 'ip' | 'badges';

// ─── Helpers ────────────────────────────────────────────────────────────
function hasAnyFilter(filters: EmailFilterState): boolean {
  return (
    filters.serviceId !== null ||
    filters.websiteUrl !== null ||
    filters.twoFa !== null ||
    filters.ip !== null ||
    filters.running
  );
}

// ─── Component ──────────────────────────────────────────────────────────
export default function FilterPanel({ accounts, onFiltersChange, runningCount = 0 }: FilterPanelProps) {
  // ── State ──
  const [filters, setFilters] = useState<EmailFilterState>({
    serviceId: null,
    websiteUrl: null,
    twoFa: null,
    ip: null,
    running: false,
  });
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(new Set());
  const [services, setServices] = useState<Service[]>([]);
  const [serviceTriggerId, setServiceTriggerId] = useState<string | null>(null);
  const [websiteTriggerUrl, setWebsiteTriggerUrl] = useState<string | null>(null);
  const [ipTrigger, setIpTrigger] = useState<string | null>(null);

  // ── Load services from database ──
  useEffect(() => {
    const loadServices = async () => {
      try {
        // @ts-ignore
        const dbServices = await window.electron.ipcRenderer.invoke('service:get-all');
        setServices(dbServices || []);
      } catch (err) {
        console.error('Failed to load services', err);
      }
    };
    loadServices();
  }, []);

  // ── Count accounts per service ──
  const serviceCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const account of accounts) {
      const linkedServices = account.services || [];
      for (const service of linkedServices) {
        counts[service.serviceId] = (counts[service.serviceId] || 0) + 1;
      }
    }
    return counts;
  }, [accounts]);

  // ── Collect recent services (by lastUsedAt across all accounts) ──
  const recentServices = useMemo<Service[]>(() => {
    const map = new Map<string, { service: Service; lastUsedAt: string }>();
    for (const account of accounts) {
      for (const s of account.services || []) {
        const existing = map.get(s.serviceId);
        if (!existing || (s.lastUsedAt || '') > existing.lastUsedAt) {
          const fullService = services.find((svc) => svc.id === s.serviceId) || (s as any);
          map.set(s.serviceId, { service: fullService, lastUsedAt: s.lastUsedAt || '' });
        }
      }
    }
    const sorted = [...map.values()]
      .filter((v) => v.lastUsedAt)
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
    const result = sorted.map((v) => v.service);
    // If less than 5, add services with most linked emails
    if (result.length < 5) {
      const existingIds = new Set(result.map((s) => s.id));
      const byCount = services
        .filter((s) => (serviceCounts[s.id] || 0) > 0 && !existingIds.has(s.id))
        .sort((a, b) => (serviceCounts[b.id] || 0) - (serviceCounts[a.id] || 0));
      result.push(...byCount);
    }
    return result.slice(0, 5);
  }, [accounts, services, serviceCounts]);

  // ── Collect websites from lastActivity ──
  const websiteCounts = useMemo<Record<string, { count: number; title: string }>>(() => {
    const counts: Record<string, { count: number; title: string }> = {};
    for (const account of accounts) {
      if (account.lastActivity && account.lastActivity.url) {
        const url = account.lastActivity.url;
        let title = account.lastActivity.title || url;
        const separators = [' - ', ' | ', ' – ', ' — '];
        for (const sep of separators) {
          if (title.includes(sep)) {
            title = title.split(sep)[0].trim();
            break;
          }
        }
        if (counts[url]) {
          counts[url].count++;
        } else {
          counts[url] = { count: 1, title };
        }
      }
    }
    return counts;
  }, [accounts]);

  // ── Collect recent websites (by time) ──
  const recentWebsites = useMemo(() => {
    const sorted = Object.entries(websiteCounts)
      .sort((a, b) => {
        const timeA = accounts.find((acc) => acc.lastActivity?.url === a[0])?.lastActivity?.time || 0;
        const timeB = accounts.find((acc) => acc.lastActivity?.url === b[0])?.lastActivity?.time || 0;
        return timeB - timeA;
      })
      .slice(0, 5);
    return sorted;
  }, [websiteCounts, accounts]);

  // ── Collect countries from lastFootprint ──
  const countryCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const account of accounts) {
      if (account.lastFootprint?.country) {
        counts[account.lastFootprint.country] = (counts[account.lastFootprint.country] || 0) + 1;
      }
    }
    return counts;
  }, [accounts]);

  const recentCountries = useMemo(() => {
    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [countryCounts]);

  // ── 2FA counts ──
  const twoFaCounts = useMemo(() => {
    let on = 0;
    let off = 0;
    for (const account of accounts) {
      const hasTotp = isValidTotp(account.totp);
      const hasBackup = parseBackupCodes(account.backup_codes).length > 0;
      if (hasTotp || hasBackup) on++;
      else off++;
    }
    return { on, off };
  }, [accounts]);

  // ── Handlers ──
  const toggleSection = (key: SectionKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleFiltersChange = (newFilters: EmailFilterState) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleClearAll = () => {
    handleFiltersChange({ serviceId: null, websiteUrl: null, twoFa: null, ip: null, running: false });
    setServiceTriggerId(null);
    setWebsiteTriggerUrl(null);
    setIpTrigger(null);
  };

  const handleServiceSelectFromDropdown = (serviceId: string) => {
    const newServiceId = filters.serviceId === serviceId ? null : serviceId;
    handleFiltersChange({ ...filters, serviceId: newServiceId });
    setServiceTriggerId(newServiceId);
  };

  const handleServiceSelectFromRecent = (serviceId: string) => {
    const newServiceId = filters.serviceId === serviceId ? null : serviceId;
    handleFiltersChange({ ...filters, serviceId: newServiceId });
    setServiceTriggerId(null);
  };

  const handleWebsiteSelectFromDropdown = (websiteUrl: string) => {
    const newWebsiteUrl = filters.websiteUrl === websiteUrl ? null : websiteUrl;
    handleFiltersChange({ ...filters, websiteUrl: newWebsiteUrl });
    setWebsiteTriggerUrl(newWebsiteUrl);
  };

  const handleWebsiteSelectFromRecent = (websiteUrl: string) => {
    const newWebsiteUrl = filters.websiteUrl === websiteUrl ? null : websiteUrl;
    handleFiltersChange({ ...filters, websiteUrl: newWebsiteUrl });
    setWebsiteTriggerUrl(null);
  };

  const handleIpSelectFromDropdown = (ip: string) => {
    const newIp = filters.ip === ip ? null : ip;
    handleFiltersChange({ ...filters, ip: newIp });
    setIpTrigger(newIp);
  };

  const handleIpSelectFromRecent = (ip: string) => {
    const newIp = filters.ip === ip ? null : ip;
    handleFiltersChange({ ...filters, ip: newIp });
    setIpTrigger(null);
  };

  const handleTwoFaSelect = (val: 'on' | 'off') => {
    const newVal = filters.twoFa === val ? null : val;
    handleFiltersChange({ ...filters, twoFa: newVal });
  };

  const handleRunningToggle = () => {
    handleFiltersChange({ ...filters, running: !filters.running });
  };

  // ── Render helpers ──
  const renderSectionHeader = (label: string, section: SectionKey) => {
    const hasFilter =
      (section === 'services' && filters.serviceId !== null) ||
      (section === 'twofa' && filters.twoFa !== null) ||
      (section === 'websites' && filters.websiteUrl !== null) ||
      (section === 'ip' && filters.ip !== null) ||
      (section === 'badges' && filters.running);
    const isCollapsed = collapsed.has(section);
    const Arrow = isCollapsed ? ChevronRight : ChevronDown;

    return (
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left py-2 px-3 cursor-pointer group hover:bg-card-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] uppercase tracking-wider text-text-secondary/60 font-bold">
            {label}
          </span>
          {hasFilter && (
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md leading-none min-w-[18px] text-center">
              1
            </span>
          )}
        </div>
        <Arrow className="size-3 text-text-secondary/40 group-hover:text-text-secondary/70 transition-colors shrink-0" />
      </button>
    );
  };

  const renderServiceItem = (service: Service, count: number, checked: boolean, fromDropdown = false) => {
    let hostname = '';
    try {
      if (service.url) hostname = new URL(service.url).hostname;
    } catch {
      hostname = '';
    }

    const content = (
      <>
        {hostname && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            className="w-4 h-4 opacity-70 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            alt=""
          />
        )}
        <span className="flex-1 truncate font-medium">{service.name}</span>
        <span className="font-mono text-[10.5px] text-text-secondary/60">
          {count.toLocaleString()}
        </span>
      </>
    );

    if (fromDropdown) {
      return (
        <DropdownItem
          key={service.id}
          onClick={() => handleServiceSelectFromDropdown(service.id)}
          className={checked ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}
        >
          {content}
        </DropdownItem>
      );
    }

    return (
      <button
        key={service.id}
        onClick={() => handleServiceSelectFromRecent(service.id)}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors w-full text-left ${
          checked
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'text-text-secondary hover:bg-card-hover'
        }`}
      >
        {content}
      </button>
    );
  };

  const renderWebsiteItem = (url: string, data: { count: number; title: string }, checked: boolean, fromDropdown = false) => {
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    const content = (
      <>
        <img
          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
          className="w-4 h-4 opacity-70 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          alt=""
        />
        <span className="flex-1 truncate font-medium" title={data.title}>
          {data.title}
        </span>
        <span className="font-mono text-[10.5px] text-text-secondary/60">
          {data.count.toLocaleString()}
        </span>
      </>
    );

    if (fromDropdown) {
      return (
        <DropdownItem
          key={url}
          onClick={() => handleWebsiteSelectFromDropdown(url)}
          className={checked ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}
        >
          {content}
        </DropdownItem>
      );
    }

    return (
      <button
        key={url}
        onClick={() => handleWebsiteSelectFromRecent(url)}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors w-full text-left ${
          checked
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'text-text-secondary hover:bg-card-hover'
        }`}
      >
        {content}
      </button>
    );
  };

  const renderCountryItem = (countryCode: string, count: number, checked: boolean, fromDropdown = false) => {
    const FlagComponent = getCountryFlagComponent(countryCode);
    const countryName = getCountryName(countryCode);

    const content = (
      <>
        {FlagComponent ? <FlagComponent className="w-4 h-3 rounded-sm shrink-0" /> : null}
        <span className="flex-1 truncate font-medium">{countryName}</span>
        <span className="font-mono text-[10.5px] text-text-secondary/60">
          {count.toLocaleString()}
        </span>
      </>
    );

    if (fromDropdown) {
      return (
        <DropdownItem
          key={countryCode}
          onClick={() => handleIpSelectFromDropdown(countryCode)}
          className={checked ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}
        >
          {content}
        </DropdownItem>
      );
    }

    return (
      <button
        key={countryCode}
        onClick={() => handleIpSelectFromRecent(countryCode)}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors w-full text-left ${
          checked
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'text-text-secondary hover:bg-card-hover'
        }`}
      >
        {content}
      </button>
    );
  };

  const selectedService = services.find((s) => s.id === serviceTriggerId) || null;
  const selectedWebsite =
    Object.entries(websiteCounts).find(([url]) => url === websiteTriggerUrl) || null;

  const visibleRecentServices = recentServices.filter((s) => s.id !== serviceTriggerId);
  const visibleRecentWebsites = recentWebsites.filter(([url]) => url !== websiteTriggerUrl);
  const visibleRecentCountries = recentCountries.filter(([countryCode]) => countryCode !== ipTrigger);

  // Filtering is handled internally by Dropdown searchable

  // ── Render ──
  return (
    <div className="w-[260px] shrink-0 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-[47px] px-3 py-1.5 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-wider text-text-secondary/60 font-bold">
          Filter
        </span>
        {hasAnyFilter(filters) && (
          <button
            onClick={handleClearAll}
            className="text-[11px] text-primary hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto space-y-3 flex-1">
        {/* Filter badges */}
        <div>
          {renderSectionHeader('Filter', 'badges')}
          {!collapsed.has('badges') && runningCount > 0 && (
            <div className="mt-1 px-3">
              <button
                onClick={handleRunningToggle}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  filters.running
                    ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15'
                }`}
              >
                Đang chạy browser [{runningCount}]
              </button>
            </div>
          )}
        </div>

        {/* Services */}
        <div>
          {renderSectionHeader('Services', 'services')}
          {!collapsed.has('services') && (
            <div className="mt-1 space-y-2 px-3">
              {/* Dropdown */}
              {services.length > 0 && (
                <Dropdown searchable className="w-full block">
                  <DropdownTrigger asChild>
                    <button className="flex items-center gap-2 w-full px-2 py-2 rounded-md cursor-pointer text-[12.5px] transition-colors hover:bg-card-hover text-left">
                      {selectedService ? (
                        <>
                          {(() => {
                            let hostname = '';
                            try {
                              if (selectedService.url) hostname = new URL(selectedService.url).hostname;
                            } catch {}
                            return hostname ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                className="w-4 h-4 shrink-0"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                alt=""
                              />
                            ) : null;
                          })()}
                          <span className="flex-1 truncate font-medium">{selectedService.name}</span>
                        </>
                      ) : (
                        <span className="flex-1 text-text-secondary/50 italic">Select service...</span>
                      )}
                      <ChevronDown className="size-3 text-text-secondary/40 shrink-0" />
                    </button>
                  </DropdownTrigger>
                  <DropdownContent className="max-h-[240px] overflow-y-auto">
                    {services
                      .filter((service) => serviceCounts[service.id] > 0)
                      .sort((a, b) => (serviceCounts[b.id] || 0) - (serviceCounts[a.id] || 0))
                      .map((service) =>
                        renderServiceItem(
                          service,
                          serviceCounts[service.id] || 0,
                          filters.serviceId === service.id,
                          true,
                        ),
                      )}
                  </DropdownContent>
                </Dropdown>
              )}

              {/* Recent services (max 5) */}
              <div className="space-y-0.5">
                {visibleRecentServices.length > 0 ? (
                  visibleRecentServices.map((service) =>
                    renderServiceItem(
                      service,
                      serviceCounts[service.id] || 0,
                      filters.serviceId === service.id,
                    ),
                  )
                ) : (
                  <div className="text-[11px] text-text-secondary/40 italic px-1.5 py-1">
                    No services linked
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2FA */}
        <div>
          {renderSectionHeader('2FA', 'twofa')}
          {!collapsed.has('twofa') && (
            <div className="mt-1 px-3 space-y-1">
              <button
                onClick={() => handleTwoFaSelect('on')}
                className={`flex items-center justify-between w-full py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors ${
                  filters.twoFa === 'on'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-card-hover'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-success"></span>
                  <span className="font-medium">Enabled</span>
                </span>
                <span className="font-mono text-[10.5px] text-text-secondary/60">
                  {twoFaCounts.on}
                </span>
              </button>
              <button
                onClick={() => handleTwoFaSelect('off')}
                className={`flex items-center justify-between w-full py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors ${
                  filters.twoFa === 'off'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-card-hover'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-error"></span>
                  <span className="font-medium">Disabled</span>
                </span>
                <span className="font-mono text-[10.5px] text-text-secondary/60">
                  {twoFaCounts.off}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Websites */}
        <div>
          {renderSectionHeader('Websites Visited', 'websites')}
          {!collapsed.has('websites') && (
            <div className="mt-1 space-y-2 px-3">
              {/* Dropdown */}
              {Object.keys(websiteCounts).length > 0 && (
                <Dropdown searchable className="w-full block">
                  <DropdownTrigger asChild>
                    <button className="flex items-center gap-2 w-full px-2 py-2 rounded-md cursor-pointer text-[12.5px] transition-colors hover:bg-card-hover text-left">
                      {selectedWebsite ? (
                        <>
                          {(() => {
                            let hostname = '';
                            try {
                              hostname = new URL(selectedWebsite[0]).hostname;
                            } catch {
                              hostname = selectedWebsite[0];
                            }
                            return (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                className="w-4 h-4 shrink-0"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                alt=""
                              />
                            );
                          })()}
                          <span className="flex-1 truncate font-medium" title={selectedWebsite[1].title}>
                            {selectedWebsite[1].title}
                          </span>
                        </>
                      ) : (
                        <span className="flex-1 text-text-secondary/50 italic">Select website...</span>
                      )}
                      <ChevronDown className="size-3 text-text-secondary/40 shrink-0" />
                    </button>
                  </DropdownTrigger>
                  <DropdownContent className="max-h-[240px] overflow-y-auto">
                    {Object.entries(websiteCounts)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([url, data]) => renderWebsiteItem(url, data, filters.websiteUrl === url, true))}
                  </DropdownContent>
                </Dropdown>
              )}

              {/* Recent websites (max 5) */}
              <div className="space-y-0.5">
                {visibleRecentWebsites.length > 0 ? (
                  visibleRecentWebsites.map(([url, data]) =>
                    renderWebsiteItem(url, data, filters.websiteUrl === url),
                  )
                ) : (
                  <div className="text-[11px] text-text-secondary/40 italic px-1.5 py-1">
                    No activity history
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          {renderSectionHeader('Country', 'ip')}
          {!collapsed.has('ip') && (
            <div className="mt-1 space-y-2 px-3">
              {/* Dropdown */}
              {Object.keys(countryCounts).length > 0 && (
                <Dropdown searchable className="w-full block">
                  <DropdownTrigger asChild>
                    <button className="flex items-center gap-2 w-full px-2 py-2 rounded-md cursor-pointer text-[12.5px] transition-colors hover:bg-card-hover text-left">
                      {ipTrigger ? (
                        <>
                          {(() => {
                            const FlagComponent = getCountryFlagComponent(ipTrigger);
                            return FlagComponent ? (
                              <FlagComponent className="w-4 h-3 rounded-sm shrink-0" />
                            ) : null;
                          })()}
                          <span className="flex-1 truncate font-medium">
                            {getCountryName(ipTrigger)}
                          </span>
                        </>
                      ) : (
                        <span className="flex-1 text-text-secondary/50 italic">Select Country...</span>
                      )}
                      <ChevronDown className="size-3 text-text-secondary/40 shrink-0" />
                    </button>
                  </DropdownTrigger>
                  <DropdownContent className="max-h-[240px] overflow-y-auto">
                    {Object.entries(countryCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([countryCode, count]) =>
                        renderCountryItem(countryCode, count, filters.ip === countryCode, true),
                      )}
                  </DropdownContent>
                </Dropdown>
              )}

              {/* Recent Countries (max 5) */}
              <div className="space-y-0.5">
                {visibleRecentCountries.length > 0 ? (
                  visibleRecentCountries.map(([countryCode, count]) =>
                    renderCountryItem(countryCode, count, filters.ip === countryCode),
                  )
                ) : (
                  <div className="text-[11px] text-text-secondary/40 italic px-1.5 py-1">
                    No country activity
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}