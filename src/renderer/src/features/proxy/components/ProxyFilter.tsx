import { FC } from 'react';
import { ProxyFilterState } from '../types';
import { Filter, RefreshCcw, Check } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface ProxyFilterProps {
  filters: ProxyFilterState;
  onFilterChange: (filters: ProxyFilterState) => void;
  proxies: any[];
}

type ChipVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';

const FilterChip: FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: ChipVariant;
}> = ({ label, active, onClick, variant = 'indigo' }) => {
  const variants: Record<ChipVariant, string> = {
    indigo: active
      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
      : 'bg-muted/5 border-border/50 text-muted-foreground hover:bg-indigo-500/5 hover:border-indigo-500/30 hover:text-indigo-400/80',
    emerald: active
      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
      : 'bg-muted/5 border-border/50 text-muted-foreground hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-400/80',
    amber: active
      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10'
      : 'bg-muted/5 border-border/50 text-muted-foreground hover:bg-amber-500/5 hover:border-amber-500/30 hover:text-amber-400/80',
    rose: active
      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/10'
      : 'bg-muted/5 border-border/50 text-muted-foreground hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-400/80',
    slate: active
      ? 'bg-slate-500/20 border-slate-500/50 text-slate-400 shadow-lg shadow-slate-500/10'
      : 'bg-muted/5 border-border/50 text-muted-foreground hover:bg-slate-500/5 hover:border-slate-500/30 hover:text-slate-400/80',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 border flex-1 min-w-fit',
        variants[variant],
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        {active && <Check className="w-2.5 h-2.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
    </button>
  );
};

const ProxyFilter: FC<ProxyFilterProps> = ({ filters, onFilterChange, disabled }) => {
  const updateFilter = (key: keyof ProxyFilterState, value: string) => {
    if (disabled) return;
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div
      className={cn(
        'w-80 border-r border-border/50 bg-muted/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-500',
        disabled && 'opacity-50 pointer-events-none grayscale-[0.5]',
      )}
    >
      {/* Sidebar Header - Height synced with Table Header */}
      <div className="min-h-[57px] flex items-center justify-between px-6 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-md z-10 transition-all duration-500">
        <div className="flex items-center gap-2.5">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-foreground/80">
            Filter Controls
          </span>
        </div>
        {!disabled && (
          <button
            onClick={() =>
              onFilterChange({
                searchQuery: '',
                proxyType: 'all',
                sourceType: 'all',
                protocol: 'all',
                status: 'all',
                country: 'all',
              })
            }
            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground/50 hover:text-primary transition-all active:scale-95"
            title="Reset Parameters"
          >
            <RefreshCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-9">
        {/* Proxy Type - Indigo */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">
            Configuration Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <FilterChip
              label="All"
              active={filters.proxyType === 'all'}
              onClick={() => updateFilter('proxyType', 'all')}
              variant="indigo"
            />
            <FilterChip
              label="Private"
              active={filters.proxyType === 'private'}
              onClick={() => updateFilter('proxyType', 'private')}
              variant="indigo"
            />
            <FilterChip
              label="Shared"
              active={filters.proxyType === 'shared'}
              onClick={() => updateFilter('proxyType', 'shared')}
              variant="indigo"
            />
          </div>
        </div>

        {/* Source Type - Emerald */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">
            Network Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip
              label="Any Source"
              active={filters.sourceType === 'all'}
              onClick={() => updateFilter('sourceType', 'all')}
              variant="emerald"
            />
            <FilterChip
              label="Datacenter"
              active={filters.sourceType === 'datacenter'}
              onClick={() => updateFilter('sourceType', 'datacenter')}
              variant="emerald"
            />
            <FilterChip
              label="Residential"
              active={filters.sourceType === 'residential'}
              onClick={() => updateFilter('sourceType', 'residential')}
              variant="emerald"
            />
            <FilterChip
              label="Mobile"
              active={filters.sourceType === 'mobile'}
              onClick={() => updateFilter('sourceType', 'mobile')}
              variant="emerald"
            />
          </div>
        </div>

        {/* Protocol - Amber */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">
            Protocol Matrix
          </label>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip
              label="All Protocols"
              active={filters.protocol === 'all'}
              onClick={() => updateFilter('protocol', 'all')}
              variant="amber"
            />
            <FilterChip
              label="HTTP(S)"
              active={filters.protocol === 'http'}
              onClick={() => updateFilter('protocol', 'http')}
              variant="amber"
            />
            <FilterChip
              label="SOCKS5"
              active={filters.protocol === 'socks5'}
              onClick={() => updateFilter('protocol', 'socks5')}
              variant="amber"
            />
          </div>
        </div>

        {/* Status - Mixed Variants for semantic meaning */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">
            Node Vitality
          </label>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip
              label="Any Status"
              active={filters.status === 'all'}
              onClick={() => updateFilter('status', 'all')}
              variant="slate"
            />
            <FilterChip
              label="Active Nodes"
              active={filters.status === 'active'}
              onClick={() => updateFilter('status', 'active')}
              variant="emerald"
            />
            <FilterChip
              label="Expired"
              active={filters.status === 'expired'}
              onClick={() => updateFilter('status', 'expired')}
              variant="amber"
            />
            <FilterChip
              label="Disabled"
              active={filters.status === 'disabled'}
              onClick={() => updateFilter('status', 'disabled')}
              variant="rose"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProxyFilter;
