import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ProxyFilterState, ProxyFacetCounts } from '../types';
import { DISPLAY_STATUS_CONFIG } from '../constants';
import { Checkbox } from '../../../components/ui/Checkbox';

interface FilterPanelProps {
  facetCounts: ProxyFacetCounts;
  filters: ProxyFilterState;
  onFiltersChange: (filters: ProxyFilterState) => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  VN: '🇻🇳', US: '🇺🇸', DE: '🇩🇪', SG: '🇸🇬', GB: '🇬🇧',
  JP: '🇯🇵', BR: '🇧🇷', IN: '🇮🇳', NL: '🇳🇱', FR: '🇫🇷',
  CA: '🇨🇦', AU: '🇦🇺',
};

const COUNTRY_NAMES: Record<string, string> = {
  VN: 'Vietnam', US: 'United States', DE: 'Germany', SG: 'Singapore',
  GB: 'United Kingdom', JP: 'Japan', BR: 'Brazil', IN: 'India',
  NL: 'Netherlands', FR: 'France', CA: 'Canada', AU: 'Australia',
};

const STATUS_CHECKBOX_CLASS: Record<string, string> = {
  healthy: 'bg-success text-white',
  degraded: 'bg-warn text-black',
  dead: 'bg-error text-white',
  testing: 'bg-purple text-white',
};

function toggleSet(set: Set<string>, val: string): Set<string> {
  const next = new Set(set);
  if (next.has(val)) next.delete(val);
  else next.add(val);
  return next;
}

function hasAnyFilter(filters: ProxyFilterState): boolean {
  return (
    filters.status.size > 0 ||
    filters.protocol.size > 0 ||
    filters.source.size > 0 ||
    filters.type.size > 0 ||
    filters.country.size > 0
  );
}

type SectionKey = 'status' | 'protocol' | 'source' | 'type' | 'country';

function getSectionCount(filters: ProxyFilterState, section: SectionKey): number {
  return filters[section].size;
}

export default function FilterPanel({ facetCounts, filters, onFiltersChange }: FilterPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<SectionKey>>(new Set());

  const toggleSection = (key: SectionKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const countryEntries = useMemo(() => {
    return Object.entries(facetCounts.country)
      .filter(([code]) => code !== 'unknown')
      .sort((a, b) => b[1] - a[1]);
  }, [facetCounts.country]);

  const handleClearAll = () => {
    onFiltersChange({
      ...filters,
      status: new Set(),
      protocol: new Set(),
      source: new Set(),
      type: new Set(),
      country: new Set(),
    });
  };

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
    checkboxClassName?: string,
  ) => (
    <label className="flex items-center gap-2 py-1 rounded-md cursor-pointer text-[12.5px] text-text-secondary">
      <Checkbox checked={checked} onChange={onChange} size="sm" className={checkboxClassName} />
      <span className="flex items-center gap-2 flex-1">
        {prefix}
        {label}
      </span>
      <span className="font-mono text-[10.5px] text-text-secondary/60">{count.toLocaleString()}</span>
    </label>
  );

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
        {/* Status */}
        <div>
          {renderSectionHeader('Status', 'status')}
          {!collapsed.has('status') && (
            <div className="mt-1 space-y-0.5 px-3">
              {Object.entries(DISPLAY_STATUS_CONFIG).map(([key, cfg]) =>
                renderCheckbox(
                  cfg.label,
                  facetCounts.status[key] || 0,
                  filters.status.has(key),
                  () =>
                    onFiltersChange({
                      ...filters,
                      status: toggleSet(filters.status, key),
                    }),
                  <span className={`size-1.5 rounded-full ${cfg.dotClass}`} />,
                ),
              )}
            </div>
          )}
        </div>

        {/* Protocol */}
        <div>
          {renderSectionHeader('Protocol', 'protocol')}
          {!collapsed.has('protocol') && (
            <div className="mt-1 space-y-0.5 px-3">
              {renderCheckbox('HTTP', facetCounts.protocol['http'] || 0, filters.protocol.has('http'), () =>
                onFiltersChange({ ...filters, protocol: toggleSet(filters.protocol, 'http') }),
              )}
              {renderCheckbox('SOCKS5', facetCounts.protocol['socks5'] || 0, filters.protocol.has('socks5'), () =>
                onFiltersChange({ ...filters, protocol: toggleSet(filters.protocol, 'socks5') }),
              )}
            </div>
          )}
        </div>

        {/* Source */}
        <div>
          {renderSectionHeader('Source', 'source')}
          {!collapsed.has('source') && (
            <div className="mt-1 space-y-0.5 px-3">
              {renderCheckbox('Datacenter', facetCounts.source['datacenter'] || 0, filters.source.has('datacenter'), () =>
                onFiltersChange({ ...filters, source: toggleSet(filters.source, 'datacenter') }),
              )}
              {renderCheckbox('Residential', facetCounts.source['residential'] || 0, filters.source.has('residential'), () =>
                onFiltersChange({ ...filters, source: toggleSet(filters.source, 'residential') }),
              )}
              {renderCheckbox('Mobile', facetCounts.source['mobile'] || 0, filters.source.has('mobile'), () =>
                onFiltersChange({ ...filters, source: toggleSet(filters.source, 'mobile') }),
              )}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          {renderSectionHeader('Type', 'type')}
          {!collapsed.has('type') && (
            <div className="mt-1 space-y-0.5 px-3">
              {renderCheckbox('Private', facetCounts.type['private'] || 0, filters.type.has('private'), () =>
                onFiltersChange({ ...filters, type: toggleSet(filters.type, 'private') }),
              )}
              {renderCheckbox('Shared', facetCounts.type['shared'] || 0, filters.type.has('shared'), () =>
                onFiltersChange({ ...filters, type: toggleSet(filters.type, 'shared') }),
              )}
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          {renderSectionHeader('Country', 'country')}
          {!collapsed.has('country') && (
            <div className="mt-1 space-y-0.5 px-3">
              {countryEntries.map(([code, count]) =>
                renderCheckbox(
                  `${COUNTRY_NAMES[code] || code}`,
                  count,
                  filters.country.has(code),
                  () =>
                    onFiltersChange({ ...filters, country: toggleSet(filters.country, code) }),
                  <span>{COUNTRY_FLAGS[code] || '🏳'}</span>,
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}