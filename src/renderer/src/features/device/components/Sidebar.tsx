import { FC } from 'react';
import { ChevronRight } from 'lucide-react';
import { Device, DeviceFilterState, DeviceFacetCounts } from '../types';
import { FLEET_OPTIONS, STATUS_CONFIG, PLATFORM_OPTIONS } from '../constants';
import { cn } from '../../../shared/lib/utils';

interface SidebarProps {
  devices: Device[];
  facetCounts: DeviceFacetCounts;
  filters: DeviceFilterState;
  onFiltersChange: (updater: (prev: DeviceFilterState) => DeviceFilterState) => void;
}

function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const Sidebar: FC<SidebarProps> = ({ devices, facetCounts, filters, onFiltersChange }) => {
  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-card/10 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-5">
        {/* Fleet section */}
        <div>
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
            Fleet
          </div>
          <div className="space-y-0.5">
            {FLEET_OPTIONS.map((opt) => {
              const isActive = filters.fleet.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    onFiltersChange((prev) => ({
                      ...prev,
                      fleet: new Set([opt.id]),
                    }))
                  }
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:bg-sidebar-item-hover hover:text-text-primary',
                  )}
                >
                  <opt.icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{opt.label}</span>
                  <span className="text-[11px] text-text-tertiary">
                    {opt.id === 'all' ? devices.length : facetCounts.fleet[opt.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
            Status
            <ChevronRight className="size-3" />
          </div>
          <div className="space-y-0.5">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const isActive = filters.status.has(key);
              return (
                <button
                  key={key}
                  onClick={() =>
                    onFiltersChange((prev) => ({
                      ...prev,
                      status: toggleSet(prev.status, key),
                    }))
                  }
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-tertiary hover:text-text-secondary',
                  )}
                >
                  <span className={cn('size-2 rounded-full', cfg.dotClass)} />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  <span className="text-[11px] text-text-tertiary">
                    {facetCounts.status[key] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform filter */}
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
            Platform
            <ChevronRight className="size-3" />
          </div>
          <div className="space-y-0.5">
            {PLATFORM_OPTIONS.map((platform) => {
              const isActive = filters.platform.has(platform);
              return (
                <button
                  key={platform}
                  onClick={() =>
                    onFiltersChange((prev) => ({
                      ...prev,
                      platform: toggleSet(prev.platform, platform),
                    }))
                  }
                  className={cn(
                    'w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-tertiary hover:text-text-secondary',
                  )}
                >
                  <span>{platform}</span>
                  <span className="text-[11px] text-text-tertiary">
                    {facetCounts.platform[platform] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group filter */}
        {Object.keys(facetCounts.group).length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
              Group
              <ChevronRight className="size-3" />
            </div>
            <div className="space-y-0.5">
              {Object.entries(facetCounts.group).map(([group, count]) => {
                const isActive = filters.group.has(group);
                return (
                  <button
                    key={group}
                    onClick={() =>
                      onFiltersChange((prev) => ({
                        ...prev,
                        group: toggleSet(prev.group, group),
                      }))
                    }
                    className={cn(
                      'w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                      isActive
                        ? 'text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    <span>{group}</span>
                    <span className="text-[11px] text-text-tertiary">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags filter */}
        {Object.keys(facetCounts.tags).length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-text-tertiary">
              Tags
              <ChevronRight className="size-3" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(facetCounts.tags).map(([tag, count]) => {
                const isActive = filters.tags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      onFiltersChange((prev) => ({
                        ...prev,
                        tags: toggleSet(prev.tags, tag),
                      }))
                    }
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border',
                      isActive
                        ? 'bg-primary/20 text-primary border-primary/50'
                        : 'bg-panel text-text-secondary border-border hover:text-text-primary',
                    )}
                  >
                    {tag} <span className="ml-1 text-text-tertiary">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;