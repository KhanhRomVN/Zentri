import { FC, useState } from 'react';
import { ProxyFilterState } from '../types';
import { Filter, RefreshCcw, ChevronDown } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../components/ui/Dropdown';
import { Button } from '../../../components/ui/Button';
import { FILTER_OPTIONS } from '../constants';

interface ProxyFilterProps {
  filters: ProxyFilterState;
  onFilterChange: (filters: ProxyFilterState) => void;
  disabled?: boolean;
}

const ProxyFilter: FC<ProxyFilterProps> = ({ filters, onFilterChange, disabled }) => {
  const [searchColumn, setSearchColumn] = useState('');

  const updateFilter = (key: keyof ProxyFilterState, value: string) => {
    if (disabled) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const getLabel = (key: keyof ProxyFilterState, value: string): string => {
    const options = FILTER_OPTIONS[key as keyof typeof FILTER_OPTIONS];
    if (!options) return value;
    const found = options.find((o) => o.value === value);
    return found?.label || value;
  };

  const filterGroups: Array<{
    key: keyof ProxyFilterState;
    label: string;
    options: Array<{ value: string; label: string }>;
  }> = [
    { key: 'proxyType', label: 'Configuration Type', options: FILTER_OPTIONS.proxyType },
    { key: 'sourceType', label: 'Network Source', options: FILTER_OPTIONS.sourceType },
    { key: 'protocol', label: 'Protocol Matrix', options: FILTER_OPTIONS.protocol },
    { key: 'status', label: 'Node Vitality', options: FILTER_OPTIONS.status },
  ];

  const hasActiveFilters = filters.proxyType !== 'all' || filters.sourceType !== 'all' || filters.protocol !== 'all' || filters.status !== 'all';

  return (
    <div
      className={cn(
        'w-[320px] border-r border-border/50 bg-muted/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-500',
        disabled && 'opacity-50 pointer-events-none grayscale-[0.5]',
      )}
    >
      {/* Sidebar Header */}
      <div className="min-h-[48px] flex items-center justify-between px-4 border-b border-border/50 sticky top-0 bg-background/50 backdrop-blur-md z-10 transition-all duration-500">
        <div className="flex items-center gap-2.5">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-foreground/80">
            Filter Controls
          </span>
          {hasActiveFilters && (
            <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              {[filters.proxyType, filters.sourceType, filters.protocol, filters.status].filter(v => v !== 'all').length}
            </span>
          )}
        </div>
        {!disabled && hasActiveFilters && (
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

      <div className="p-4 space-y-6">
        {filterGroups.map((group) => {
          const currentValue = filters[group.key] || 'all';
          const currentLabel = getLabel(group.key, currentValue);

          return (
            <div key={group.key} className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-wider ml-0.5">
                {group.label}
              </label>
              <Dropdown>
                <DropdownTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between h-9 text-sm font-medium"
                  >
                    <span className="truncate">{currentLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2" />
                  </Button>
                </DropdownTrigger>
                <DropdownContent className="min-w-[200px] max-h-[250px] overflow-y-auto">
                  {group.options.map((option) => (
                    <DropdownItem
                      key={option.value}
                      onClick={() => {
                        updateFilter(group.key, option.value);
                        setSearchColumn('');
                      }}
                      className={cn(
                        'text-sm',
                        currentValue === option.value && 'bg-primary/10 text-primary font-semibold',
                      )}
                    >
                      {option.label}
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProxyFilter;