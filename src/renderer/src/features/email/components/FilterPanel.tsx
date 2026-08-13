/**
 * ------------------------------------------------------------------
 * FilterPanel
 * ------------------------------------------------------------------
 * Sidebar filter panel for the Email Manager. Provides faceted
 * filtering by account status and proxy country with collapsible
 * sections and a clear-all action.
 *
 * Main features:
 * - Status filter (Active / Banned / Deleting) with dot indicators
 * - Country filter with flag emojis and facet counts
 * - Collapsible sections with active filter count badges
 * - Clear all filters button
 * ------------------------------------------------------------------
 */

// ─── Imports ────────────────────────────────────────────────────────────
// ── React ──
import { useMemo, useState } from 'react';

// ── UI ──
import { ChevronRight, ChevronDown } from 'lucide-react';

// ── Types ──
import { Account } from '../types';

// ── UI Components ──
import { Checkbox } from '../../../components/ui/Checkbox';

// ── Local Components ──
import ViewsPanel from './ViewsPanel';
import type { SavedView } from './modals/FilterModal/types';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface EmailFilterState {
  status: Set<string>;
  country: Set<string>;
}

interface EmailFacetCounts {
  status: Record<string, number>;
  country: Record<string, number>;
}

interface FilterPanelProps {
  accounts: Account[];
  onFiltersChange?: (filters: EmailFilterState) => void;
  onViewSelect: (view: SavedView | null) => void;
  selectedViewId: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  VN: '🇻🇳',
  US: '🇺🇸',
  DE: '🇩🇪',
  SG: '🇸🇬',
  GB: '🇬🇧',
  JP: '🇯🇵',
  BR: '🇧🇷',
  IN: '🇮🇳',
  NL: '🇳🇱',
  FR: '🇫🇷',
  CA: '🇨🇦',
  AU: '🇦🇺',
};

const COUNTRY_NAMES: Record<string, string> = {
  VN: 'Vietnam',
  US: 'United States',
  DE: 'Germany',
  SG: 'Singapore',
  GB: 'United Kingdom',
  JP: 'Japan',
  BR: 'Brazil',
  IN: 'India',
  NL: 'Netherlands',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  banned: 'Banned',
  deleting: 'Deleting',
};

const STATUS_DOT_CLASS: Record<string, string> = {
  active: 'bg-green',
  banned: 'bg-yellow',
  deleting: 'bg-red',
};

// ─── Helpers ────────────────────────────────────────────────────────────
function toggleSet(set: Set<string>, val: string): Set<string> {
  const next = new Set(set);
  if (next.has(val)) next.delete(val);
  else next.add(val);
  return next;
}

function hasAnyFilter(filters: EmailFilterState): boolean {
  return filters.status.size > 0 || filters.country.size > 0;
}

type SectionKey = 'status' | 'country';

function getSectionCount(filters: EmailFilterState, section: SectionKey): number {
  return filters[section].size;
}

// ─── Component ──────────────────────────────────────────────────────────
export default function FilterPanel({
  accounts,
  onFiltersChange,
  onViewSelect,
  selectedViewId,
}: FilterPanelProps) {
  // ── State ──
  const [filters, setFilters] = useState<EmailFilterState>({
    status: new Set(),
    country: new Set(),
  });
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(new Set());

  // ── Derived ──
  const facetCounts = useMemo<EmailFacetCounts>(() => {
    const status: Record<string, number> = {};
    const country: Record<string, number> = {};

    for (const a of accounts) {
      status[a.status] = (status[a.status] || 0) + 1;
      const c = a.lastProxy?.country;
      if (c) country[c] = (country[c] || 0) + 1;
    }

    return { status, country };
  }, [accounts]);

  const countryEntries = useMemo(() => {
    return Object.entries(facetCounts.country)
      .filter(([code]) => code !== 'unknown')
      .sort((a, b) => b[1] - a[1]);
  }, [facetCounts.country]);

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
    handleFiltersChange({ status: new Set(), country: new Set() });
  };

  // ── Render helpers ──
  const renderSectionHeader = (label: string, section: SectionKey) => {
    const count = getSectionCount(filters, section);
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
          {count > 0 && (
            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md leading-none min-w-[18px] text-center">
              {count}
            </span>
          )}
        </div>
        <Arrow className="size-3 text-text-secondary/40 group-hover:text-text-secondary/70 transition-colors shrink-0" />
      </button>
    );
  };

  const renderCheckbox = (
    label: string,
    count: number,
    checked: boolean,
    onChange: () => void,
    prefix?: React.ReactNode,
  ) => (
    <label className="flex items-center gap-2 py-1 rounded-md cursor-pointer text-[12.5px] text-text-secondary">
      <Checkbox checked={checked} onChange={onChange} size="sm" />
      <span className="flex items-center gap-2 flex-1">
        {prefix}
        {label}
      </span>
      <span className="font-mono text-[10.5px] text-text-secondary/60">
        {count.toLocaleString()}
      </span>
    </label>
  );

  // ── Render ──
  return (
    <div className="w-[260px] shrink-0 bg-card-background border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Views */}
      <ViewsPanel
        onViewSelect={onViewSelect}
        selectedViewId={selectedViewId}
        className="border-b-0 bg-transparent"
      />

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
        {/* Status */}
        <div>
          {renderSectionHeader('Status', 'status')}
          {!collapsed.has('status') && (
            <div className="mt-1 space-y-0.5 px-3">
              {Object.entries(STATUS_LABELS).map(([key, label]) =>
                renderCheckbox(
                  label,
                  facetCounts.status[key] || 0,
                  filters.status.has(key),
                  () =>
                    handleFiltersChange({
                      ...filters,
                      status: toggleSet(filters.status, key),
                    }),
                  <span
                    className={`size-1.5 rounded-full ${STATUS_DOT_CLASS[key] || 'bg-text-secondary/40'}`}
                  />,
                ),
              )}
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          {renderSectionHeader('Country', 'country')}
          {!collapsed.has('country') && (
            <div className="mt-1 space-y-0.5 px-3">
              {countryEntries.length > 0 ? (
                countryEntries.map(([code, count]) =>
                  renderCheckbox(
                    `${COUNTRY_NAMES[code] || code}`,
                    count,
                    filters.country.has(code),
                    () =>
                      handleFiltersChange({
                        ...filters,
                        country: toggleSet(filters.country, code),
                      }),
                    <span>{COUNTRY_FLAGS[code] || '🏳'}</span>,
                  ),
                )
              ) : (
                <div className="text-[11px] text-text-secondary/40 italic px-1.5 py-1">
                  No country data
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
