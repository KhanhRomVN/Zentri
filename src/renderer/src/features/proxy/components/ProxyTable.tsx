import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Copy, Shield, Trash2, RefreshCw, Search } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { Proxy } from '../../../types/db';
import { deriveDisplayStatus, DISPLAY_STATUS_CONFIG, PROTOCOL_COLORS, TYPE_COLORS } from '../constants';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Checkbox } from '../../../components/ui/Checkbox';
import { EmptyState } from '../../../components/ui/EmptyState';
import { toast } from 'sonner';

interface ProxyTableProps {
  proxies: Proxy[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (proxy: Proxy) => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type SortKey = 'endpoint' | 'location' | 'isp' | 'latency' | 'success' | 'seen';

const COUNTRY_FLAG: Record<string, string> = {
  VN: '🇻🇳', US: '🇺🇸', DE: '🇩🇪', SG: '🇸🇬', GB: '🇬🇧',
  JP: '🇯🇵', BR: '🇧🇷', IN: '🇮🇳', NL: '🇳🇱', FR: '🇫🇷',
  CA: '🇨🇦', AU: '🇦🇺',
};

export default function ProxyTable({
  proxies,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onRefresh,
  searchQuery,
  onSearchChange,
  totalRecords,
  startRecord,
  endRecord,
  currentPage,
  totalPages,
  onPageChange,
}: ProxyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; proxy: Proxy } | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const sorted = [...proxies];
  if (sortKey) {
    sorted.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'endpoint':
          av = a.host || '';
          bv = b.host || '';
          break;
        case 'location':
          av = (a.country || '') + (a.city || '');
          bv = (b.country || '') + (b.city || '');
          break;
        case 'isp':
          av = a.isp || '';
          bv = b.isp || '';
          break;
        case 'latency':
          av = a.latency ?? 9999;
          bv = b.latency ?? 9999;
          break;
        case 'success':
          av = a.success_rate ?? 0;
          bv = b.success_rate ?? 0;
          break;
        case 'seen':
          av = a.last_seen_min ?? 9999;
          bv = b.last_seen_min ?? 9999;
          break;
        default:
          return 0;
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }

  const allSelected = proxies.length > 0 && proxies.every((p) => selectedIds.has(p.id));
  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(proxies.map((p) => p.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 1 ? (
      <ChevronUp className="size-2.5 opacity-60 inline ml-0.5" />
    ) : (
      <ChevronDown className="size-2.5 opacity-60 inline ml-0.5" />
    );
  };

  const latencyClass = (v: number | null | undefined) => {
    if (v == null) return 'text-text-secondary/40';
    if (v < 200) return 'text-green';
    if (v < 800) return 'text-yellow';
    return 'text-red';
  };

  const successColor = (v: number | null | undefined) => {
    if (v == null) return 'bg-text-secondary/20';
    if (v >= 85) return 'bg-green';
    if (v >= 50) return 'bg-yellow';
    return 'bg-red';
  };

  const formatSeen = (min: number | null | undefined) => {
    if (min == null) return '…';
    if (min === 0) return 'just now';
    if (min < 60) return `${min}m ago`;
    return `${Math.round(min / 60)}h ago`;
  };

  const formatQuota = (total: string | null | undefined, used: number | null | undefined) => {
    if (!total || total === '∞') return { text: 'Unlimited', pct: 0 };
    const t = parseFloat(total);
    const u = used ?? 0;
    return { text: `${u}/${t} GB`, pct: Math.min(100, (u / t) * 100) };
  };

  const handleContextMenu = (e: React.MouseEvent, proxy: Proxy) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, proxy });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-card-background border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2 bg-input-background border border-border rounded-lg px-2.5 py-1.5 flex-1 max-w-[420px]">
          <Search className="size-3.5 text-text-secondary/60 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search host, ISP, country, username…"
            className="bg-transparent border-none outline-none text-text-primary text-[12.5px] w-full font-sans placeholder:text-text-secondary/40"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onRefresh}
            className="size-7 rounded-md border border-border bg-card-background text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="border-collapse table-fixed w-full">
          <thead className="sticky top-0 z-30">
            <tr className="border-b border-border/50 bg-table-header-background shadow-sm">
              <th className="w-[40px] text-sm font-bold h-10 text-center">
                <Checkbox checked={allSelected} onChange={toggleAll} size="sm" />
              </th>
              <th
                className="w-[346px] pl-4 text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('endpoint')}
              >
                Status / Host{renderSortIcon('endpoint')}
              </th>
              <th className="w-[158px] text-sm font-bold h-10 text-left text-text-secondary">
                Protocol · Type
              </th>
              <th
                className="w-[168px] text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('location')}
              >
                Location{renderSortIcon('location')}
              </th>
              <th
                className="w-[150px] text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('isp')}
              >
                ISP{renderSortIcon('isp')}
              </th>
              <th
                className="w-[150px] text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('latency')}
              >
                Latency{renderSortIcon('latency')}
              </th>
              <th
                className="w-[104px] text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('success')}
              >
                Success{renderSortIcon('success')}
              </th>
              <th className="w-[150px] text-sm font-bold h-10 text-left text-text-secondary">
                Quota
              </th>
              <th
                className="w-[96px] text-sm font-bold h-10 text-left text-text-secondary cursor-pointer select-none"
                onClick={() => handleSort('seen')}
              >
                Seen{renderSortIcon('seen')}
              </th>
              <th className="w-[44px] text-sm font-bold h-10 text-left" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="h-full">
                  <div className="flex items-center justify-center h-[300px]">
                    <EmptyState
                      icon={<Search className="w-10 h-10" />}
                      title="No proxies found"
                      description="No proxies match the current filters"
                      variant="default"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((p) => {
                const ds = deriveDisplayStatus(p);
                const dsCfg = DISPLAY_STATUS_CONFIG[ds];
                const protoColor = PROTOCOL_COLORS[p.protocol || 'http'] || '';
                const typeColor = TYPE_COLORS[p.proxy_type || 'private'] || '';
                const quota = formatQuota(p.quota_total, p.quota_used);
                const isSelected = selectedIds.has(p.id);

                return (
                  <tr
                    key={p.id}
                    className={cn(
                      'group transition-colors cursor-pointer border-b border-border/20 h-[54px] hover:bg-table-row-hover relative',
                      isSelected && 'bg-primary/5',
                    )}
                    onClick={() => onRowClick(p)}
                    onContextMenu={(e) => handleContextMenu(e, p)}
                  >
                    <td className="text-center py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onChange={() => toggleOne(p.id)} size="sm" />
                    </td>
                    <td className="py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('size-1.5 rounded-full shrink-0', dsCfg.dotClass, ds === 'testing' && 'animate-pulse')} />
                          <span className={cn('text-xs font-semibold', dsCfg.textClass)}>{dsCfg.label}</span>
                          <span className="font-mono text-[12.5px] text-text-primary font-medium truncate">
                            {p.host}:{p.port}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-text-secondary/60 truncate ml-5 pl-0.5">{p.username}</div>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', protoColor)}>
                          {(p.protocol || 'HTTP').toUpperCase()}
                        </span>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', typeColor)}>
                          {p.proxy_type === 'private' ? 'Private' : 'Shared'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{COUNTRY_FLAG[p.country || ''] || ''}</span>
                        <div className="min-w-0">
                          <div className="text-xs text-text-primary">{p.country}</div>
                          <div className="text-[10.5px] text-text-secondary/60 truncate">{p.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="text-xs text-text-secondary truncate block" title={p.isp || ''}>
                        {p.isp || '—'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-mono text-xs font-semibold w-11 shrink-0', latencyClass(p.latency))}>
                          {p.latency != null ? `${p.latency}ms` : '…'}
                        </span>
                        <svg className="shrink-0" width="64" height="22" viewBox="0 0 64 22">
                          <polyline
                            points="0,18 4,16 8,14 12,12 16,8 20,10 24,6 28,4 32,8 36,6 40,10 44,14 48,16 52,18 56,16 60,20 64,18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            className={latencyClass(p.latency)}
                            opacity="0.7"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 rounded-full bg-text-secondary/10 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', successColor(p.success_rate))}
                            style={{ width: `${p.success_rate ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-text-secondary font-mono">{p.success_rate ?? 0}%</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-text-secondary truncate">{quota.text}</div>
                        <div className="w-full h-1.5 rounded-full bg-text-secondary/10 overflow-hidden mt-0.5">
                          <div
                            className={cn('h-full rounded-full', quota.pct > 85 ? 'bg-yellow' : 'bg-teal')}
                            style={{ width: `${quota.pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2">
                      <span className="text-[11.5px] text-text-secondary/60 font-mono">
                        {p.status === 'active' ? formatSeen(p.last_seen_min) : '—'}
                      </span>
                    </td>
                    <td className="py-2 pr-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setContextMenu({ x: rect.right, y: rect.bottom, proxy: p });
                        }}
                        className="size-7 rounded-md border border-transparent hover:bg-table-row-hover hover:border-border flex items-center justify-center text-text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-text-secondary font-mono shrink-0 bg-table-footer-background">
        <span>
          {totalRecords > 0
            ? `Showing ${startRecord.toLocaleString()}–${endRecord.toLocaleString()} of ${totalRecords.toLocaleString()}`
            : 'No results'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-table-row-hover"
          >
            ‹
          </button>
          <span className="px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2 py-0.5 rounded disabled:opacity-30 hover:bg-table-row-hover"
          >
            ›
          </button>
        </div>
      </div>

      {/* Context Menu */}
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
                icon={<Eye className="size-3.5" />}
                onClick={() => {
                  onRowClick(contextMenu.proxy);
                  setContextMenu(null);
                }}
              >
                View Details
              </DropdownItem>
              <DropdownItem
                icon={<Copy className="size-3.5" />}
                onClick={() => {
                  navigator.clipboard?.writeText(`${contextMenu.proxy.host}:${contextMenu.proxy.port}`);
                  toast.success(`Copied ${contextMenu.proxy.host}:${contextMenu.proxy.port}`);
                  setContextMenu(null);
                }}
              >
                Copy host:port
              </DropdownItem>
              <DropdownItem
                icon={<Shield className="size-3.5" />}
                onClick={async () => {
                  const p = contextMenu.proxy;
                  setContextMenu(null);
                  toast.info(`Testing ${p.host}:${p.port}…`);
                  try {
                    // @ts-ignore
                    await window.electron.ipcRenderer.invoke('proxy:check', p);
                    toast.success(`${p.host}:${p.port} — Reachable`);
                  } catch {
                    toast.error(`${p.host}:${p.port} — Unreachable`);
                  }
                  onRefresh();
                }}
              >
                Test Now
              </DropdownItem>
              <DropdownItem
                variant="error"
                icon={<Trash2 className="size-3.5" />}
                onClick={async () => {
                  const p = contextMenu.proxy;
                  setContextMenu(null);
                  try {
                    // @ts-ignore
                    await window.electron.ipcRenderer.invoke('proxy:delete', p.id);
                    toast.success('Proxy deleted');
                  } catch {
                    toast.error('Failed to delete proxy');
                  }
                  onRefresh();
                }}
              >
                Delete Proxy
              </DropdownItem>
            </DropdownContent>
          </Dropdown>,
          document.body,
        )}
    </div>
  );
}