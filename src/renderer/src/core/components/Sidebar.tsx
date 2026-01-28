import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../shared/lib/utils';
import {
  LayoutDashboard,
  Mail,
  Users,
  Palette,
  FoldHorizontal,
  UnfoldHorizontal,
  RefreshCw,
} from 'lucide-react';
import ThemeDrawer from '../theme/components/ThemeDrawer';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      color: '#3b82f6', // blue-500
    },
    {
      title: 'Mail',
      href: '/mail',
      icon: Mail,
      color: '#a855f7', // purple-500
    },
    {
      title: 'Accounts',
      href: '/email',
      icon: Users,
      color: '#f59e0b', // amber-500
    },
  ];

  // Mock version and update status for UI consistency
  const isChecking = false;

  return (
    <div
      className={cn(
        'flex flex-col h-screen fixed left-0 top-0 bg-card/50 backdrop-blur-xl border-r border-border transition-[width] duration-300 ease-in-out z-50 will-change-[width]',
        isCollapsed ? 'w-[60px]' : 'w-[280px]',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-border/50 transition-[padding] duration-300 overflow-hidden shrink-0',
          isCollapsed ? 'justify-center px-0' : 'px-4 justify-between',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 overflow-hidden whitespace-nowrap',
            isCollapsed && 'hidden',
          )}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            Z
          </div>
          <span className="font-bold text-xl tracking-tight opacity-100 transition-opacity duration-300">
            Zentri
          </span>
        </div>

        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg animate-in fade-in zoom-in duration-300">
            Z
          </div>
        )}

        {!isCollapsed && (
          <div className="flex items-center gap-1 opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setIsThemeDrawerOpen(true)}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              title="Theme Settings"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Collapse Sidebar"
            >
              <FoldHorizontal className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 py-4 space-y-2',
          isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto custom-scrollbar',
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 py-3 text-sm font-medium rounded-xl transition-all relative group',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                isCollapsed
                  ? 'justify-center px-0 mx-0 w-full'
                  : 'px-4 mx-2 rounded-r-none rounded-l-md',
              )
            }
            style={({ isActive }) => ({
              borderRight: isActive && !isCollapsed ? `3px solid ${item.color}` : 'none',
              background: isActive
                ? `linear-gradient(to right, ${item.color}15, transparent)`
                : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isActive && isCollapsed && 'drop-shadow-md',
                  )}
                  style={{ color: isActive ? item.color : undefined }}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.title}
                  </span>
                )}

                {/* Gradient on hover for non-active items */}
                {!isActive && (
                  <div
                    className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                      !isCollapsed && 'rounded-l-md',
                    )}
                    style={{
                      background: `linear-gradient(to right, ${item.color}08, transparent)`,
                    }}
                  />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs font-medium rounded-md shadow-lg z-[100] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {item.title}
                    {/* Triangle arrow */}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45 transform" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'mt-auto border-t border-border/50 transition-all duration-300',
          isCollapsed ? 'p-2 flex flex-col items-center gap-4' : 'p-4',
        )}
      >
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 w-full">
            <button
              onClick={() => setIsThemeDrawerOpen(true)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              title="Theme Settings"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Expand Sidebar"
            >
              <UnfoldHorizontal className="w-5 h-5" />
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1">
              <button
                disabled={isChecking}
                className={cn(
                  'p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all',
                  isChecking && 'animate-spin text-primary',
                )}
                title="Check for updates"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ThemeDrawer isOpen={isThemeDrawerOpen} onClose={() => setIsThemeDrawerOpen(false)} />
    </div>
  );
};

export default Sidebar;
