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
import { Fragment, useEffect, useMemo, useState } from 'react';

// ── UI ──
import { Shield, Globe, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ── Utils ──
import { format } from 'date-fns';
import { cn } from '../../../../../shared/lib/utils';

// ── UI Components ──
import { EmptyState } from '../../../../../components/ui/EmptyState';

// ── Detail Component ──
import FootprintDetail from './FootprintDetail';

// ─── Interfaces ─────────────────────────────────────────────────────────
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

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green';
  if (score >= 50) return 'text-warn';
  return 'text-red';
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// ─── Component ──────────────────────────────────────────────────────────
export default function FootprintTable({ email }: FootprintTableProps) {
  const [entries, setEntries] = useState<FingerprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    }> = [];
    for (const [domain, domainEntries] of grouped) {
      const uniqueIps = new Set(domainEntries.map((e) => e.public_ip)).size;
      const uniqueHashes = new Set(domainEntries.map((e) => e.fingerprint_hash)).size;
      const active = domainEntries.some((e) => !e.ended_at);
      const lastEntry = domainEntries[domainEntries.length - 1];
      result.push({
        domain,
        entries: domainEntries,
        score: getDomainScore(domainEntries),
        uniqueIps,
        uniqueHashes,
        lastSeen: lastEntry.started_at,
        active,
      });
    }
    return result.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  }, [grouped]);

  // Filter by search query
  const filteredDomainStats = useMemo(() => {
    if (!searchQuery.trim()) return domainStats;
    const q = searchQuery.toLowerCase();
    return domainStats.filter((d) => d.domain.toLowerCase().includes(q));
  }, [domainStats, searchQuery]);

  const selectedStats = selectedDomain
    ? domainStats.find((d) => d.domain === selectedDomain)
    : null;

  // Put selected domain on top, keep the rest in original order
  const orderedDomainStats = useMemo(() => {
    if (!selectedDomain) return filteredDomainStats;
    return [
      ...filteredDomainStats.filter((d) => d.domain === selectedDomain),
      ...filteredDomainStats.filter((d) => d.domain !== selectedDomain),
    ];
  }, [filteredDomainStats, selectedDomain]);

  const handleRowClick = (domain: string) => {
    // Toggle: if clicking the same row, hide detail
    setSelectedDomain((prev) => (prev === domain ? null : domain));
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
        <table className="w-full text-left table-fixed">
          <thead className="sticky top-0 z-10 bg-table-header-background shadow-sm">
            <tr className="border-b border-border/50">
              <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-secondary/60 w-[35%]">
                Website
              </th>
              <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-secondary/60 text-center w-[10%]">
                Score
              </th>
              <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-secondary/60 text-center w-[8%]">
                IP
              </th>
              <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-secondary/60 text-center w-[8%]">
                FP
              </th>
              <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-secondary/60 w-[25%]">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDomainStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8">
                  <EmptyState
                    icon={<Globe className="w-10 h-10 text-primary/30" />}
                    title="No results"
                    description="No websites match your search query."
                  />
                </td>
              </tr>
            ) : (
              orderedDomainStats.map((stat) => {
                const isSelected = stat.domain === selectedDomain;
                return (
                  <Fragment key={stat.domain}>
                    <tr
                      onClick={() => handleRowClick(stat.domain)}
                      className={cn(
                        'cursor-pointer border-b border-border/40 last:border-b-0 transition-colors hover:bg-muted/20',
                        isSelected && 'bg-primary/5',
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getFaviconUrl(stat.domain)}
                            alt=""
                            className="w-4 h-4 rounded-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-[13px] font-medium text-text-primary truncate">
                            {stat.domain}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-md text-xs font-black font-display',
                            scoreColor(stat.score),
                          )}
                        >
                          {stat.score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            'text-xs font-mono',
                            stat.uniqueIps > 1 ? 'text-warn' : 'text-text-secondary/70',
                          )}
                        >
                          {stat.uniqueIps}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={cn(
                            'text-xs font-mono',
                            stat.uniqueHashes > 1 ? 'text-warn' : 'text-text-secondary/70',
                          )}
                        >
                          {stat.uniqueHashes}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-secondary/70">
                        {format(new Date(stat.lastSeen), 'MMM d, HH:mm')}
                      </td>
                    </tr>

                    {/* Detail panel with fade animation */}
                    <AnimatePresence>
                      {isSelected && selectedStats && (
                        <motion.tr
                          key="detail"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="border-b border-border/40"
                        >
                          <td colSpan={5} className="p-0 bg-muted/5 overflow-hidden">
                            <FootprintDetail
                              entries={selectedStats.entries}
                              onDeleteSession={(id) => handleDeleteSession(id)}
                            />
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}