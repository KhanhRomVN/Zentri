import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../shared/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  PlusCircle,
  Search,
  Zap,
  Network,
  Monitor,
  Eye,
} from 'lucide-react';
import { useAccentColors } from '../hooks/useAccentColors';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  activePage: string;
  onNavigate: (href: string) => void;
}

// ─── Color Helper ──────────────────────────────────────────────────────────
// Helper to get color for a nav item (deterministic based on item href)
let accentColorsCache: string[] = ['rgb(54, 134, 255)'];
let unifiedAccentCache = 'rgb(54, 134, 255)';

export const setAccentColorsForSidebar = (colors: string[], unified: string) => {
  accentColorsCache = colors.length > 0 ? colors : [unified];
  unifiedAccentCache = unified;
};

const getItemColor = (href: string) => {
  let hash = 0;
  for (let i = 0; i < href.length; i++) {
    hash = href.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % accentColorsCache.length;
  const color = accentColorsCache[index] || accentColorsCache[0] || unifiedAccentCache;

  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const r = rgbMatch[0];
    const g = rgbMatch[1];
    const b = rgbMatch[2];
    return {
      base: color,
      bg: `rgba(${r}, ${g}, ${b}, 0.1)`,
      border: `rgba(${r}, ${g}, ${b}, 0.3)`,
      hover: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }
  return {
    base: color || unifiedAccentCache,
    bg: 'var(--sidebar-item-hover)',
    border: 'var(--divider)',
    hover: 'var(--sidebar-item-hover)',
  };
};

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    color: '#3b82f6',
    disabled: true,
  },
  {
    title: 'Emails',
    href: '/email',
    icon: Users,
    color: '#f59e0b',
  },
  {
    title: 'Forge',
    href: '/forge',
    icon: PlusCircle,
    color: '#22c55e',
    disabled: false,
  },
  {
    title: 'Filter',
    href: '/filter',
    icon: Search,
    color: '#eab308',
    disabled: false,
  },
  {
    title: 'Workflow',
    href: '/workflow',
    icon: Zap,
    color: '#6366f1',
    disabled: false,
  },
  {
    title: 'Proxy',
    href: '/proxy',
    icon: Network,
    color: '#06b6d4',
    disabled: false,
  },
  {
    title: 'Device',
    href: '/device',
    icon: Monitor,
    color: '#8b5cf6',
    disabled: false,
  },
];

const Sidebar = memo(
  ({ isCollapsed, setIsCollapsed: _setIsCollapsed, activePage, onNavigate }: SidebarProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { accentColors, UNIFIED_ACCENT } = useAccentColors();

    // Update the global color cache for getItemColor
    if (typeof accentColors !== 'undefined' && accentColors.length > 0) {
      setAccentColorsForSidebar(accentColors, UNIFIED_ACCENT);
    }

    const expanded = !isCollapsed || isHovered;

    useEffect(() => {
      // Check initial state
    }, []);

    const isSettingsActive = activePage === '/setting';

    return (
      <motion.div
        className="relative h-screen left-0 top-0 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: expanded ? 280 : 48 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-full shrink-0 bg-card/50 backdrop-blur-xl border border-l border-border flex flex-col z-10 overflow-y-auto [&::-webkit-scrollbar]:w-0">
          {/* Header */}
          <div
            className={cn(
              'w-full min-h-[47px] flex items-center shrink-0 border-b border-border py-1.5',
              expanded ? 'px-3 justify-start' : 'justify-center',
            )}
          >
            {expanded ? (
              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                <span className="font-bold text-xl tracking-tight opacity-100 transition-opacity duration-300">
                  Zentri
                </span>
              </div>
            ) : (
              <span className="font-bold text-sm tracking-tight">Z</span>
            )}
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              'flex flex-col gap-1 w-full py-2',
              expanded ? 'px-2' : 'px-0 items-center',
            )}
          >
            {NAV_ITEMS.map((item) => {
              const itemColor = getItemColor(item.href);
              const isActive = activePage === item.href;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    if (!item.disabled) {
                      onNavigate(item.href);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'group relative w-full flex items-center gap-3 transition-all duration-200',
                    expanded ? 'px-3 py-2 rounded-lg' : 'w-9 h-9 px-0 rounded-md justify-center',
                    !expanded && 'mx-auto',
                    !isActive && 'text-muted-foreground hover:text-foreground',
                    isActive && 'text-[--item-color]',
                    !expanded && 'border-l-2 border-solid',
                    !expanded && 'border-transparent',
                    !isActive && !item.disabled && 'hover:bg-sidebar-item-hover',
                    item.disabled && 'opacity-50 cursor-not-allowed grayscale pointer-events-none',
                  )}
                  style={
                    {
                      '--item-color': itemColor?.base || 'var(--foreground)',
                      background: isActive ? itemColor?.bg || undefined : undefined,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className={cn(
                      'flex items-center justify-center shrink-0',
                      expanded ? 'w-5 h-5' : 'w-4 h-4',
                    )}
                  >
                    <item.icon
                      className="w-full h-full"
                      style={{ color: isActive ? itemColor?.base : undefined }}
                    />
                  </div>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        'text-[13px] font-semibold truncate flex-1 text-left whitespace-nowrap overflow-hidden',
                      )}
                      style={
                        isActive ? { color: itemColor?.base || 'var(--foreground)' } : undefined
                      }
                    >
                      {item.title}
                    </motion.span>
                  )}
                  {/* Tooltip for collapsed mode */}
                  {!expanded && !item.disabled && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs font-medium rounded-md shadow-lg z-[100] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {item.title}
                      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45 transform" />
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          <div
            className={cn('mt-auto flex flex-col gap-1 w-full py-2', expanded ? 'px-2' : 'px-0')}
          >
            {(() => {
              const itemColor = getItemColor('/setting');
              return (
                <button
                  onClick={() => onNavigate('/setting')}
                  className={cn(
                    'group relative w-full flex items-center gap-3 transition-all duration-200',
                    expanded ? 'px-3 py-2 rounded-lg' : 'w-9 h-9 px-0 rounded-md justify-center',
                    !expanded && 'mx-auto',
                    !isSettingsActive && 'text-muted-foreground hover:text-foreground',
                    isSettingsActive && 'text-[--item-color]',
                    !expanded && 'border-l-2 border-solid',
                    !expanded && 'border-transparent',
                    !isSettingsActive && 'hover:bg-sidebar-item-hover',
                  )}
                  style={
                    {
                      '--item-color': itemColor?.base || 'var(--foreground)',
                      background: isSettingsActive ? itemColor?.bg || undefined : undefined,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className={cn(
                      'flex items-center justify-center shrink-0',
                      expanded ? 'w-5 h-5' : 'w-4 h-4',
                    )}
                  >
                    <SettingsIcon
                      className="w-full h-full"
                      strokeWidth={1.3}
                      style={{ color: isSettingsActive ? itemColor?.base : undefined }}
                    />
                  </div>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        'text-[13px] font-semibold truncate flex-1 text-left whitespace-nowrap overflow-hidden',
                      )}
                      style={
                        isSettingsActive
                          ? { color: itemColor?.base || 'var(--foreground)' }
                          : undefined
                      }
                    >
                      Settings
                    </motion.span>
                  )}
                  {/* Tooltip for collapsed mode */}
                  {!expanded && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs font-medium rounded-md shadow-lg z-[100] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Settings
                      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45 transform" />
                    </div>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </motion.div>
    );
  },
);

export default Sidebar;
