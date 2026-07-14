import { FC, useState, useEffect, useMemo } from 'react';
import {
  History,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Shield,
  Lock,
  Globe,
  AlertTriangle,
  Clock,
  LayoutGrid,
  X,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  getYear,
  getMonth,
} from 'date-fns';

interface HistoryItem {
  url: string;
  title: string;
  time: number;
  duration: number;
}

interface ActivityInterval {
  hour: number;
  count: number;
}

interface TopWebsite {
  domain: string;
  count: number;
  duration: number;
  url: string;
}

interface HistoryStats {
  topWebsites: TopWebsite[];
  intervals: ActivityInterval[];
  totalVisits: number;
}

interface HistoryTabProps {
  email: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}

type TagType = 'auth' | 'security' | 'search' | 'social' | null;

function detectTag(url: string, title: string): TagType {
  const u = url.toLowerCase();
  const t = title.toLowerCase();
  if (
    u.includes('signin') ||
    u.includes('login') ||
    u.includes('auth') ||
    u.includes('accounts') ||
    t.includes('sign in') ||
    t.includes('welcome') ||
    t.includes('2-step')
  )
    return 'auth';
  if (
    u.includes('pixelscan') ||
    u.includes('vpn-check') ||
    u.includes('dns-check') ||
    u.includes('blacklist') ||
    u.includes('fingerprint') ||
    t.includes('security') ||
    t.includes('check') ||
    t.includes('bot detection')
  )
    return 'security';
  if (u.includes('google.com/search') || u.includes('bing.com/search') || u.includes('search?'))
    return 'search';
  return null;
}

interface TagConfig {
  label: string;
  icon: React.ElementType;
  className: string;
}

const TAG_CONFIG: Record<NonNullable<TagType>, TagConfig> = {
  auth: {
    label: 'Auth',
    icon: Lock,
    className: 'bg-success/10 text-success border border-success/20',
  },
  security: {
    label: 'Security',
    icon: Shield,
    className: 'bg-warn/10 text-warn border border-warn/20',
  },
  search: {
    label: 'Search',
    icon: Search,
    className: 'bg-blue/10 text-blue border border-blue/20',
  },
  social: {
    label: 'Social',
    icon: Globe,
    className: 'bg-purple/10 text-purple border border-purple/20',
  },
};

// ─── ProcessedItem ───────────────────────────────────────────────────────────

interface ProcessedItem extends HistoryItem {
  timeLabel: string;
  durationLabel: string;
  domain: string;
  tag: TagType;
}

// ─── TimeGroup ───────────────────────────────────────────────────────────────

interface TimeGroup {
  key: string;
  label: string;
  sublabel: string;
  items: ProcessedItem[];
}

function groupByTimeCluster(items: ProcessedItem[]): TimeGroup[] {
  if (items.length === 0) return [];

  const groups: TimeGroup[] = [];
  let currentGroup: ProcessedItem[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    const diffMs = Math.abs(prev.time - curr.time);
    const diffMin = diffMs / 1000 / 60;

    // Nếu cách nhau dưới 3 phút và cùng domain → gộp nhóm
    const sameDomainCluster = diffMin < 3 && prev.domain === curr.domain;
    const tightCluster = diffMin < 1;

    if (sameDomainCluster || tightCluster) {
      currentGroup.push(curr);
    } else {
      groups.push(buildGroup(currentGroup));
      currentGroup = [curr];
    }
  }
  groups.push(buildGroup(currentGroup));

  return groups;
}

function buildGroup(items: ProcessedItem[]): TimeGroup {
  const first = items[0];
  const last = items[items.length - 1];
  const timeRange =
    first.timeLabel === last.timeLabel ? first.timeLabel : `${last.timeLabel} – ${first.timeLabel}`;

  // Dominant domain trong group
  const domainCount: Record<string, number> = {};
  for (const item of items) {
    domainCount[item.domain] = (domainCount[item.domain] || 0) + 1;
  }
  const dominantDomain = Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  const sublabel = `${items.length} visit${items.length > 1 ? 's' : ''} · ${dominantDomain}`;

  return {
    key: `${first.time}`,
    label: timeRange,
    sublabel,
    items,
  };
}

// ─── InsightStrip ─────────────────────────────────────────────────────────────

const InsightStrip: FC<{ groups: TimeGroup[] }> = ({ groups }) => {
  const [dismissed, setDismissed] = useState(false);

  const insight = useMemo(() => {
    for (const g of groups) {
      const securityItems = g.items.filter((i) => i.tag === 'security');
      if (securityItems.length >= 3) {
        return {
          text: `${securityItems.length} security checks detected from ${g.items[0].domain} at ${g.label} — looks like a cluster session.`,
          action: 'View cluster',
        };
      }
    }
    return null;
  }, [groups]);

  if (!insight || dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-warn/10 border-t border-warn/20 shrink-0">
      <AlertTriangle className="w-4 h-4 text-warn shrink-0" />
      <span className="text-[12px] text-warn flex-1">{insight.text}</span>
      <button className="text-[12px] text-warn font-semibold underline underline-offset-2 whitespace-nowrap hover:opacity-70 transition-opacity">
        {insight.action} →
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-warn/60 hover:text-warn transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── HistoryItemRow ───────────────────────────────────────────────────────────

const HistoryItemRow: FC<{ item: ProcessedItem }> = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  const tagConfig = item.tag ? TAG_CONFIG[item.tag] : null;
  const TagIcon = tagConfig?.icon;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url).catch(() => {});
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    // @ts-ignore
    if (window.electron) {
      // @ts-ignore
      window.electron.shell?.openExternal(item.url);
    } else {
      window.open(item.url, '_blank');
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 border-b border-border/20 transition-colors group/row cursor-default"
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      {/* Favicon */}
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-card/60 border border-border/30 overflow-hidden">
        {!imgError ? (
          <img
            src={getFaviconUrl(item.url)}
            alt=""
            className="w-4 h-4 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <Globe className="w-3.5 h-3.5 text-muted-foreground/40" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-foreground/90 truncate group-hover/row:text-primary transition-colors leading-tight">
          {item.title && item.title !== 'Untitled Page' ? item.title : item.domain}
        </div>
        <div className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
          <span className="text-primary/50 font-medium">{item.domain}</span>
          <span className="text-muted-foreground/25">
            {item.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 60) || '/'}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tag */}
        {tagConfig && TagIcon && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${tagConfig.className}`}
          >
            <TagIcon className="w-2.5 h-2.5" />
            {tagConfig.label}
          </span>
        )}

        {/* Time */}
        <span className="text-[11px] font-mono text-muted-foreground/40 min-w-[38px] text-right">
          {item.timeLabel}
        </span>

        {/* Actions — visible on hover */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-150 ${actionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <button
            onClick={handleCopy}
            className="w-6 h-6 flex items-center justify-center rounded border border-border/40 bg-card/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/60 hover:text-primary transition-all"
            title="Copy URL"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleOpen}
            className="w-6 h-6 flex items-center justify-center rounded border border-border/40 bg-card/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/60 hover:text-primary transition-all"
            title="Open in browser"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded border border-border/40 bg-card/60 hover:bg-error/10 hover:border-error/30 text-muted-foreground/60 hover:text-error transition-all"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TimeGroupBlock ───────────────────────────────────────────────────────────

const TimeGroupBlock: FC<{ group: TimeGroup }> = ({ group }) => {
  return (
    <div className="mb-0.5">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-background/40 border-b border-border/20 sticky top-0 z-10 backdrop-blur-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground/50 font-mono">
          {group.label}
        </span>
        <span className="text-[10px] text-muted-foreground/35">{group.sublabel}</span>
      </div>

      {/* Items */}
      {group.items.map((item, i) => (
        <HistoryItemRow key={`${item.time}-${i}`} item={item} />
      ))}
    </div>
  );
};

// ─── HistoryCalendar ──────────────────────────────────────────────────────────

const HistoryCalendar: FC<{
  email: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}> = ({ email, selectedDate, onDateSelect }) => {
  const [viewDate, setViewDate] = useState(parseISO(selectedDate));
  const [activityData, setActivityData] = useState<Record<string, { domainCount: number }>>({});

  useEffect(() => {
    const fetchDates = async () => {
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('email:get-history-dates', {
          email,
          month: getMonth(viewDate),
          year: getYear(viewDate),
        });
        if (result.success) {
          setActivityData(result.activity || {});
        }
      } catch (e) {
        console.error('Failed to fetch activity dates:', e);
      }
    };
    fetchDates();
  }, [email, viewDate]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-[13px] font-bold text-foreground/90 leading-tight">
            {format(viewDate, 'MMMM')}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/40 tracking-widest">
            {format(viewDate, 'yyyy')}
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="h-6 flex items-center justify-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, parseISO(selectedDate));
          const isCurrentMonth = isSameMonth(day, viewDate);
          const activity = activityData?.[dateStr];
          const hasData = !!activity?.domainCount && activity.domainCount > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-[11px] font-mono font-bold
                ${
                  isSelected
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : hasData
                      ? 'text-foreground/80 hover:bg-primary/5 hover:text-primary'
                      : 'text-foreground/20 hover:bg-card/40 hover:text-foreground/50'
                }
                ${!isCurrentMonth && !isSelected ? 'opacity-20' : ''}
              `}
            >
              {format(day, 'd')}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/40" />
              )}
              {hasData && isSelected && (
                <span className="text-[7px] text-primary/60 font-mono leading-none mt-0.5">
                  {activity.domainCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── DomainSidebar ────────────────────────────────────────────────────────────

const DomainSidebar: FC<{
  topWebsites: TopWebsite[];
  totalVisits: number;
  selectedDomain: string | null;
  onDomainSelect: (domain: string | null) => void;
  activeTime: number;
}> = ({ topWebsites, totalVisits, selectedDomain, onDomainSelect, activeTime }) => {
  const uniqueDomains = topWebsites.length;
  const activeMin = Math.round(activeTime / 60);

  return (
    <>
      {/* Stats */}
      <div className="px-4 py-3 border-b border-border/20 grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground/40 font-medium">Visits</span>
          <span className="text-[15px] font-black font-mono text-foreground/90">{totalVisits}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground/40 font-medium">Domains</span>
          <span className="text-[15px] font-black font-mono text-foreground/90">
            {uniqueDomains}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground/40 font-medium">Time</span>
          <span className="text-[15px] font-black font-mono text-foreground/90">
            {activeMin > 0 ? `~${activeMin}m` : '—'}
          </span>
        </div>
      </div>

      {/* Domain list */}
      {topWebsites.length > 0 && (
        <div className="flex flex-col py-1">
          <div className="px-4 py-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30">
              Top domains
            </span>
          </div>
          {topWebsites.slice(0, 8).map((site) => {
            const isActive = selectedDomain === site.domain;
            return (
              <button
                key={site.domain}
                onClick={() => onDomainSelect(isActive ? null : site.domain)}
                className={`flex items-center gap-2.5 px-4 py-2 transition-colors text-left ${
                  isActive ? 'bg-primary/10' : 'hover:bg-card/40'
                }`}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-card/80 border border-border/30 overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
                    alt=""
                    className="w-3.5 h-3.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span
                  className={`text-[12px] flex-1 truncate ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground/70'}`}
                >
                  {site.domain}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground/30">{site.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

// ─── FilterBar ────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'auth' | 'security' | 'search';

const FILTER_OPTIONS: { key: FilterMode; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'auth', label: 'Auth', icon: Lock },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'search', label: 'Search', icon: Search },
];

const FilterBar: FC<{
  query: string;
  onQueryChange: (q: string) => void;
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  count: number;
}> = ({ query, onQueryChange, filter, onFilterChange, count }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-background/20 shrink-0">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Search history..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-card/50 border border-border/30 rounded-lg text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 focus:bg-card/70 transition-all"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1">
        {FILTER_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              filter === key
                ? 'bg-primary/15 text-primary border border-primary/25'
                : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-card/50 border border-transparent'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      <span className="text-[10px] font-mono text-muted-foreground/30 whitespace-nowrap">
        {count} entries
      </span>
    </div>
  );
};

// ─── HistoryTab ───────────────────────────────────────────────────────────────

const HistoryTab: FC<HistoryTabProps> = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    topWebsites: [],
    intervals: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
    totalVisits: 0,
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const fetchHistory = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-history', {
        email,
        date,
      });
      if (result.success) {
        setHistory(result.history);
        setStats(result.stats);
      } else {
        setError(result.error || 'Failed to load history');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchHistory(selectedDate);
    }
  }, [email, selectedDate]);

  // Reset domain filter khi đổi ngày
  useEffect(() => {
    setSelectedDomain(null);
    setQuery('');
    setFilter('all');
  }, [selectedDate]);

  // Tổng thời gian active (giây) từ intervals
  const activeTime = useMemo(() => {
    return stats.intervals.reduce((sum, iv) => sum + iv.count * 60, 0);
  }, [stats.intervals]);

  // Process history → add tag, domain, timeLabel
  const processedHistory = useMemo<ProcessedItem[]>(() => {
    return history.map((item) => {
      const date = new Date(item.time);
      return {
        ...item,
        timeLabel: format(date, 'HH:mm'),
        durationLabel: `${item.duration || 0}s`,
        domain: getDomain(item.url),
        tag: detectTag(item.url, item.title || ''),
      };
    });
  }, [history]);

  // Apply filters
  const filteredHistory = useMemo(() => {
    return processedHistory.filter((item) => {
      if (selectedDomain && item.domain !== selectedDomain) return false;
      if (filter !== 'all' && item.tag !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [processedHistory, selectedDomain, filter, query]);

  // Group into time clusters
  const timeGroups = useMemo(() => groupByTimeCluster(filteredHistory), [filteredHistory]);

  return (
    <div className="w-full flex h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 bg-background/5">
      {/* ── Sidebar ── */}
      <aside className="w-[260px] flex flex-col border-r border-border/30 overflow-y-auto custom-scrollbar shrink-0 bg-background/20">
        {/* Calendar */}
        <div className="border-b border-border/20">
          <HistoryCalendar
            email={email}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Stats + Domain list */}
        <DomainSidebar
          topWebsites={stats.topWebsites}
          totalVisits={stats.totalVisits}
          selectedDomain={selectedDomain}
          onDomainSelect={setSelectedDomain}
          activeTime={activeTime}
        />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background/20 ml-px">
        {/* Filter bar */}
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          count={filteredHistory.length}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary/50">
                Decoding Chronicle...
              </span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error border border-error/10">
                <History className="w-8 h-8 opacity-50" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground/90">Error loading history</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => fetchHistory(selectedDate)}
                className="px-6 py-2 bg-primary/10 text-primary rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/20 active:scale-95"
              >
                Retry
              </button>
            </div>
          ) : timeGroups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-muted/20 border border-border/30 flex items-center justify-center">
                <History className="w-12 h-12 text-muted-foreground/15" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-foreground/70">No history found</h3>
                <p className="text-xs text-muted-foreground/50 max-w-[240px] leading-relaxed">
                  {query || filter !== 'all' || selectedDomain
                    ? 'Try adjusting your filters.'
                    : 'No browsing activity recorded for this date.'}
                </p>
              </div>
              {(query || filter !== 'all' || selectedDomain) && (
                <button
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                    setSelectedDomain(null);
                  }}
                  className="text-[11px] text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {timeGroups.map((group) => (
                <TimeGroupBlock key={group.key} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Insight strip */}
        <InsightStrip groups={timeGroups} />
      </div>
    </div>
  );
};

export default HistoryTab;
