/**
 * ------------------------------------------------------------------
 * FilterPanel
 * ------------------------------------------------------------------
 * Sidebar filter panel for the Email Manager. Provides faceted
 * filtering by linked services and visited websites with collapsible
 * sections and a clear-all action.
 *
 * Main features:
 * - Services filter with single-select
 * - Websites visited filter with single-select
 * - Displays counts per service/website
 * - Collapsible sections with active filter count badges
 * - Clear all filters button
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useMemo, useState, useEffect } from 'react';

// ── UI ──
import { ChevronRight, ChevronDown } from 'lucide-react';

// ── Types ──
import { Account, Service } from '../types';
import type { SavedView } from '../../filter/components/modal/FilterModal/types';

// ── UI Components ──
// (No additional UI components needed)

// ─── Interfaces ─────────────────────────────────────────────────────────
interface EmailFilterState {
  serviceId: string | null;
  websiteUrl: string | null;
}

interface FilterPanelProps {
  accounts: Account[];
  onFiltersChange?: (filters: EmailFilterState) => void;
  onViewSelect: (view: SavedView | null) => void;
  selectedViewId: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────

// ─── Helpers ────────────────────────────────────────────────────────────
function hasAnyFilter(filters: EmailFilterState): boolean {
  return filters.serviceId !== null || filters.websiteUrl !== null;
}

type SectionKey = 'services' | 'websites';

// ─── Component ──────────────────────────────────────────────────────────
export default function FilterPanel({
  accounts,
  onFiltersChange,
  onViewSelect,
  selectedViewId,
}: FilterPanelProps) {
  // ── State ──
  const [filters, setFilters] = useState<EmailFilterState>({
    serviceId: null,
    websiteUrl: null,
  });
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(new Set());
  const [services, setServices] = useState<Service[]>([]);

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

  // ── Collect and count websites from lastActivity ──
  const websiteCounts = useMemo<Record<string, { count: number; title: string }>>(() => {
    const counts: Record<string, { count: number; title: string }> = {};
    for (const account of accounts) {
      if (account.lastActivity && account.lastActivity.url) {
        const url = account.lastActivity.url;
        let title = account.lastActivity.title || url;

        // Extract clean title (before " - " or " | ")
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
    handleFiltersChange({ serviceId: null, websiteUrl: null });
  };

  const handleServiceSelect = (serviceId: string) => {
    // Toggle: if already selected, clear it; otherwise set it
    const newServiceId = filters.serviceId === serviceId ? null : serviceId;
    handleFiltersChange({ ...filters, serviceId: newServiceId });
  };

  const handleWebsiteSelect = (websiteUrl: string) => {
    // Toggle: if already selected, clear it; otherwise set it
    const newWebsiteUrl = filters.websiteUrl === websiteUrl ? null : websiteUrl;
    handleFiltersChange({ ...filters, websiteUrl: newWebsiteUrl });
  };

  // ── Render helpers ──
  const renderSectionHeader = (label: string, section: SectionKey) => {
    const hasFilter =
      (section === 'services' && filters.serviceId !== null) ||
      (section === 'websites' && filters.websiteUrl !== null);
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

  const renderServiceItem = (service: Service, count: number, checked: boolean) => {
    let hostname = '';
    try {
      if (service.url) {
        hostname = new URL(service.url).hostname;
      }
    } catch {
      hostname = '';
    }

    return (
      <button
        key={service.id}
        onClick={() => handleServiceSelect(service.id)}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors w-full text-left ${
          checked
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'text-text-secondary hover:bg-card-hover'
        }`}
      >
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
      </button>
    );
  };

  const renderWebsiteItem = (
    url: string,
    data: { count: number; title: string },
    checked: boolean,
  ) => {
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    return (
      <button
        key={url}
        onClick={() => handleWebsiteSelect(url)}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer text-[12.5px] transition-colors w-full text-left ${
          checked
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'text-text-secondary hover:bg-card-hover'
        }`}
      >
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
      </button>
    );
  };

  // ── Render ──
  return (
    <div className="w-[260px] shrink-0 bg-card-background border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
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
        {/* Services */}
        <div>
          {renderSectionHeader('Services', 'services')}
          {!collapsed.has('services') && (
            <div className="mt-1 space-y-0.5 px-3 max-h-[400px] overflow-y-auto">
              {services.length > 0 ? (
                services
                  .filter((service) => serviceCounts[service.id] > 0)
                  .sort((a, b) => (serviceCounts[b.id] || 0) - (serviceCounts[a.id] || 0))
                  .map((service) =>
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
          )}
        </div>

        {/* Websites */}
        <div>
          {renderSectionHeader('Websites Visited', 'websites')}
          {!collapsed.has('websites') && (
            <div className="mt-1 space-y-0.5 px-3 max-h-[400px] overflow-y-auto">
              {Object.keys(websiteCounts).length > 0 ? (
                Object.entries(websiteCounts)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([url, data]) => renderWebsiteItem(url, data, filters.websiteUrl === url))
              ) : (
                <div className="text-[11px] text-text-secondary/40 italic px-1.5 py-1">
                  No activity history
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
