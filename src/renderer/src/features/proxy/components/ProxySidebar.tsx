import React, { useMemo, memo } from 'react';
import { cn } from '@renderer/shared/lib/utils';
import {
  Filter,
  SortAsc,
  FolderIcon,
  ShieldCheck,
  MapPin,
  Grid,
  LayoutGrid,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { ProxyItem } from '../types/types';
import Dropdown from '@renderer/shared/components/ui/dropdown/Dropdown';
import DropdownTrigger from '@renderer/shared/components/ui/dropdown/DropdownTrigger';
import DropdownContent from '@renderer/shared/components/ui/dropdown/DropdownContent';
import DropdownItem from '@renderer/shared/components/ui/dropdown/DropdownItem';

interface ProxySidebarProps {
  proxies: ProxyItem[];
  filters: any;
  setFilters: (f: any) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

const ProxySidebar: React.FC<ProxySidebarProps> = memo(
  ({ proxies, filters, setFilters, sortBy, setSortBy }) => {
    // Compute dynamic stats from real data
    const stats = useMemo(() => {
      const countries = new Set<string>();
      const types = new Set<string>();
      const providers = new Set<string>();
      const statusCount = { active: 0, expired: 0, error: 0 };

      proxies.forEach((p) => {
        if (p.country) countries.add(p.country);
        if (p.type) types.add(p.type);
        if (p.status) statusCount[p.status]++;
        if (p.details?.isp) providers.add(p.details.isp);
      });

      return {
        countries: Array.from(countries).sort(),
        types: Array.from(types).sort(),
        providers: Array.from(providers).sort(),
        statusCount,
      };
    }, [proxies]);

    const toggleFilter = (key: string, value: string) => {
      const current = filters[key] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      setFilters({ ...filters, [key]: updated });
    };

    const currentCountry = filters.country?.[0] || 'all';
    const sortOptions = [
      { value: 'stt_asc', label: 'STT (Ascending)' },
      { value: 'stt_desc', label: 'STT (Descending)' },
      { value: 'recent', label: 'Recent Checked' },
      { value: 'expiry', label: 'Expiry Date' },
    ];
    const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || 'Sort By';

    return (
      <div className="w-80 shrink-0 border-r border-border bg-card/20 flex flex-col select-none overflow-hidden">
        {/* Header đồng bộ - Tiêu đề Proxy Management */}
        <div className="h-16 shrink-0 border-b border-border bg-background/50 px-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Proxy Management</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* Category Section */}
          <section className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <FolderIcon className="w-3.5 h-3.5" /> Categories
            </label>
            <div className="space-y-1.5">
              <button className="w-full text-left px-4 py-3 rounded-md text-[15px] bg-primary/10 text-primary font-bold flex items-center justify-between shadow-sm border border-primary/10">
                <span>All Proxies</span>
                <span className="text-xs bg-primary/20 px-2 py-1 rounded-md">{proxies.length}</span>
              </button>
            </div>
          </section>

          {/* Filter Section */}
          <section className="space-y-5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <Filter className="w-3.5 h-3.5" /> Filters
            </label>

            <div className="space-y-6 px-1">
              {/* Status Filter */}
              <div className="space-y-3">
                <span className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Status
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {['active', 'expired', 'error'].map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleFilter('status', s)}
                      className={cn(
                        'px-3 py-1.5 border rounded-lg text-xs transition-all capitalize font-medium',
                        filters.status?.includes(s)
                          ? 'bg-primary/20 border-primary/50 text-primary font-bold shadow-sm'
                          : 'bg-input border-border text-muted-foreground hover:bg-muted/50 hover:border-border-hover',
                      )}
                    >
                      {s}{' '}
                      <span className="opacity-60 ml-1">
                        ({stats.statusCount[s as keyof typeof stats.statusCount]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-3">
                <span className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  <Grid className="w-4 h-4 text-blue-500" /> Type
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {stats.types.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleFilter('type', t)}
                      className={cn(
                        'px-3 py-1.5 border rounded-lg text-xs transition-all font-medium',
                        filters.type?.includes(t)
                          ? 'bg-primary/20 border-primary/50 text-primary font-bold shadow-sm'
                          : 'bg-input border-border text-muted-foreground hover:bg-muted/50 hover:border-border-hover',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Filter - Custom Dropdown */}
              <div className="space-y-3">
                <span className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> Country
                </span>
                <Dropdown className="w-full">
                  <DropdownTrigger className="w-full">
                    <div className="w-full bg-input border border-border rounded-md px-4 py-2.5 text-sm text-foreground flex items-center justify-between shadow-sm hover:border-border-hover group">
                      <span className="truncate">
                        {currentCountry === 'all' ? 'All Countries' : currentCountry}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </DropdownTrigger>
                  <DropdownContent className="w-full" minWidth="260px">
                    <DropdownItem onClick={() => setFilters({ ...filters, country: [] })}>
                      All Countries
                    </DropdownItem>
                    {stats.countries.map((c) => (
                      <DropdownItem
                        key={c}
                        onClick={() => setFilters({ ...filters, country: [c] })}
                      >
                        {c}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              </div>

              {/* Provider Filter */}
              <div className="space-y-3">
                <span className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Providers
                </span>
                <div className="flex flex-col gap-1.5">
                  {stats.providers.slice(0, 5).map((isp) => (
                    <button
                      key={isp}
                      onClick={() => toggleFilter('provider', isp)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all',
                        filters.provider?.includes(isp)
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      <span className="truncate flex-1 text-left">{isp}</span>
                      {filters.provider?.includes(isp) && (
                        <div className="w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                  {stats.providers.length > 5 && (
                    <span className="text-[10px] text-muted-foreground italic px-3">
                      And {stats.providers.length - 5} more...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Sort Section - Custom Dropdown */}
          <section className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
              <SortAsc className="w-3.5 h-3.5" /> Sort By
            </label>
            <div className="px-1">
              <Dropdown className="w-full">
                <DropdownTrigger className="w-full">
                  <div className="w-full bg-input border border-border rounded-md px-4 py-2.5 text-sm text-foreground flex items-center justify-between shadow-sm hover:border-border-hover group">
                    <span className="truncate">{currentSortLabel}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </DropdownTrigger>
                <DropdownContent className="w-full" minWidth="260px">
                  {sortOptions.map((opt) => (
                    <DropdownItem key={opt.value} onClick={() => setSortBy(opt.value)}>
                      {opt.label}
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </div>
          </section>
        </div>
      </div>
    );
  },
);

export default ProxySidebar;
