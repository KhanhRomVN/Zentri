import { Search, Globe, Smartphone, SlidersHorizontal } from 'lucide-react';
import type { Platform, WorkflowStatus } from '../types';
import { STATUS_META } from '../constants';
import { cn } from '../../../shared/lib/utils';

export type PlatformFilter = 'all' | Platform;
export type StatusFilter = 'all' | WorkflowStatus;

interface FilterBarProps {
  platformFilter: PlatformFilter;
  statusFilter: StatusFilter;
  search: string;
  onPlatformChange: (value: PlatformFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSearchChange: (value: string) => void;
}

export const FilterBar = ({
  platformFilter,
  statusFilter,
  search,
  onPlatformChange,
  onStatusChange,
  onSearchChange,
}: FilterBarProps) => {
  return (
    <div className="flex items-center gap-2 mb-3.5 shrink-0 flex-wrap">
      <button
        onClick={() => onPlatformChange('all')}
        className={cn(
          'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
          platformFilter === 'all'
            ? 'border-transparent bg-teal/10 text-teal'
            : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
        )}
      >
        All Platforms
      </button>
      <button
        onClick={() => onPlatformChange('website')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
          platformFilter === 'website'
            ? 'border-transparent bg-yellow/10 text-yellow'
            : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
        )}
      >
        <Globe className="h-3 w-3" />
        Website
      </button>
      <button
        onClick={() => onPlatformChange('mobile')}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
          platformFilter === 'mobile'
            ? 'border-transparent bg-green/10 text-green'
            : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
        )}
      >
        <Smartphone className="h-3 w-3" />
        Mobile
      </button>

      <span className="mx-1 h-4 w-px bg-border" />

      {(Object.keys(STATUS_META) as WorkflowStatus[]).map((status) => {
        const meta = STATUS_META[status];
        const isActive = statusFilter === status;
        return (
          <button
            key={status}
            onClick={() => onStatusChange(isActive ? 'all' : status)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
              isActive
                ? 'border-transparent'
                : 'border-border text-text-secondary hover:border-border-hover hover:text-text-primary',
            )}
            style={isActive ? { background: meta.bg, color: meta.color } : undefined}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-2">
        <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-input-background px-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workflows..."
            className="w-80 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-secondary"
          />
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          title="More filters"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};