import { memo, useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../shared/lib/utils';
import {
  LayoutDashboard,
  Users,
  Palette,
  FoldHorizontal,
  UnfoldHorizontal,
  Settings as SettingsIcon,
  UploadCloud,
  AlertCircle,
  Loader2,
  PlusCircle,
  Search,
  FileCode,
  FolderTree,
  Network,
} from 'lucide-react';
import ThemeDrawer from '../theme/components/ThemeDrawer';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    color: '#3b82f6', // blue-500
  },
  {
    title: 'Email',
    href: '/email',
    icon: Users,
    color: '#f59e0b', // amber-500
  },
  {
    title: 'Reg',
    href: '/reg',
    icon: PlusCircle,
    color: '#22c55e', // green-500
  },
  {
    title: 'Search',
    href: '/search',
    icon: Search,
    color: '#eab308', // yellow-500
    disabled: true,
  },
  {
    title: 'Script',
    href: '/script',
    icon: FileCode,
    color: '#6366f1', // indigo-500
    disabled: true,
  },
  {
    title: 'Category',
    href: '/category',
    icon: FolderTree,
    color: '#ec4899', // pink-500
    disabled: true,
  },
  {
    title: 'Proxy',
    href: '/proxy',
    icon: Network,
    color: '#06b6d4', // cyan-500
  },
  {
    title: 'Settings',
    href: '/setting',
    icon: SettingsIcon,
    color: '#64748b', // slate-500
    disabled: true,
  },
];

const Sidebar = memo(({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsDirty(localStorage.getItem('zentri_is_dirty') === 'true');

    const handleStatusChange = (e: any) => {
      setIsDirty(e.detail?.isDirty ?? localStorage.getItem('zentri_is_dirty') === 'true');
    };

    window.addEventListener('zentri:sync-status-changed', handleStatusChange);
    return () => window.removeEventListener('zentri:sync-status-changed', handleStatusChange);
  }, []);

  const handleSyncToCloud = async () => {
    const folderPath = localStorage.getItem('gitlab_repo_folder');
    if (!folderPath) return;

    setSyncing(true);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('git:sync-repo', folderPath);

      if (result && result.success) {
        // Success
        localStorage.setItem('zentri_is_dirty', 'false');
        setIsDirty(false);
        window.dispatchEvent(
          new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: false } }),
        );
      } else {
        throw new Error(result?.error || 'Unknown git error');
      }
    } catch (err: any) {
      console.error('Local Git Sync Failed:', err);
      alert(`Sync failed: ${err.message}. Make sure the folder is a valid Git repository.`);
    } finally {
      setSyncing(false);
    }
  };

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
          'flex-1 py-4 space-y-1',
          isCollapsed ? 'overflow-visible px-2' : 'overflow-y-auto custom-scrollbar',
        )}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={(e) => item.disabled && e.preventDefault()}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 py-3 text-sm font-medium rounded-none transition-all relative group',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                isCollapsed ? 'justify-center px-0 mx-0 w-full mb-1' : 'px-4 mb-1',
                item.disabled && 'opacity-50 cursor-not-allowed grayscale pointer-events-none',
              )
            }
            style={({ isActive }) => ({
              background: isActive
                ? `linear-gradient(to right, ${item.color}15, transparent)`
                : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && !isCollapsed && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-lg"
                    style={{ backgroundColor: item.color }}
                  />
                )}
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
                {isCollapsed && (
                  <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs font-medium rounded-md shadow-lg z-[100] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {item.title}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-popover border-l border-b border-border rotate-45 transform" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sync Footer */}
      {isDirty && (
        <div
          className={cn(
            'px-4 py-4 mb-2 mx-2 rounded-2xl border transition-all duration-300 animate-in slide-in-from-bottom-4',
            'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5',
            isCollapsed && 'px-0 mx-2 p-3 justify-center border-amber-500/40 bg-amber-500/10',
          )}
        >
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Unsaved Changes</span>
              </div>
              <button
                disabled={syncing}
                onClick={handleSyncToCloud}
                className="w-full h-10 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-95 shadow-md shadow-amber-500/20"
              >
                {syncing ? (
                  <Loader2 className="w-3.h-3 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                {syncing ? 'Syncing...' : 'Sync to Cloud'}
              </button>
            </div>
          ) : (
            <button
              disabled={syncing}
              onClick={handleSyncToCloud}
              className="relative w-10 h-10 rounded-md bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all active:scale-90"
              title="Unsaved Changes - Sync Now"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </button>
          )}
        </div>
      )}

      {/* Settings/Collapse Footer (Only in Collapsed Mode) */}
      {isCollapsed && (
        <div
          className={cn('mt-auto transition-all duration-300 flex flex-col items-center gap-2 p-2')}
        >
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsThemeDrawerOpen(true)}
              className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <UnfoldHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <ThemeDrawer isOpen={isThemeDrawerOpen} onClose={() => setIsThemeDrawerOpen(false)} />
    </div>
  );
});

export default Sidebar;
