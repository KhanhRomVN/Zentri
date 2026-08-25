/**
 * FORGE Sidebar — danh sách nền tảng + search bar + button thêm mới.
 */

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Platform } from '../types';
import { getPlatformColor, getPlatformInitials } from '../constants/platforms';
import { cn } from '@renderer/shared/lib/utils';

interface SidebarProps {
  platforms: Platform[];
  activePlatformId?: string;
  onSelectDashboard: () => void;
  onSelectPlatform: (platformId: string) => void;
  onOpenAddPlatform: () => void;
}

const Sidebar = ({
  platforms,
  activePlatformId,
  onSelectDashboard,
  onSelectPlatform,
  onOpenAddPlatform,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) return platforms;
    const q = searchQuery.toLowerCase();
    return platforms.filter((p) => p.name?.toLowerCase().includes(q));
  }, [platforms, searchQuery]);

  return (
    <aside className="w-[320px] shrink-0 flex flex-col h-full bg-card/50 border-r border-border overflow-hidden">
      {/* Search bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nền tảng..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Platform list */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Dashboard entry */}
        <button
          type="button"
          onClick={onSelectDashboard}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-muted-foreground hover:bg-sidebar-item-hover hover:text-foreground transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span className="text-[13px] font-medium">Tổng quan</span>
        </button>

        <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Nền tảng
        </div>

        {filteredPlatforms.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Chưa có nền tảng nào
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredPlatforms.map((platform) => {
              const isActive = platform.id === activePlatformId;
              const color = getPlatformColor(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => onSelectPlatform(platform.id)}
                  className={cn(
                    'group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-left transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-item-hover hover:text-foreground',
                  )}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: color, color: '#0a0a0c' }}
                  >
                    {getPlatformInitials(platform.name || '?')}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium">{platform.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add platform button */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={onOpenAddPlatform}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm nền tảng
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
