import { FC, useMemo } from 'react';
import { Bookmark, Folder } from 'lucide-react';
import { cn } from '../../../../../../shared/lib/utils';
import type { BookmarkGroup } from '../types';

interface SidebarProps {
  bookmarkBar: BookmarkGroup;
  otherGroups: BookmarkGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// ─── Color Helper ──────────────────────────────────────────────────────────
const PALETTE = [
  'rgb(54, 134, 255)',   // blue
  'rgb(245, 158, 11)',   // amber
  'rgb(34, 197, 94)',    // green
  'rgb(99, 102, 241)',   // indigo
  'rgb(6, 182, 212)',    // cyan
  'rgb(236, 72, 153)',   // pink
  'rgb(168, 85, 247)',   // purple
  'rgb(239, 68, 68)',    // red
];

const getItemColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  const color = PALETTE[index];

  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0];
    const g = rgbMatch[1];
    const b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.1)`,
    };
  }
  return { base: color, bg: 'transparent' };
};

// ─── Sidebar Item ──────────────────────────────────────────────────────────

const SidebarItem: FC<{
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  itemColor: ReturnType<typeof getItemColor>;
}> = ({ icon, label, count, active, onClick, itemColor }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-left',
      active
        ? 'font-semibold'
        : 'text-foreground/60 hover:bg-muted/30 hover:text-foreground/80',
    )}
    style={
      {
        color: active ? itemColor.base : undefined,
        background: active ? itemColor.bg : undefined,
      } as React.CSSProperties
    }
  >
    <span className="shrink-0" style={{ color: active ? itemColor.base : undefined }}>
      {icon}
    </span>
    <span
      className="truncate flex-1 text-[13px] font-semibold"
      style={active ? { color: itemColor.base } : undefined}
    >
      {label}
    </span>
    {count !== undefined && count > 0 && (
      <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md text-muted-foreground/50">
        {count}
      </span>
    )}
  </button>
);

// ─── Main Sidebar ──────────────────────────────────────────────────────────

const Sidebar: FC<SidebarProps> = ({
  bookmarkBar,
  otherGroups,
  selectedId,
  onSelect,
}) => {
  const barCount = bookmarkBar.children.reduce(
    (sum, c) => sum + (c.type === 'url' ? 1 : c.children.filter((x) => x.type === 'url').length),
    0,
  );

  const barColor = useMemo(() => getItemColor('bookmark_bar'), []);

  return (
    <div className="w-[260px] h-full flex flex-col border-r border-border bg-background/50 shrink-0">
      {/* Title */}
      <div className="flex items-center px-4 h-[39px] border-b border-border shrink-0">
        <span className="text-sm font-black tracking-tight text-foreground/80">
          Bookmark Manager
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar px-2 py-2 space-y-0.5">
        {/* Overview label */}
        <div className="px-3 pt-1 pb-1.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
            Overview
          </span>
        </div>

        {/* Bookmark Bar */}
        <SidebarItem
          icon={<Bookmark className="w-3.5 h-3.5" />}
          label="Bookmark Bar"
          count={barCount}
          active={selectedId === 'bookmark_bar'}
          onClick={() => onSelect('bookmark_bar')}
          itemColor={barColor}
        />

        {/* Other Bookmarks label */}
        {otherGroups.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                Other Bookmarks
              </span>
            </div>
            {otherGroups.map((group) => {
              const count = group.children.reduce(
                (sum, c) =>
                  sum + (c.type === 'url' ? 1 : c.children.filter((x) => x.type === 'url').length),
                0,
              );
              const groupColor = getItemColor(group.id);
              return (
                <SidebarItem
                  key={group.id}
                  icon={<Folder className="w-3.5 h-3.5" />}
                  label={group.name}
                  count={count}
                  active={selectedId === group.id}
                  onClick={() => onSelect(group.id)}
                  itemColor={groupColor}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;