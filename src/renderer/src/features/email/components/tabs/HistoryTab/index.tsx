import { FC, useState, useEffect, useMemo } from 'react';
import { Loader2, History } from 'lucide-react';
import {
  format,
} from 'date-fns';
import ControlSidebar from './ControlSidebar';
import HistoryList from './HistoryList';

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

interface ProcessedItem extends HistoryItem {
  timeLabel: string;
  durationLabel: string;
  domain: string;
  tag: TagType;
}

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
  const [filter, setFilter] = useState<'all' | 'auth' | 'security' | 'search'>('all');

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

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
        </div>
        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary/50">
          Decoding Chronicle...
        </span>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="w-full flex h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 bg-background/5">
      <ControlSidebar
        email={email}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        topWebsites={stats.topWebsites}
        selectedDomain={selectedDomain}
        onDomainSelect={setSelectedDomain}
      />

      <HistoryList
        groups={timeGroups}
        email={email}
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => fetchHistory(selectedDate)}
      />
    </div>
  );
};

export default HistoryTab;