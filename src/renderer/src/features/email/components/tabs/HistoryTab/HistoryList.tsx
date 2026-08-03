import { FC, useState } from 'react';
import { memo } from 'react';
import {
  History,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Globe,
  X,
} from 'lucide-react';
import { EmptyState } from '../../../../../components/ui/EmptyState';

interface ProcessedItem {
  url: string;
  title: string;
  time: number;
  duration: number;
  timeLabel: string;
  durationLabel: string;
  domain: string;
  tag: 'auth' | 'security' | 'search' | 'social' | null;
}

interface TimeGroup {
  key: string;
  label: string;
  sublabel: string;
  items: ProcessedItem[];
}

interface HistoryListProps {
  groups: TimeGroup[];
  email: string;
  query: string;
  onQueryChange: (q: string) => void;
  onRefresh: () => void;
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}

// ─── HistoryItemRow ───────────────────────────────────────────────────────────

const HistoryItemRow: FC<{ item: ProcessedItem; email: string }> = ({ item, email }) => {
  const [imgError, setImgError] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

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

  const handleDelete = async (e: React.MouseEvent, historyItem: ProcessedItem) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:delete-history-item', {
        email,
        url: historyItem.url,
        time: historyItem.time,
      });
      if (result.success) {
        console.log('[History] Deleted:', historyItem.url);
      } else {
        console.error('[History] Delete failed:', result.error);
      }
    } catch (err) {
      console.error('[History] Delete error:', err);
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

      {/* Actions */}
      <div
        className={`flex items-center gap-1 shrink-0 transition-opacity ${actionsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={handleCopy}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 text-muted-foreground/50 hover:text-primary transition-all active:scale-95 flex items-center justify-center"
          title="Copy URL"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleOpen}
          className="w-8 h-8 rounded-lg hover:bg-primary/10 text-muted-foreground/50 hover:text-primary transition-all active:scale-95 flex items-center justify-center"
          title="Open in browser"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => handleDelete(e, item)}
          className="w-8 h-8 rounded-lg hover:bg-error/10 text-muted-foreground/50 hover:text-error transition-all active:scale-95 flex items-center justify-center"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── TimeGroupBlock ───────────────────────────────────────────────────────────

const TimeGroupBlock: FC<{ group: TimeGroup; email: string }> = ({ group, email }) => {
  return (
    <div className="mb-0.5">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-background/40 border-b border-border/20 sticky top-0 z-10 backdrop-blur-sm">
        <span className="text-[13px] font-black uppercase tracking-[0.08em] text-muted-foreground/50 font-mono">
          {group.label}
        </span>
        <span className="text-[13px] text-muted-foreground/35">{group.sublabel}</span>
      </div>

      {/* Items */}
      {group.items.map((item, i) => (
        <HistoryItemRow key={`${item.time}-${i}`} item={item} email={email} />
      ))}
    </div>
  );
};

// ─── FilterBar ────────────────────────────────────────────────────────────────

const FilterBar: FC<{
  query: string;
  onQueryChange: (q: string) => void;
  count: number;
}> = ({ query, onQueryChange, count }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-background/20 shrink-0">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Search history..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full h-8 pl-10 pr-3 bg-input-background border border-border rounded-md text-sm text-foreground placeholder:text-text-secondary outline-none transition-all duration-300"
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

      {/* Count */}
      <span className="text-[10px] font-mono text-muted-foreground/30 whitespace-nowrap">
        {count} entries
      </span>
    </div>
  );
};

// ─── HistoryList ─────────────────────────────────────────────────────────────

const HistoryList: FC<HistoryListProps> = ({
  groups,
  email,
  query,
  onQueryChange,
}) => {
  console.log('[DEBUG] HistoryList render — groups:', groups.length);
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-background/20 ml-px">
      <FilterBar query={query} onQueryChange={onQueryChange} count={groups.length} />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {groups.length === 0 ? (
          <EmptyState
            icon={<History className="w-14 h-14 text-primary/40" />}
            title="No history found"
            description={
              query
                ? 'Nothing matches your current search.'
                : 'Your browsing journey starts here. Every page you visit will be recorded.'
            }
          >
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/15 text-primary/70 text-[11px] font-medium tracking-[0.06em] uppercase"
              >
                Clear search
              </button>
            )}
          </EmptyState>
        ) : (
          <div>
            {groups.map((group) => (
              <TimeGroupBlock key={group.key} group={group} email={email} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HistoryList);