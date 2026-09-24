/**
 * ------------------------------------------------------------------
 * FootprintTable
 * ------------------------------------------------------------------
 * Digital footprint dashboard for an email account.
 * Shows visited websites with security scoring.
 *
 * Layout (top to bottom):
 *   - Toolbar with searchbar (left) + EmptyState placeholder (right)
 *   - Table of visited websites with favicon, score, IP, FP, last seen
 *   - Click a row → toggles detail panel with fade animation
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// ── UI ──
import { Shield, Globe, Search, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ── Utils ──
import { cn } from '../../../../../../shared/lib/utils';

// ── UI Components ──
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { Checkbox } from '../../../../../../components/ui/Checkbox/Checkbox';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../../../../components/ui/Dropdown';

// ── Modal Component ──
import FootprintModal from './FootprintModal';
export interface FingerprintEntry {
  id: string;
  domain: string;
  fingerprint_hash: string;
  fingerprint_config_json: string | null;
  public_ip: string;
  ip_info_json: string | null;
  started_at: string;
  ended_at: string | null;
}

interface FootprintTableProps {
  email: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────
export function getDomainScore(entries: FingerprintEntry[]): number {
  const uniqueIps = new Set(entries.map((e) => e.public_ip));
  const uniqueHashes = new Set(entries.map((e) => e.fingerprint_hash));
  const hasActive = entries.some((e) => !e.ended_at);

  let score = 0;
  score += uniqueIps.size === 1 ? 40 : Math.max(0, 40 - (uniqueIps.size - 1) * 15);
  score += uniqueHashes.size === 1 ? 40 : Math.max(0, 40 - (uniqueHashes.size - 1) * 15);
  if (hasActive) score += 20;

  return Math.min(score, 100);
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function parseIpInfo(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function parseFingerprintConfig(json: string | null): Record<string, any> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function countryCodeToFlag(code: string | undefined): string {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

// Calculate sync status based on REAL cookie validation from profile.
// daysRemaining is derived from the actual nearest cookie expires_utc
// (returned by the main process) — not a guessed fixed window.
function getSyncStatus(
  entries: FingerprintEntry[],
  domain: string,
  domainLoginStatus: Map<string, { hasSession: boolean; expiresAt: string | null }>,
): {
  status: 'active' | 'expiring' | 'expired';
  label: string;
  daysRemaining: number | null;
} {
  // Check real cookie status for this specific domain
  const info = domainLoginStatus.get(domain);

  if (!info) {
    // Still checking or no data yet
    return { status: 'expired', label: 'Checking...', daysRemaining: null };
  }

  if (info.hasSession) {
    if (info.expiresAt) {
      // Persistent cookie with a real expiry — count down from it.
      const daysRemaining = Math.ceil(
        (new Date(info.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      if (daysRemaining > 14) {
        return { status: 'active', label: 'Active', daysRemaining };
      } else if (daysRemaining > 0) {
        return { status: 'expiring', label: `${daysRemaining}d left`, daysRemaining };
      }
      return { status: 'expired', label: 'Expired', daysRemaining: 0 };
    }
    // Only session cookies (no fixed expiry) — valid until browser closes.
    return { status: 'active', label: 'Active (session)', daysRemaining: null };
  } else {
    // No valid cookies - logged out
    const lastEntry = entries[entries.length - 1];
    if (lastEntry?.ended_at) {
      const endedAt = new Date(lastEntry.ended_at);
      const now = new Date();
      const daysSinceEnd = Math.floor((now.getTime() - endedAt.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'expired', label: `Logout ${daysSinceEnd}d ago`, daysRemaining: null };
    }
    return { status: 'expired', label: 'Not logged in', daysRemaining: null };
  }
}

// ─── Component ──────────────────────────────────────────────────────────
export default function FootprintTable({ email }: FootprintTableProps) {
  const [entries, setEntries] = useState<FingerprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainLoginStatus, setDomainLoginStatus] = useState<
    Map<string, { hasSession: boolean; expiresAt: string | null }>
  >(new Map());
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; domain: string } | null>(
    null,
  );

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    window.electron.ipcRenderer
      .invoke('email:get-fingerprint-history', { email })
      .then((res: any) => {
        if (res?.success) setEntries(res.entries || []);
      })
      .finally(() => setLoading(false));
  }, [email]);

  // Check login status for ALL domains (not just Google)
  useEffect(() => {
    if (!email || entries.length === 0) return;

    const checkDomainSessions = async () => {
      try {
        // Get unique domains from entries
        const domains = Array.from(new Set(entries.map((e) => e.domain)));

        // Check each domain
        const results = await Promise.all(
          domains.map(async (domain) => {
            const result: any = await window.electron.ipcRenderer.invoke(
              'email:check-domain-session',
              { email, domain },
            );
            return { domain, result };
          }),
        );

        // Update status map
        setDomainLoginStatus((prev) => {
          const newMap = new Map(prev);
          results.forEach(({ domain, result }) => {
            if (result?.success) {
              newMap.set(domain, {
                hasSession: result.hasSession,
                expiresAt: result.nearestExpiryUtc ?? null,
              });
            }
          });
          return newMap;
        });
      } catch (error) {
        console.error('Failed to check domain sessions:', error);
      }
    };

    checkDomainSessions();
    // Re-check every 5 minutes
    const interval = setInterval(checkDomainSessions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [email, entries]);

  // Group by domain
  const grouped = useMemo(() => {
    const map = new Map<string, FingerprintEntry[]>();
    for (const e of entries) {
      const list = map.get(e.domain) || [];
      list.push(e);
      map.set(e.domain, list);
    }
    return map;
  }, [entries]);

  // Per-domain stats
  const domainStats = useMemo(() => {
    const result: Array<{
      domain: string;
      entries: FingerprintEntry[];
      score: number;
      uniqueIps: number;
      uniqueHashes: number;
      lastSeen: string;
      active: boolean;
      syncStatus: ReturnType<typeof getSyncStatus>;
    }> = [];
    for (const [domain, domainEntries] of grouped) {
      const uniqueIps = new Set(domainEntries.map((e) => e.public_ip)).size;
      const uniqueHashes = new Set(domainEntries.map((e) => e.fingerprint_hash)).size;
      const active = domainEntries.some((e) => !e.ended_at);
      const lastEntry = domainEntries[domainEntries.length - 1];
      const syncStatus = getSyncStatus(domainEntries, domain, domainLoginStatus);
      result.push({
        domain,
        entries: domainEntries,
        score: getDomainScore(domainEntries),
        uniqueIps,
        uniqueHashes,
        lastSeen: lastEntry.started_at,
        active,
        syncStatus,
      });
    }
    return result.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  }, [grouped, domainLoginStatus]);

  // Filter by search query
  const filteredDomainStats = useMemo(() => {
    if (!searchQuery.trim()) return domainStats;
    const q = searchQuery.toLowerCase();
    return domainStats.filter((d) => d.domain.toLowerCase().includes(q));
  }, [domainStats, searchQuery]);

  const handleRowClick = (domain: string) => {
    // Mở modal thay vì toggle detail panel
    setSelectedDomain(domain);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing selectedDomain để animation chạy mượt
    setTimeout(() => setSelectedDomain(null), 200);
  };

  const toggleCheckbox = (domain: string) => {
    setSelectedCheckboxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  };

  const toggleAllCheckboxes = () => {
    if (selectedCheckboxes.size === filteredDomainStats.length) {
      setSelectedCheckboxes(new Set());
    } else {
      setSelectedCheckboxes(new Set(filteredDomainStats.map((d) => d.domain)));
    }
  };

  const handleDeleteSession = async (id: string) => {
    const res: any = await window.electron.ipcRenderer.invoke('email:delete-fingerprint-history', {
      email,
      id,
    });
    if (res?.success) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, domain: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, domain });
  };

  // Best-effort session renewal: reopens the profile headlessly with the
  // domain's stored fingerprint (no proxy — not persisted in history),
  // waits for the site's own JS to refresh cookies, then re-checks the
  // real cookie expiry so the Sync column reflects the actual result.
  const handleRenewSession = async (domain: string) => {
    const domainEntries = grouped.get(domain) || [];
    const latestEntry = domainEntries[domainEntries.length - 1];
    const fingerprintConfig = latestEntry
      ? parseFingerprintConfig(latestEntry.fingerprint_config_json)
      : undefined;

    toast.info(`Renewing session for ${domain}…`);
    try {
      const res: any = await window.electron.ipcRenderer.invoke('email:renew-session', {
        email,
        domain,
        fingerprintConfig,
      });

      if (!res?.success) {
        toast.error(`Failed to renew ${domain}: ${res?.error || 'unknown error'}`);
        return;
      }

      const checkRes: any = await window.electron.ipcRenderer.invoke(
        'email:check-domain-session',
        { email, domain },
      );
      if (checkRes?.success) {
        setDomainLoginStatus((prev) => {
          const newMap = new Map(prev);
          newMap.set(domain, {
            hasSession: checkRes.hasSession,
            expiresAt: checkRes.nearestExpiryUtc ?? null,
          });
          return newMap;
        });
      }

      toast.success(`Renewed ${domain}`);
    } catch (err) {
      console.error('[FootprintTable] Renew session error:', err);
      toast.error(`Failed to renew ${domain}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading footprint data...
      </div>
    );
  }

  if (domainStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Shield className="w-10 h-10 opacity-30" />
        <p className="text-sm">No footprint data yet</p>
        <p className="text-xs opacity-60">
          Data will appear when you browse websites with a fingerprint profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border shrink-0 bg-background/20 backdrop-blur-sm">
        {/* Searchbar bên trái */}
        <div className="flex items-center gap-2 bg-input-background border border-border rounded-lg px-2.5 py-1.5 flex-1 max-w-[420px]">
          <Search className="size-3.5 text-text-secondary/60 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search website…"
            className="bg-transparent border-none outline-none text-text-primary text-[12.5px] w-full font-sans placeholder:text-text-secondary/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors shrink-0"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* EmptyState bên phải */}
        <div className="flex items-center gap-1.5 ml-auto text-[10px] font-mono text-muted-foreground/30 whitespace-nowrap">
          <span>{filteredDomainStats.length} websites</span>
        </div>
      </div>

      {/* ── Table container ── */}
      <div className="flex-1 min-h-0 overflow-y-scroll overscroll-contain custom-scrollbar">
        <table className="w-full text-left">
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-table-header-background shadow-sm">
            <tr className="border-b border-border/50">
              <th className="px-2 py-2.5 text-[13px] font-semibold text-text-secondary/80">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={
                      filteredDomainStats.length > 0 &&
                      selectedCheckboxes.size === filteredDomainStats.length
                    }
                    onChange={toggleAllCheckboxes}
                    size="sm"
                  />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-text-secondary/80">
                Domain
              </th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-text-secondary/80">IP</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-text-secondary/80">
                Fingerprint
              </th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-text-secondary/80 text-center">
                Sync
              </th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-text-secondary/80 text-center">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDomainStats.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <EmptyState
                    icon={<Globe className="w-10 h-10 text-primary/30" />}
                    title="No results"
                    description="No websites match your search query."
                  />
                </td>
              </tr>
            ) : (
              filteredDomainStats.map((stat) => {
                const isSelected = selectedCheckboxes.has(stat.domain);
                const latestEntry = stat.entries[0];
                const latestIpInfo = parseIpInfo(latestEntry?.ip_info_json);
                const latestConfig = parseFingerprintConfig(latestEntry?.fingerprint_config_json);

                // Calculate time ago
                const now = new Date();
                const lastSeenDate = new Date(stat.lastSeen);
                const diffMs = now.getTime() - lastSeenDate.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                let timeAgo = '';
                if (diffMins < 60) {
                  timeAgo = `${diffMins}m ago`;
                } else if (diffHours < 24) {
                  timeAgo = `${diffHours}h ago`;
                } else {
                  timeAgo = `${diffDays}d ago`;
                }

                // Browser detection
                const browser = latestConfig.userAgent?.includes('Chrome')
                  ? 'Chrome'
                  : latestConfig.userAgent?.includes('Firefox')
                    ? 'Firefox'
                    : latestConfig.userAgent?.includes('Safari')
                      ? 'Safari'
                      : 'Unknown';

                // Risk calculation based on multiple factors
                let riskScore = 0;
                if (stat.uniqueIps > 2) riskScore += 2;
                if (stat.uniqueIps > 5) riskScore += 3;
                if (stat.uniqueHashes > 2) riskScore += 2;
                if (stat.uniqueHashes > 3) riskScore += 2;
                if (stat.syncStatus.status === 'expired') riskScore += 1;

                return (
                  <tr
                    key={stat.domain}
                    className={cn(
                      'cursor-pointer border-b border-border/40 last:border-b-0 transition-colors hover:bg-muted/20',
                      isSelected && 'bg-primary/5',
                    )}
                    onContextMenu={(e) => handleContextMenu(e, stat.domain)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-2 py-2.5"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleCheckbox(stat.domain)}
                        size="sm"
                      />
                    </td>

                    {/* Domain Column - 2 lines */}
                    <td className="px-4 py-2.5" onClick={() => handleRowClick(stat.domain)}>
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={getFaviconUrl(stat.domain)}
                          alt=""
                          className="w-4 h-4 rounded-sm shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="text-[13px] font-semibold text-text-primary truncate">
                          {stat.domain}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary/60">
                        {stat.entries.length} visited · {timeAgo}
                      </div>
                    </td>

                    {/* IP Column - 2 lines */}
                    <td className="px-4 py-2.5" onClick={() => handleRowClick(stat.domain)}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-lg leading-none">
                          {countryCodeToFlag(latestIpInfo.countryCode)}
                        </span>
                        <span className="text-[12px] font-medium text-text-primary truncate">
                          {latestIpInfo.countryCode || '??'} · {latestIpInfo.city || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary/60 truncate">
                        {latestIpInfo.isp || 'Unknown ISP'}
                      </div>
                    </td>

                    {/* Fingerprint Column - 2 lines */}
                    <td className="px-4 py-2.5" onClick={() => handleRowClick(stat.domain)}>
                      <div className="text-[12px] font-medium text-text-primary mb-1 truncate">
                        {latestConfig.platform || 'Unknown'} · {browser}
                      </div>
                      <div className="text-[11px] text-text-secondary/60">
                        {latestConfig.screenWidth || '?'}×{latestConfig.screenHeight || '?'} ·{' '}
                        {latestConfig.hardwareConcurrency || '?'} cores
                      </div>
                    </td>

                    {/* Sync Status Column */}
                    <td
                      className="px-4 py-2.5 text-center"
                      onClick={() => handleRowClick(stat.domain)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold',
                            stat.syncStatus.status === 'active' && 'bg-green/10 text-green',
                            stat.syncStatus.status === 'expiring' && 'bg-warn/10 text-warn',
                            stat.syncStatus.status === 'expired' && 'bg-red/10 text-red',
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              stat.syncStatus.status === 'active' && 'bg-green',
                              stat.syncStatus.status === 'expiring' && 'bg-warn',
                              stat.syncStatus.status === 'expired' && 'bg-red',
                            )}
                          />
                          {stat.syncStatus.label}
                        </span>
                        {stat.syncStatus.daysRemaining !== null && (
                          <span className="text-[10px] text-text-secondary/50">
                            {stat.syncStatus.daysRemaining}d left
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk Column */}
                    <td
                      className="px-4 py-2.5 text-center"
                      onClick={() => handleRowClick(stat.domain)}
                    >
                      {riskScore > 0 ? (
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-[24px] h-[24px] px-2 rounded-md text-xs font-bold',
                            riskScore >= 5
                              ? 'bg-red/20 text-red'
                              : riskScore >= 3
                                ? 'bg-warn/20 text-warn'
                                : 'bg-primary/20 text-primary',
                          )}
                        >
                          {riskScore}
                        </span>
                      ) : (
                        <span className="text-xs text-text-secondary/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedDomain && (
        <FootprintModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          domain={selectedDomain}
          entries={domainStats.find((d) => d.domain === selectedDomain)?.entries || []}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Row Context Menu */}
      {contextMenu &&
        createPortal(
          <Dropdown
            open={true}
            onOpenChange={() => setContextMenu(null)}
            position={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <DropdownTrigger asChild>
              <div className="fixed" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                icon={<RefreshCw className="size-3.5" />}
                onClick={() => {
                  const domain = contextMenu.domain;
                  setContextMenu(null);
                  handleRenewSession(domain);
                }}
              >
                Renew Session
              </DropdownItem>
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}
    </div>
  );
}
